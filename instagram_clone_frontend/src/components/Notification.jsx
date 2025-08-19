import React, { useEffect, useState } from 'react'
import ProfileHeader from './ProfileHeader'

const Notification = ({onBack}) => {
 
    const [followrequest, setfollowrequest] = useState([])
    const [isRequested, setisRequested] = useState({})
    const token  = localStorage.getItem("token")
const fetchNotification = async() =>{
    const resp = await fetch('http://localhost:8080/api/user/allnotifications',{
        headers : {"Authorization" : `Bearer ${token}`}
    })
    const data = await resp.json()
     setfollowrequest(data)
     const intializerequest = {}
     data.forEach(req=>{
      intializerequest[req.id] = true
     })
     setisRequested(intializerequest)
   console.log(data)
}

const ConfirmRequest =async(isConfirm,id) =>{
  const resp = await fetch(`http://localhost:8080/api/user/confirm`,{
    method:'POST',
    headers : {"Authorization" : `Bearer ${token}`,
              'Content-Type': 'application/json',
  },
  body : JSON.stringify({id,isConfirm})
  })

  

  if(resp.ok)
  {
   setisRequested(prev => ({
  ...prev,
  [id]: false
}))

  }
}

useEffect(()=>{
    fetchNotification()
},[])

  return (
    <div className='d-flex flex-column gap-3 text-white bg-black border-end border-secondary position-relative' style={{width:'25%',height:'100vh'}}>
      <button onClick={onBack} className='btn btn-danger position-absolute py-0' style={{top:'0px',right:'0px'}}>Close</button>
      <span className='px-4 w-100 text-center py-2'>Follow Requests</span>
      {followrequest.map((req,val)=>(
        <div key={val} className='d-flex align-items-center justify-content-between px-3'>
          <div className='d-flex gap-3 px-2'>
          <img src={req.requester.profilePicUrl} alt="" className='rounded-circle' style={{width:'30px',height:'30px'}}/>
          <span>{req.requester.username}</span>
          </div>
          {isRequested[req.id] ? (
          <div className='d-flex gap-2 px-2'>
          <button onClick={()=>ConfirmRequest(true,req.id)} className='btn btn-primary py-0 px-1' style={{height:'30px'}}>Confirm</button>
          <button onClick={()=>ConfirmRequest(false,req.id)} className='btn btn-secondary py-0 px-1' style={{height:'30px'}}>delete</button>
          </div>
          ) : (
            <ProfileHeader user={req.requester}/>
          )}
        </div>
      ))

      }
    </div>
  )
}

export default Notification