import React, { useEffect, useState } from 'react'
import SideComponent from '../components/SideComponent'
import { FaUser } from 'react-icons/fa'
import EditProfile from '../components/EditProfile'

const ProfileSettings = () => {
    const token = localStorage.getItem("token")
    const id =localStorage.getItem("userId")
    const [user, setuser] = useState({})
    const [select, setselect] = useState('edit-profile')

   const fetchUser = async () => {
       try {
         const resp = await fetch(`http://localhost:8080/api/profile/user?userId=${id}`, {
           headers: { 'Authorization': `Bearer ${token}` }
         })
         const data = await resp.json()
         setuser(data)
       } catch (err) {
         console.error("Failed to fetch user", err)
       }
     }
   
     useEffect(() => {
       fetchUser()
     },[])


  return (
    <div className='d-flex'>
        <SideComponent/>
        <div style={{width:'25%',background:'black'}} className='border-end border-secondary'>
            <ul className='flex-column nav' >
                <h5 className='px-3 text-white mb-3 mt-3'>Settings</h5>
                <div className='card bg-dark m-auto text-white px-2 py-3' style={{width:'90%',height:'20%'}}>
                        <p>Acoount center</p>
                        <p style={{fontSize:'12px',opacity:0.5}}>Manage your account setting and personal details</p>
                        <span className='d-flex gap-2 align-items-center'><FaUser size={13} opacity={0.5}/> <p style={{fontSize:'12px',opacity:0.5,margin:0}}>personal details</p></span>
                        <p style={{fontSize:'12px',opacity:0.5}}>password and security</p>
                </div>
                <li className='nav-link sidebar-link  text-white rounded mx-2 ' style={{paddingLeft:'40px'}}>Edit prifile</li>
                <li className='nav-link sidebar-link  text-white rounded mx-2 ' style={{paddingLeft:'40px'}}>Privacy</li>
                <li className='nav-link sidebar-link  text-white rounded mx-2 ' style={{paddingLeft:'40px'}}>Account status</li>
            </ul>
        </div>
        <div className='container-fluid bg-black'>
            {select==='edit-profile' && <EditProfile user={user}/>}

        </div>
    </div>
  )
}

export default ProfileSettings