import React,{useEffect, useState} from 'react'
import Axios from 'axios'
import { Route, useHistory, Link, NavLink, Switch, Redirect } from 'react-router-dom'
import CreateVote from './CreateVote'
import NoLogin from './NoLogin'
import Me from './Me'
import Voting from './Voting'
import './vote.css'


export default function Vote(props) {
  const [userInfo, setUserInfo] = useState(0)
  const history = useHistory()
  
  useEffect(() => {
    Axios.get('/login').then(res => {
      if (res.data.user) {
        setUserInfo(res.data.user)
      } else {
        history.push('/noLogin')
      }
    }).catch(e => {
      history.push('/noLogin')
    })
  }, [history])
  
  return (
    <div>
      <Route path="/noLogin">
          <NoLogin userInfo={userInfo}></NoLogin>
      </Route>

      <Route exact path="/">
        <Redirect to="/home/createVote"></Redirect>
      </Route>

      <Route path='/home'>
        <Route path="/home/createVote">
          <div className="top-banner">阿里投票</div>
          <div id="create">
            <div>
              <Link to="/creatSingle" className="create-vote">单选投票</Link>
            </div>
            <div>
              <Link to="/creatMultiple" className="create-vote">多选投票</Link>
            </div>
          </div>
        </Route>

        <Route path="/home/me">
          <Me user={userInfo}></Me>
        </Route>

        <footer>
          <NavLink to="/home/createVote" activeClassName="active">新建</NavLink>
          <NavLink to="/home/me" activeClassName="active">我的</NavLink>
        </footer>
      </Route>
      
      <Switch>
        <Route path="/creatSingle">
          <CreateVote multiple='false'></CreateVote>
        </Route>
        <Route path="/creatMultiple">
          <CreateVote multiple='true'></CreateVote>
        </Route>
        <Route path="/voting/:id">
          <Voting></Voting>
        </Route>
      </Switch>
    </div>
  )
    
}