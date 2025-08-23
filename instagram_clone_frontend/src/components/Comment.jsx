import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Comment = ({id,type,onclose}) => {
    const [commentvalue, setcommentvalue] = useState("")
    const [comments, setcomments] = useState([])
    const token = localStorage.getItem("token")
const navigate = useNavigate()

const navigateprofile = (id) =>{
    onclose()
    navigate(`/profile/${id}`)
}
    const getComments = async()=>{
        const resp = await fetch(`http://localhost:8080/api/comment/${id}/${type}`,
            {
                headers : {"Authorization" : `Bearer ${token}`}
            }
        )

        const data = await resp.json()

        console.log(data)
        setcomments(data)
    }
const sendComment = async () => {
  if (commentvalue.trim() === "") return;

  try {
    const resp = await fetch("http://localhost:8080/api/comment/add", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        commentvalue: commentvalue,
        id: id,
        type

      })
    });

    if (!resp.ok) throw new Error("Failed to add comment");

    const newComment = await resp.json();

    // Optimistic update
    setcomments((prev) => [...prev, newComment]);

    setcommentvalue("");
  } catch (err) {
    console.error(err);
  }
};


useEffect(()=>{
    getComments()
},[])


  return (
    <div className='w-100 h-100 flex-column'>
        <h5 className='text-center text-white'>Comments</h5>
        <div className='flex-column gap-2' style={{height:"78%",overflowY:"auto"}}>
            {comments.map((comment,key)=>{
                return (<div key={key} className=' text-white p-2'>
                   <div className='d-flex gap-2'> <img className='rounded-circle' src={comment.userprofile} style={{width:"30px",height:"30px"}}/>
                    <span style={{fontSize:"16px",fontFamily:"serif",cursor:"pointer"}}
                    onClick={()=>navigateprofile(comment.userId)}>{comment.username}</span>
                    </div>
                    <span style={{fontSize:"15px",fontFamily:"sans-serif",paddingLeft:"40px"}} >{comment.text}</span>
                </div>)
            })}
        </div>
        <div className='d-flex p-2 gap-2'>
            <input type='text' className='form-control bg-secondary text-black' value={commentvalue} onChange={(e)=>setcommentvalue(e.target.value)}
            style={{border:"none"}}/>
            <button className='btn btn-primary' onClick={()=>sendComment()}>send</button>
        </div>
    </div>
  )
}

export default Comment