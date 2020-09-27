import React, { useEffect, useState } from 'react'
import {useHistory} from 'react-router-dom'
import Axios from 'axios'
import './me.css'

export default function Me(props) {
  const history= useHistory()
  const [loading, setLoading]= useState(true)
  const [votes, setVotes] = useState(null)
  const [showId, setShowId]= useState(null)
  
  useEffect(() => {
    Axios.get('/votes').then(val => {
      setVotes(val.data.votes)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div>
        <div className="top-banner">我的投票</div>
      </div>
    )
  } else {
    return (
      <div>
        <div className="top-banner">{props.user.name} 的投票</div>
        <ul style={{listStyle:"none"}} id="me-ul">
        {
          votes.map(it =>
            <li key={it.voteid} onClick={e=>setShowId(showId === it.voteid || it.voteid)}>
              <div className="topic">{it.topic}</div>
              {showId === it.voteid && 
                <div className="show">
                  <span onClick={e => history.push(`/voting/${it.voteid}`)}>查看</span>
                  <span onClick={e => handleDelete(it)}>删除</span>
                </div>
              }
            </li>
          )
        }
        </ul>
        {/* <button onClick={e=>Axios.get('/logout')}>退出登录</button> */}
      </div>
    )
  }

  function handleDelete(it) {
    Axios.get('/delete/' + it.voteid).then(val => {
      setVotes(votes.filter(item => it !== item))
    })
  }
  
}