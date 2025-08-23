import React, { useEffect, useState } from 'react'
import SideComponent from '../components/SideComponent'
import { FaUser } from 'react-icons/fa'
import EditProfile from '../components/EditProfile'
import Privacy from '../components/Privacy'
import ChangePassword from '../components/PersonalDetails'
import PersonalDetails from '../components/PersonalDetails'

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
                <div className='card bg-dark m-auto text-white px-2 py-3 mb-3 select-bar' style={{width:'90%',height:'20%',cursor:"pointer"}} onClick={()=>setselect("edit-password")}>
                        <p>Acoount center</p>
                        <p style={{fontSize:'12px',opacity:0.5}}>Manage your account setting and personal details</p>
                        <span className='d-flex gap-2 align-items-center'><FaUser size={13} opacity={0.5}/> <p style={{fontSize:'12px',opacity:0.5,margin:0}}>personal details</p></span>
                        <p style={{fontSize:'12px',opacity:0.5}}>password and security</p>
                </div>
                <li
                    className={`nav-link select-bar text-white rounded mx-2 ${
                      select === "edit-profile" ? "selected" : ""
                    }`}
                    style={{ paddingLeft: "40px", cursor: "pointer" }}
                    onClick={() => setselect("edit-profile")}
                  >
                    Edit Profile
                  </li>

                  <li
                    className={`nav-link select-bar text-white rounded mx-2 ${
                      select === "edit-privacy" ? "selected" : ""
                    }`}
                    style={{ paddingLeft: "40px", cursor: "pointer" }}
                    onClick={() => setselect("edit-privacy")}
                  >
                    Privacy
                  </li>

                  <li
                    className={`nav-link select-bar text-white rounded mx-2 ${
                      select === "activity" ? "selected" : ""
                    }`}
                    style={{ paddingLeft: "40px", cursor: "pointer" }}
                    onClick={() => setselect("activity")}
                  >
                    Your Activity
                  </li>
                </ul>
        </div>
        <div className='container-fluid bg-black'>
            {select==='edit-profile' && <EditProfile />}
            {select==='edit-privacy' && <Privacy />}
            {select==='edit-password' && <PersonalDetails />}


        </div>
    </div>
  )
}

export default ProfileSettings