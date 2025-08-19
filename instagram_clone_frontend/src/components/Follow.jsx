import React, { useEffect, useState } from 'react'
import ProfileHeader from './ProfileHeader'

const Follow = ({onClose,type,userId}) => {
    const token = localStorage.getItem("token")
    const [users, setusers] = useState([])
    console.log(type)
const fetchData = async()=>{
    const  url = type === 'follower' ? 'http://localhost:8080/api/user/follower' :'http://localhost:8080/api/user/following'
    const resp = await fetch(url,{
        method:'POST',
        headers: {"Authorization": `Bearer ${token}`,
    "Content-Type" : 'application/json'},
    body: JSON.stringify({userId})
    })

    const data=await resp.json()
    setusers(data)
    console.log(data)
}

useEffect(()=>{
    fetchData()
},[])

  return (
   <div className='position-absolute w-100 h-100 d-flex align-items-center justify-content-center' style={{top:0,left:0,   background: "rgba(0,0,0,0.3)",   // semi-transparent dark overlay
    backdropFilter: "blur(5px)",     // blur effect
    WebkitBackdropFilter: "blur(5px)", // Safari support
    zIndex: 9999}}>
     <div className='bg-dark position-relative d-flex flex-column gap-2 text-white' style={{width:"35%",height:"60%",borderRadius:"20px"}}>
    <button onClick={onClose} className='position-absolute btn btn-danger' style={{top:0,right:0}}>Close</button>
    <p className='text-center mt-2'>{type}</p>
    {users.map((user,val)=>(
        <div key={val} className='d-flex justify-content-between align-items-center px-4'>
           <div className='d-flex gap-3 align-items-center'>
             <img src={user.profileurl} className='rounded-circle' style={{width:'40px',height:'40px'}}/>
            <p className='m-0' style={{fontSize:'17px',fontFamily:'cursive'}}>{user.username}</p>
            </div>
            <ProfileHeader user={user} />
         </div>
    ))}
    </div>
   </div>
  )
}

export default Follow