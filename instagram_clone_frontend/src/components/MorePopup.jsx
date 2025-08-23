import React from 'react'
import DeleteButton from './DeleteButton'
import ProfileHeader from './ProfileHeader'
import { useNavigate } from 'react-router-dom'

const MorePopup = ({id,user,type,token,close}) => {

    const navigate  = useNavigate()
  return (
    <div className='card bg-dark flex-column rounded w-100 h-100 text-white gap-2'>
        {user.own && <DeleteButton id={id} type={type} token={token}/>}
        {!user.own && <ProfileHeader user={user}/>}
        <span style={{cursor:"pointer"}} className='px-3' onClick={()=>{
            navigate(`/profile/${user.id}`)
        }}>Visit account</span>
        <span style={{cursor:"pointer"}} className='px-3 text-danger' onClick={close}>Cancel</span>
    </div>
  )
}

export default MorePopup