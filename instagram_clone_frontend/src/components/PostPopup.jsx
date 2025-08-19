import React, { useRef, useState } from 'react'
import ProfileHeader from './ProfileHeader'
import Like from './Like'
import Save from './Save'
import { FaComment, FaRegComment, FaShare, FaVolumeMute, FaVolumeUp } from 'react-icons/fa'

const PostPopup = ({feed,onclose,user}) => {
  const [muted, setmuted] = useState(true)
  const videoref = useRef()
  const toglemute = () => setmuted(!muted)

  const togglePlayPause = id => {
  
    if (videoref.current.paused) videoref.current.play();
    else videoref.current.pause();
  };

  return (
    <div className='position-absolute w-100 h-100 d-flex align-items-center justify-content-center' style={{top:0,left:0,   background: "rgba(0,0,0,0.3)",   // semi-transparent dark overlay
    backdropFilter: "blur(5px)",     // blur effect
    WebkitBackdropFilter: "blur(5px)", // Safari support
    zIndex: 9999}}>
        <button className='position-absolute btn btn-danger' style={{top:0,right:0}} onClick={onclose}>Close</button>
        <div className='d-flex align-items-center justify-content-center' style={{height:"100vh",width:'100vw'}}>
            <div style={{width:'26%',height:'80%'}} className='position-relative'>
            {feed.mediaType === "image" ? (
              <img
                src={feed.mediaUrl}
                className="w-100 h-100"
                alt="Post"
                style={{ objectFit: "cover"}}
              />
            ) : feed.mediaType === "video" ? (
              <video  
              ref={videoref}
                className="w-100 h-100"
                onClick={togglePlayPause}
                loop
                style={{ objectFit: "cover",cursor:'pointer' }}
                autoPlay
                muted={muted}
              >
                <source src={feed.mediaUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : null}
            <span  style={{position:'absolute',bottom:'20px',right:'25px',cursor:'pointer'}} onClick={toglemute}>
              {muted ? <FaVolumeMute color='white' size={20} opacity={0.5}/> : <FaVolumeUp color='white' size={20} opacity={0.5}/>}
            </span>
            </div>
            <div className='d-flex flex-column px-4 py-3 gap-4 text-white bg-dark' style={{width:'28%',height:'80%'}}>
              <div className='d-flex gap-2 align-items-center'>
                  <img src={feed.user.profilePicUrl} style={{width:'40px',height:'40px'}} className='rounded-circle'/>  
                  <p className='m-0'>{feed.user.username}</p>   
                  <ProfileHeader user = {user}/>        
               </div>
               {feed.caption && 
               <div className='d-flex gap-3 align-items-center'>
                <img src={feed.user.profilePicUrl} alt="" style={{width:'40px',height:'40px'}} className='rounded-circle' />
                <p>{feed.user.username}</p>
                <p>{feed.caption}</p>
               </div>
               }
               <div className='w-100' style={{height:'60%'}}>

               </div>
               <div className='d-flex gap-3 align-items-center justify-content-between'>
                <div className='d-flex gap-3'>
                <Like id= {feed.id} type={feed.type} initialLiked={feed.liked} initialCount={feed.likeCount}/>
                <FaRegComment size={24}/>
                <FaShare size={24} />
                </div>
                <div>
                <Save id={feed.id} type={feed.type} initialSaved={feed.saved}/>
                </div>
               </div>
            </div>
        </div>
    </div>
  )
}

export default PostPopup