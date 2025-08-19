import React, { useEffect, useRef, useState } from 'react'

const EditProfile = ({ user }) => {
  const fileInputRef = useRef(null);
const [profileurl, setprofileurl] = useState(user.profilePicUrl)
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log("Selected file:", file);
      // later you can upload it to backend or Cloudinary
    }
  };

  const updateProfileImage =async () =>{
    const resp = await fetch('http://localhost:8080/api/auth/profile/image')

    console.log(resp)
  }

  useEffect(()=>{
   updateProfileImage()
  },[file])

  return (
    <div className="w-100 flex-column gap-3 text-white">
        <div className='m-auto flex-column' style={{width:'60%'}}>
      <h5 className="mt-4 mb-4">Edit profile</h5>

      <div className="container bg-dark p-3 rounded d-flex justify-content-between align-items-center px-4">
        <div className="d-flex gap-3 align-items-center">
          <img
            src={profileurl}
            alt="Profile"
            style={{ width: "50px", height: "50px", objectFit: "cover" }}
            className="rounded-circle"
          />
          <p className="mb-0">{user.username}</p>
        </div>

       
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: "none" }}
        />

   
        <button
          className="btn btn-primary"
          onClick={() => fileInputRef.current.click()}
        >
          Change Profile
        </button>
      </div>
      </div>
    </div>
  );
};

export default EditProfile;
