const fs = require('fs')
const fsp= fs.promises
const express = require('express')
const cookieParse= require('cookie-parser')
const sqlite= require('sqlite')
const sqlite3 = require('sqlite3')
const multer = require('multer')
const uploader = multer({ dest: __dirname + '/uploads/' })
const svgCaptcha = require('svg-captcha')
const app = express()
const WebSocket = require('ws')
const http = require('http')
const server = http.createServer(app)//express返回的app就是用来传给createServer的
const wss = new WebSocket.Server({ server })
const port = 5000
let db
let sessionStore = Object.create(null)
let voteIdMapWs= {}

//WebSocket轮询
wss.on('connection', async (ws, req) => {
  console.log('ws')
  let voteId = req.url.split('/').slice(-1)[0]
  let voteInfo = await db.get(
    'SELECT * FROM votes WHERE voteid= ?', voteId
  )

  if (Date.now() > (new Date(voteInfo.deadline)).getTime()) {
    ws.close()
  }
  if (voteId in voteIdMapWs) {
    voteIdMapWs[voteId].push(ws)
  } else {
    voteIdMapWs[voteId]= [false, ws]
  }
  ws.on('close', () => {
    voteIdMapWs[voteId]= voteIdMapWs[voteId].filter(it=>it !== ws)
  })
})

//响应WebSocket的轮询
async function broadcast(voteId) {
  let websockets= voteIdMapWs[voteId] || []
  let voted = await db.all(
    'SELECT * FROM voted WHERE voteid= ?', voteId
  )

  for (ws of websockets) {
    if (typeof ws !== 'boolean') {
      ws.send(JSON.stringify(voted))
    }
  }
}

//轮询节流
function throttle(voteId, time) {
  if (voteIdMapWs[voteId][0]) {
    return
  } else {
    voteIdMapWs[voteId][0]= true
    setTimeout(() => {
      broadcast(voteId)
      voteIdMapWs[voteId][0]= false
    }, time)
  }
}


app.locals.pretty = true
//前端组件打包在build
app.use(express.static(__dirname + '/build'))
app.use((req, res, next)=>{
  console.log(req.method, req.url)
  next()
})
app.use(express.static(__dirname + '/static'))
app.use('/uploads', express.static(__dirname + '/uploads'))
app.use(express.json())
app.use(express.urlencoded())

//引入数据库数据
sqlite.open({
  filename: __dirname + '/vote.db',
  driver: sqlite3.Database
}).then(value => {
  db= value
})

//解析签名的cookie内容
app.use(cookieParse('abskd234'))

app.use(async (req, res, next) => {
  if (req.signedCookies.user) {
    req.user = await db.get(
      'SELECT rowId AS id, * FROM users WHERE name= ?',
      req.signedCookies.user
    )
    // console.log(req.user)
  }
  // 从签名cookie中找出该用户的信息并挂在req对象上以供后续的中间件访问
  next()
})


//sessionId cookie创建
app.use(function sessionMW(req, res, next) {
  if (req.cookies.sessionId) {
    req.session = sessionStore[req.cookies.sessionId]
    if (!req.session) {
      req.session = sessionStore[req.cookies.sessionId] = {}
    }
  } else {
    let id = Math.random().toString(16).slice(2)

    req.session = sessionStore[id] = {}
    res.cookie('sessionId', id, {
      maxAge: 86400000,
    })
  }
  next()
})


//头像上传
app.post('/upload', uploader.single('avatar'), (req, res) => {
  // console.log(req.file)
  res.json({src:req.file.filename})
})

// /username-conflict-check?name=lily
//用户名冲突检测
app.get('/username-conflict-check', async (req, res, next) => {
  let user = await db.get(
    'SELECT * FROM users WHERE name= ?', req.query.name
  )

  if (user) {
    res.json({
      code: 0,
      msg: '用户名已被占用'
    })
  } else {
    res.json({
      code: 1,
      msg: '用户名可用'
    })
  }
})

//注册信息提交
app.post('/register', async (req, res) => {
  let user= req.body

  try {
    await db.run(
      'INSERT INTO users VALUES (?, ?, ?, ?)',
      [user.name, user.password, user.email, user.avatar]
    )
    res.json({
      result: '注册成功',
      code: 1
    })
  } catch (e) {
    res.json({
      result: e.toString(),
      code: 0,
    })
  }
})


