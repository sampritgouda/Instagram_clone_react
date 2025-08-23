import React, { useState, useEffect } from 'react'
import Profile from '../components/Profile'
import Sidebar from '../components/Sidebar'
import UserProfileFeed from '../components/UserProfileFeed'
import { useParams } from 'react-router-dom'
import UserReel from '../components/UserReel'
import SideComponent from '../components/SideComponent'

const ProfilePage = () => {
  const { id,tab } = useParams()
  const [canview, setcanview] = useState(true)
  const [activeTab, setActiveTab] = useState(null)
  const [user, setUser] = useState(null)
   // moved here

  const token = localStorage.getItem("token")

  const fetchUser = async () => {
    try {
      const resp = await fetch(`http://localhost:8080/api/profile/user?userId=${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await resp.json()
      setUser(data)
    } catch (err) {
      console.error("Failed to fetch user", err)
    }
  }

  useEffect(() => {
    fetchUser()
    setActiveTab(tab || 'post')
  }, [id,tab])


 
   useEffect(() => {
  if (user && user.private && !user.followed && !user.own) {
    setcanview(false)
  } else {
    setcanview(true) // reset if user changes
  }
}, [user])



  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  return (
    <div className='d-flex'>
      <SideComponent />
      <div 
        className="container-fluid p-0 d-flex flex-column overflow-auto bg-black" 
        style={{ maxHeight: '100vh' }}
      >
        {/* Pass user down instead of id */}
        {user && <Profile user={user} />}
        
        <div className='mt-5'>
          <ul className="nav nav-tabs d-flex justify-content-center bg-black">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'post' ? 'active' : ''}`}
                onClick={() => handleTabChange('post')}
              >
                Post
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'reel' ? 'active' : ''}`}
                onClick={() => handleTabChange('reel')}
              >
                Reel
              </button>
            </li>
            {user?.own && ( // show only if user.own is true
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'saved' ? 'active' : ''}`}
                  onClick={() => handleTabChange('saved')}
                >
                  Saved
                </button>
              </li>
            )}
          </ul>
        </div>

        {activeTab === 'post' && canview && <UserProfileFeed id={id} type='posts' user={user} />}
        {activeTab === 'reel' && canview && <UserProfileFeed id={id} type='reels' user={user}/>}
        {activeTab === 'saved' && <UserProfileFeed id={id} type='saved'user={user} /> }
      </div>
    </div>
  )
}

export default ProfilePage
