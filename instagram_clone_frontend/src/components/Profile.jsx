import React, { useEffect, useState } from 'react'
import { FiSettings } from 'react-icons/fi'

import { Link, useParams } from 'react-router-dom'
import ProfileHeader from './ProfileHeader'
import Follow from './Follow'

const Profile = ({user}) => {
    const [canview, setcanview] = useState(true)
    const [showpopup, setshowpopup] = useState(false)
    const [type, settype] = useState(null)
    useEffect(()=>{
      if(user.private && !user.followed && !user.own)setcanview(false)
    },[])
  const popupdisplay =(poptype)=>{
    setshowpopup(true)
    settype(poptype)
  }
   
  return (
    <div className='container-fluid bg-black mt-4 d-flex' >
       <div className='h-100 d-flex align-items-center justify-content-end' style={{width:'40%'}}>
        <img className='rounded-circle' src={user.profilePicUrl} alt=""  style={{width:'180px',height:'180px'}}/>
       </div>
       <div className='d-flex flex-column gap-3 justify-content-center px-5'>
        <div className='d-flex gap-3 align-items-center'>
            <p className='text-white m-0' style={{fontSize:'23px'}}>{user.username}</p>
            {(user.own) ? (
                <>
           <Link to="/profile/edit"
            className="btn border-white text-white" 
            style={{ width: '100px', fontSize: '14px',height:'30px' }}
            >
            Edit profile
            </Link>
           <FiSettings className='text-white' user={user}/>
            </>
            ) : (
              <ProfileHeader user= {user}/>
            )}
        </div>
        <div className='text-white d-flex gap-3'>
            <p>{user.postCount}<span style={{opacity:0.5}}> posts</span></p>
            <p 
            onClick={() => { if (canview) popupdisplay('follower'); }} 
            style={{ cursor: canview ? "pointer" : "default" }}
          >
            {user.followerCount} <span style={{opacity:0.5}}> Followers</span>
          </p>

            <p 
            onClick={() => { if (canview) popupdisplay('following'); }} 
            style={{ cursor: canview ? "pointer" : "default" }}
          >
            {user.followingCount} <span style={{opacity:0.5}}> Following</span>
          </p>
        </div>
        <div>
            <p>{user.bio}</p>
        </div>

       </div>
       {showpopup && <Follow onClose={() => setshowpopup(false)} type={type} userId = {user.id} />}
    </div>
  )
}

export default Profile