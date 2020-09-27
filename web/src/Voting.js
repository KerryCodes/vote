import React,{useEffect, useState} from 'react'
import { useParams, Link } from 'react-router-dom'
import Axios from 'axios'
import './voting.css'

export default function Voting(props) {
  const { id } = useParams()
  const [voted, setVoted] = useState([])
  const [isLoading, votes, options] = useFetch(`/voting/${id}`)

  useEffect(() => {
    if (!votes) { return }
    if (Date.now() < (new Date(votes.deadline)).getTime()) {
      // let ws = new WebSocket(`ws://${window.location.host}/voting/${id}`)
      let ws = new WebSocket(`ws://localhost:5000/voting/${id}`)
      
      ws.onmessage = function (e) {
        setVoted(JSON.parse(e.data))
      }
      return () => ws.close()
    }
  }, [id, votes])


  if (isLoading) {
    return (
      <div>loading</div>
    )
  } else {
    return (
      <div>
        <div className="top-banner">投票啦！</div>
        <Link to="/home/me" id="back">&lt;</Link>
        <h1>{votes.topic}</h1>
        {
          votes.multiple === '1'
            ?
            <div className="ismultiple">[多选]</div>
            :
            <div className="ismultiple">[单选]</div>
        }
        <ul style={{ listStyle: 'none' }} id="voting-ul">
          {
            options.map(it =>
              <li key={it.optionid} onClick={e => handleClick(it)}>
                <div className="content">
                  <span>{it.content}</span>
                  <div className="percent">
                    <span>{voted.filter(item => item.optionid === it.optionid).length}票</span>
                    <span>{voted.length !==0 ? Number((voted.filter(item=>item.optionid===it.optionid).length/voted.length)*100).toFixed(0) : 0}%</span>
                  </div>
                </div>
                <div>
                  <progress max={voted.length} value={voted.filter(item => item.optionid === it.optionid).length}>进度条</progress>
                </div>
                {
                  votes.hidename === 'true' || votes.hidename === '1' ?
                    ''
                    :
                    <div className="votedusers">
                      {
                        voted.filter(item => item.optionid === it.optionid).map(p => 
                          <span key={p.voteduser}>{p.voteduser} </span>
                        )
                      }
                    </div>
                }
              </li>
              )
          }
        </ul>
        <span id="time">投票截止：{votes.deadline.replace(/T/g, ' ')}</span>
      </div>
    )
  }

  function handleClick(it) {
    if (Date.now() > (new Date(votes.deadline)).getTime()) {
      alert('投票已截止！')
      return
    }
    Axios.post('/voting/' + id, {
      optionid: it.optionid,
      time: Date.now(),
      multiple: votes.multiple,
    }).then(val => {
      if (val.data.code === 1) {
        setVoted(val.data.voted)
      }
    })
  }

  function useFetch(url) {
    const [isLoading, setIsLoading] = useState(true)
    const [votes, setVotes] = useState(null)
    const [options, setOptions] = useState(null)
    
    useEffect(() => {
      setIsLoading(true)
      setVotes(null)
      setOptions(null)
      setVoted(null)
      Axios.get(url).then(val => {
        setVotes(val.data.votes)
        setOptions(val.data.options)
        setVoted(val.data.voted)
        setIsLoading(false)
      })
      // (async function() {
      //   setIsLoading(true)
      //   setResult(null)
      //   let res = await Axios.get(url)

      //   setResult(res.data)
      //   setIsLoading(false)
      // })()
    }, [url])

    return [isLoading, votes, options]
  }

}