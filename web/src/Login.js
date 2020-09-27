import React,{useRef, useState} from 'react'
import { useHistory } from 'react-router-dom'
import Axios from 'axios'

export default function Login(props) {
  const history= useHistory()
  const name = useRef()
  const password = useRef()
  const captcha = useRef()
  const captchaImg = useRef()
  const [src, setSrc] = useState("/captcha/:0")


  function submit(e) {
    e.preventDefault()
    Axios.post('/login', {
      name: name.current.value,
      password: password.current.value,
      captcha: captcha.current.value
    }).then(val => {
      if (val.data.code === 2) {
        alert('验证码错误！')
        setSrc('/captcha/:' + Math.random())
      } else if (val.data.code === 1) {
        alert('登录成功！')
        history.push('/')
      } else {
        alert('用户名或密码错误！')
        setSrc('/captcha/:' + Math.random())
      }
    })
  }

  return (
    <div>
      <form onSubmit={e => submit(e)}>
        <div>用户名：</div>
        <input type="text" ref={name}/>
        <div>密码：</div>
        <input type="password" ref={password}/><br/>
        <img src={src} alt="验证码" ref={captchaImg} onClick={()=>setSrc('/captcha/:' + Math.random())}/><br />
        <div>验证码输入：</div>
        <input type="text" ref={captcha}/><br />
        <button>登录</button><span>忘记密码？</span>
      </form>
    </div>
  )


}