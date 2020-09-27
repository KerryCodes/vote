import React, { useState, useRef } from 'react'
import { Link, useHistory } from 'react-router-dom'
import Axios from 'axios'
import './createVote.css'
let count = 0

export default function CreateVote(props) {
  const history= useHistory()
  const [options, setOptions] = useState([{
    id: count++,
    value: '',
  }])
  const topic = useRef()
  const directions = useRef()
  const deadline = useRef()
  const hideName= useRef()
  
  return (
    <div>
      {
        props.multiple === 'true'
        ?
          <div className="top-banner">新建多选投票</div>
          :
          <div className="top-banner">新建单选投票</div>
      }
      <Link to="/" id="back">&lt;</Link>

      <form onSubmit={e=>handleSubmit(e)}>
        <input ref={topic} type="text" placeholder="投票标题"></input>
        <input ref={directions} type="text" placeholder="补充描述（选填）"></input>
        <ul style={{ listStyle: 'none' }}>
          {options.map(it =>
            <li key={it.id}>
              <div onClick={()=>setOptions(options.filter(item => it.id!==item.id))}>X</div>
              <input type="text" placeholder="选项" value={it.value} onChange={e=>handleInput(e,it)}></input>
            </li>
            )}
        </ul>
        <div onClick={e => {e.preventDefault();setOptions([...options, { id: count++, value: '' }])}}>+添加选项</div>
        <div id="deadline">
          <div>截止日期</div>
          <input ref={deadline} type="datetime-local"></input>
        </div>
        <div id="hidename">
          <input ref={hideName} type="checkbox"></input>
          <div>匿名投票</div>
        </div>
        <button id="submit">完成</button>
      </form>
    </div>
  )

  function handleInput(e, it) {
    setOptions(options.map(item => {
      if (item.id === it.id) {
        return {
          id: it.id,
          value: e.target.value
        }
      } else {
        return item
      }
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (topic.current.value && options.length >= 2 && deadline.current.value) {
      Axios.post('/createVote', {
        topic: topic.current.value,
        directions: directions.current.value,
        multiple: props.multiple,
        options: options,
        deadline: deadline.current.value,
        hideName: hideName.current.checked,
      }).then(val => {
        history.push('/voting/' + val.data.voteId)
      })
    } else {
      alert('信息未填写完整！')
    }
  }

}