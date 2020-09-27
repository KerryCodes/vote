import React from 'react'
import { Route, NavLink, Redirect } from 'react-router-dom'
import Register from './Register'
import Login from './Login'
import './noLogin.css'

export default function NoLogin(props) {

  return (
    <div>
      <div id="main">
        <Route exact path="/noLogin">
          <Redirect to="/noLogin/login"></Redirect>
        </Route>

        <div id="header">
          <NavLink to="/noLogin/login" activeClassName="selected" >登录</NavLink>
          |
          <NavLink to="/noLogin/register" activeClassName="selected">注册</NavLink>
        </div>

        <Route path="/noLogin/login" component={Login}></Route>
        <Route path="/noLogin/register" component={Register}></Route>
      </div>
    </div>
  )
}