//首页&登录
app.route('/login')
  .get((req, res) => {
    if (req.user) {
      res.json({
        user:req.user
      })
    } else {
      res.json({
        user: false
      })
    }
  })
  .post(async (req, res, next) => {
    //验证码验证
    if (req.body.captcha !== req.session.captcha) {
      res.json({
        code: 2,
        msg: '验证码错误'
      })
      return
    }
    let loginUser = req.body
    let user= await db.get(
      'SELECT * FROM users WHERE name= ? AND password= ?',
      [loginUser.name, loginUser.password]
    )

    if(user){
      res.cookie('user', user.name, {
        maxAge: 86400000,//用来告诉浏览器此cookie多久过期(单位是秒)
        signed: true //签名cookie
      })
      // res.cookie('username', user.name, {
      //   maxAge: 86400000
      // })//不签名cookie
      res.json({
        code: 1,
        msg: '登录成功, 跳到首页'
      })
    }else{
      res.status(401).json({
        code: 0,
        msg: '登录失败，用户名或密码错误'
      })
    }
  })


//获取验证码图片
app.get('/captcha/:id', function (req, res) {
  let captcha = svgCaptcha.create()

  req.session.captcha = captcha.text
  res.type('svg');
  res.status(200).send(captcha.data)
});


// //退出登录
// app.get('/logout', (req, res)=>{
//   res.clearCookie('user')
//   res.redirect(302, '/')
// })

//提交创建投票项目信息
app.post('/createVote', async (req, res) => {
  let vote = req.body
  let newVote

  await db.run(
    'INSERT INTO votes VALUES (?, ?, ?, ?, ?, ?, ?)',
    [null, req.user.name, vote.topic, vote.directions, vote.multiple, vote.deadline, vote.hideName]
  )
  newVote = await db.get(
    'select voteid from votes where rowid = last_insert_rowid()',
  )
  for (let i = 0; i < vote.options.length; i++){
    await db.run(
      'INSERT INTO options VALUES (?, ?, ?)',
      [null, newVote.voteid, vote.options[i].value]
    )
  }
  res.json({
    voteId: newVote.voteid
  })
})


//获取投票页面以及投票数据提交
app.route('/voting/:id')
  .get(async (req, res) => {
    let votes= await db.get(
      'SELECT * FROM votes WHERE voteid= ?', req.params.id
    )
    let options= await db.all(
      'SELECT * FROM options WHERE voteid= ? ORDER BY optionid', req.params.id
    )
    let voted= await db.all(
      'SELECT * FROM voted WHERE voteid= ? ORDER BY optionid', req.params.id
    )
    
    res.json({
      votes,
      options,
      voted
    })
  })
  .post(async (req, res) => {
    let voted= []
    let votingInfo = req.body
    let isVoted= await db.get(
      'SELECT * FROM voted WHERE optionid= ? AND voteduser= ?',
      [votingInfo.optionid, req.user.name]
      )

    if (isVoted) {
      await db.run(
        'DELETE FROM voted WHERE optionid= ? AND voteduser= ?',
        [votingInfo.optionid, req.user.name]
      )
    }else if (votingInfo.multiple === 'false' || votingInfo.multiple === '0') {
      await db.run(
        'DELETE FROM voted WHERE voteid = ? AND voteduser= ?',
        [req.params.id, req.user.name]
      )
      await db.run(
        'INSERT INTO voted VALUES (?, ?, ?, ?)',
        [req.params.id, votingInfo.optionid, req.user.name, votingInfo.time]
      )
    } else {
      await db.run(
        'INSERT INTO voted VALUES (?, ?, ?, ?)',
        [req.params.id, votingInfo.optionid, req.user.name, votingInfo.time]
      )
    }
    voted= await db.all(
      'SELECT * FROM voted WHERE voteid= ? ORDER BY optionid', req.params.id
    )

    if (voted) {
      res.json({
        code:1,
        voted,
      })
    } else {
      res.json({
        code:1,
        voted:[]
      })
    }

    // broadcast(req.params.id)
    throttle(req.params.id, 2000)
   })


//用户投票项目展示页
app.get('/votes', async (req, res) => {
  let votes= await db.all(
    'SELECT * FROM votes WHERE founder= ? ORDER BY voteid', req.user.name
  )

  res.json({
    votes
  })
})

//删除投票项目
app.get('/delete/:id', async (req, res) => {
  await db.run(
    'DELETE FROM votes WHERE voteid = ?', req.params.id
  )
  await db.run(
    'DELETE FROM options WHERE voteid = ?', req.params.id
  )
  await db.run(
    'DELETE FROM voted WHERE voteid = ?', req.params.id
  )
  res.json({
    code:'删除成功'
  })
 })








server.listen(port, ()=>{
  console.log('listening:', port)
})