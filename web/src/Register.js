import React, { useRef, useState } from 'react'
import {useHistory} from 'react-router-dom'
import Axios from 'axios'

export default function Register(props) {
  const history= useHistory()
  const userName = useRef()
  const checkMsg = useRef()
  const userPassword = useRef()
  const userEmail = useRef()
  const [imgSrc, setImgSrc] = useState('/uploads/0.jpg')
  
  return (
    <div>
      <form action="/api/register" method="POST" encType="multipart/form-data" onSubmit={e=>submit(e)}>
        <div>用户名：</div>
        <input type="text" ref={userName} onChange={checkName} />
        <div ref={checkMsg} style={{color:"red"}}>*</div>
        <div>密码：</div>
        <input type="password" ref={userPassword} />
        <div>邮箱：</div>
        <input type="text" ref={userEmail} />
        <div>头像上传：</div>
        <label htmlFor="avatar">
          <img src={imgSrc} alt="avatar" style={{width:'100px'}}/>
        </label>
        <input type="file" id="avatar" style={{display:"none"}} onChange={e=>handleAvatar(e)}/><br/>
        <button>注册</button>
      </form>
    </div>
  )

  function handleAvatar(e) {
    let data = new FormData()

    data.append('avatar', e.target.files[0])
    Axios.post('/upload', data, {
      headers: { "Content-Type": "multipart/form-data" }
    }).then(val => {
      setImgSrc('/uploads/' + val.data.src)
    })
  }

  function submit(e) {
    e.preventDefault()
    Axios.post('/register', {
      name: userName.current.value,
      password: userPassword.current.value,
      email: userEmail.current.value,
      avatar: imgSrc,
    }).then(val => {
      if (val.data.code === 1) {
        alert('注册成功，请登录！')
        history.push('/noLogin/login')
      } else {
        alert(val.data.result)
      }
    })
  }

  function checkName(e) {
    if (!e.target.value) {
      checkMsg.current.textContent = '*'
      return
    }
    Axios.get('/username-conflict-check?name=' + e.target.value).then(result=>{
      checkMsg.current.textContent = result.data.msg
    })
  }
}