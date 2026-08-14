import React, { useEffect, useState } from 'react'
import ProfileHeader from './ProfileHeader'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import { FaTimes } from 'react-icons/fa'

const Follow = ({ onClose, type, userId }) => {
    const navigate = useNavigate()
    const token = localStorage.getItem("token")
    const [users, setusers] = useState([])

    const navigateUserProfile = (id) => {
        onClose()
        navigate(`/profile/${id}`)
    }

    console.log(type)
    const fetchData = async () => {
        const url = type === 'follower' ? `${API_BASE_URL}/api/user/follower` : `${API_BASE_URL}/api/user/following`
        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": 'application/json'
            },
            body: JSON.stringify({ userId })
        })

        const data = await resp.json()
        setusers(data)
        console.log(data)
    }

    useEffect(() => {
        fetchData()
    }, [])

    return (
        <div className='position-absolute w-100 h-100 d-flex align-items-center justify-content-center' style={{
            top: 0, left: 0, background: "rgba(0,0,0,0.3)",   // semi-transparent dark overlay
            backdropFilter: "blur(5px)",     // blur effect
            WebkitBackdropFilter: "blur(5px)", // Safari support
            zIndex: 9999
        }}>
            <div className='bg-dark position-relative d-flex flex-column gap-2 text-white p-2 follow-container' style={{ width: "35%", height: "60%", borderRadius: "20px" }}>
                <button
                    onClick={onClose}
                    className='position-absolute btn btn-link text-white-50 p-2 d-flex align-items-center justify-content-center border-0 outline-none text-decoration-none'
                    style={{ top: '8px', right: '12px', zIndex: 10 }}
                >
                    <FaTimes size={18} className="text-white" />
                </button>

                <div className="border-bottom border-secondary-custom py-2 text-center w-100">
                    <span className="fw-bold text-white text-capitalize" style={{ fontSize: '15px', letterSpacing: '0.3px' }}>
                        {type === 'follower' ? 'followers' : 'following'}
                    </span>
                </div>

                <div className="flex-grow-1 overflow-auto py-2 px-2 no-scrollbar" style={{ width: '100%' }}>
                    {users.length === 0 ? (
                        <div className="text-center text-secondary py-5" style={{ fontSize: '13px' }}>
                            No {type === 'follower' ? 'followers' : 'following'} yet.
                        </div>
                    ) : (
                        users.map((user, val) => (
                            <div key={val} className='d-flex justify-content-between align-items-center px-3 py-2.5 mb-1 rounded follow-bar transition-all'>
                                <div className='d-flex gap-3 align-items-center' onClick={() => navigateUserProfile(user.id)}
                                    style={{ cursor: "pointer" }}>
                                    <img
                                        src={user.profileurl || 'https://ui-avatars.com/api/?background=333&color=fff&name=U'}
                                        className='rounded-circle border border-secondary'
                                        style={{ width: '38px', height: '38px', objectFit: 'cover' }}
                                        alt={user.username}
                                    />
                                    <span className='text-white fw-semibold' style={{ fontSize: '14.5px' }}>{user.username}</span>
                                </div>
                                <ProfileHeader user={user} />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

export default Follow