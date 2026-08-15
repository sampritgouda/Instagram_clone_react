import React, { useEffect, useState } from 'react'
import SideComponent from '../components/SideComponent'
import { FaUser, FaSignOutAlt, FaExchangeAlt } from 'react-icons/fa'
import EditProfile from '../components/EditProfile'
import Privacy from '../components/Privacy'
import PersonalDetails from '../components/PersonalDetails'
import { API_BASE_URL } from '../config'
import { useUser } from '../context/UserContext'

const ProfileSettings = () => {
    const token = localStorage.getItem("token")
    const id = localStorage.getItem("userId")
    const [user, setuser] = useState({})
    const [select, setselect] = useState('edit-profile')
    const { logout, setIsSwitcherOpen } = useUser()

   const fetchUser = async () => {
       try {
         const resp = await fetch(`${API_BASE_URL}/api/profile/user?userId=${id}`, {
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
    <div className='d-flex flex-column flex-md-row min-vh-100 bg-black text-white'>
        <SideComponent/>
        
        {/* Desktop Sidebar Settings menu */}
        <div style={{width:'280px', flexShrink: 0, background:'black'}} className='d-none d-md-block border-end border-secondary p-3'>
            <h5 className='px-3 text-white mb-4 mt-3 fw-bold' style={{letterSpacing: '0.5px'}}>Settings</h5>
            
            {/* Account Center Card */}
            <div 
              className='card text-white px-3 py-3 mb-4 bg-dark-card border-dark-glow shadow-sm' 
              style={{width:'92%', margin: '0 auto 24px auto', cursor:"pointer", borderRadius: '12px'}} 
              onClick={()=>setselect("edit-password")}
            >
                <p className='fw-bold mb-1' style={{fontSize: '13px', color: '#0095f6'}}>Account Center</p>
                <p className='mb-2 text-secondary' style={{fontSize:'11px', lineHeight: '1.4'}}>Manage your account settings, password, and security details</p>
                <div className='d-flex gap-2 align-items-center mb-1'>
                  <FaUser size={10} className='text-secondary'/> 
                  <p style={{fontSize:'11px', margin:0}} className='text-secondary'>personal details</p>
                </div>
                <p style={{fontSize:'11px', margin:0}} className='text-secondary'>password and security</p>
            </div>
            
            <ul className='flex-column nav gap-2 px-2'>
                <li
                    className={`settings-link ${select === "edit-profile" ? "active" : ""}`}
                    onClick={() => setselect("edit-profile")}
                  >
                    Edit Profile
                  </li>

                  <li
                    className={`settings-link ${select === "edit-privacy" ? "active" : ""}`}
                    onClick={() => setselect("edit-privacy")}
                  >
                    Privacy
                  </li>

                  <li
                    className={`settings-link ${select === "edit-password" ? "active" : ""}`}
                    onClick={() => setselect("edit-password")}
                  >
                    Personal Details
                  </li>
                  
                  <hr className="border-secondary my-2" />

                  <li
                    className="settings-link text-primary fw-semibold d-flex align-items-center gap-2"
                    onClick={() => setIsSwitcherOpen(true)}
                  >
                    <FaExchangeAlt size={14} /> Switch Accounts
                  </li>

                  <li
                    className="settings-link text-danger fw-bold d-flex align-items-center gap-2"
                    onClick={() => logout(false)}
                  >
                    <FaSignOutAlt size={14} /> Log Out
                  </li>
            </ul>
        </div>
        
        {/* Mobile Sticky Settings Header */}
        <div className="d-md-none bg-black border-bottom border-secondary px-3 py-3 sticky-top" style={{zIndex: 999}}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="text-white fw-bold mb-0" style={{fontSize: '18px'}}>Settings</h5>
              <button 
                className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1.5 py-1 px-2.5 rounded-3 fw-bold"
                onClick={() => logout(false)}
                style={{fontSize: '12px'}}
              >
                <FaSignOutAlt size={12} /> Log Out
              </button>
            </div>

            <div className="d-flex gap-2 overflow-auto pb-1 no-scrollbar">
                <button 
                  className={`btn btn-sm px-3 py-2 text-white rounded-pill border-0 ${select === 'edit-profile' ? 'bg-primary fw-bold' : 'bg-dark'}`}
                  style={{fontSize: '13px', whiteSpace: 'nowrap', transition: 'all 0.2s ease'}}
                  onClick={() => setselect('edit-profile')}
                >
                  Edit Profile
                </button>
                <button 
                  className={`btn btn-sm px-3 py-2 text-white rounded-pill border-0 ${select === 'edit-privacy' ? 'bg-primary fw-bold' : 'bg-dark'}`}
                  style={{fontSize: '13px', whiteSpace: 'nowrap', transition: 'all 0.2s ease'}}
                  onClick={() => setselect('edit-privacy')}
                >
                  Privacy
                </button>
                <button 
                  className={`btn btn-sm px-3 py-2 text-white rounded-pill border-0 ${select === 'edit-password' ? 'bg-primary fw-bold' : 'bg-dark'}`}
                  style={{fontSize: '13px', whiteSpace: 'nowrap', transition: 'all 0.2s ease'}}
                  onClick={() => setselect('edit-password')}
                >
                  Personal Details
                </button>
                <button 
                  className="btn btn-sm px-3 py-2 text-primary bg-dark rounded-pill border border-secondary fw-semibold"
                  style={{fontSize: '13px', whiteSpace: 'nowrap'}}
                  onClick={() => setIsSwitcherOpen(true)}
                >
                  <FaExchangeAlt size={12} className="me-1" /> Switch
                </button>
            </div>
        </div>
        
        {/* Main Content Pane */}
        <div className='flex-grow-1 bg-black p-3 p-md-5 settings-content-mobile' style={{paddingBottom: '80px', overflowY: 'auto'}}>
            <div className="mx-auto" style={{maxWidth: '700px'}}>
                {select==='edit-profile' && <EditProfile />}
                {select==='edit-privacy' && <Privacy />}
                {select==='edit-password' && <PersonalDetails />}

                {/* Mobile Bottom Logout & Account Switcher Card */}
                <div className="d-md-none mt-5 pt-3 border-top border-secondary text-center">
                  <div className="d-flex flex-column gap-2">
                    <button 
                      className="btn btn-outline-light w-100 py-2.5 d-flex align-items-center justify-content-center gap-2 fw-semibold rounded-3"
                      onClick={() => setIsSwitcherOpen(true)}
                    >
                      <FaExchangeAlt size={16} /> Switch Accounts
                    </button>
                    <button 
                      className="btn btn-danger w-100 py-2.5 d-flex align-items-center justify-content-center gap-2 fw-bold rounded-3"
                      onClick={() => logout(false)}
                    >
                      <FaSignOutAlt size={16} /> Log Out
                    </button>
                  </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default ProfileSettings