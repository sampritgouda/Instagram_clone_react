import React, { useEffect, useState } from 'react'
import { FaTimes, FaTimesCircle } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'

const Search = ({onclose}) => {
    const navigate = useNavigate()

    const token = localStorage.getItem("token")
    const [searchVal, setsearchVal] = useState("")
    
    const [users, setusers] = useState([])

    const navigateprofile = (id) => {
        navigate(`/profile/${id}`)
    }

    const fetchSearch = async() =>{
        const resp = await fetch(`${API_BASE_URL}/api/search/${searchVal.trim()}`,{
          headers : {'Authorization' : `Bearer ${token}`}

        })

        const data = await resp.json()
        console.log(data)
        setusers(data)
    }
   useEffect(() => {
  if (searchVal.trim() !== "") {
    fetchSearch();
  } else {
    setusers([]); // reset when input is cleared
  }
}, [searchVal]);

  return (
    <div className='flex-column border-end border-secondary position-fixed bg-black' style={{width:"300px",height:"100vh",top:0,left:0,zIndex:9999}}>
        <button className='btn position-absolute text-white' style={{top:0,right:0}}
        onClick={()=>onclose()}><FaTimesCircle/></button>
        <h5 className='text-white ps-4 pt-3'>Search</h5>
        <div className='px-3 py-5 border-bottom border-secondary position-relative'>
            <input type='text' className='searchbar w-100 rounded p-2' style={{border:"none",outline:"none",height:"40px"}}
            value={searchVal} onChange={(e)=>setsearchVal(e.target.value)}/>
            <span className='text-white position-absolute' style={{right:"30px",top:"50px",cursor:"pointer",opacity:0.7}} onClick={()=>setsearchVal("")}><FaTimes size={15} />   </span>
        </div>
        <div className='flex-column px-3 py-3'>
            {users.map((user,key)=>{
                return (
                    <div className='d-flex gap-4 align-items-cenetr mt-2 py-1 px-3 rounded follow-bar' key={key}
                     style={{cursor:"pointer"}} onClick={()=>navigateprofile(user.id)}>
                        <img src={user.userprofile} className='rounded-circle' style={{width:"40px",height:'40px'}}/>
                        <span className='text-white d-flex align-items-center' style={{fontFamily:"serif",fontSize:"16px",opacity:0.8}}>{user.username}</span>
                     </div>
                )
            })}
        </div>
    </div>
  )
}

export default Search