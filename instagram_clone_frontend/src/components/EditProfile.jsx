import React, { useEffect, useRef, useState } from "react";
import { useUser } from '../context/UserContext';
const EditProfile = () => {
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [profileUrl, setProfileUrl] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const token = localStorage.getItem("token");
  const { setProfileImage } = useUser();
  // fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log(token)
        const resp = await fetch("http://localhost:8080/api/profile/edit", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (resp.ok) {
          const data = await resp.json();
          setUser(data);
          setProfileUrl(data.profilePicUrl || "");
          setBio(data.bio || "");
          setGender(data.gender || "");
        } else {
          console.error("Failed to fetch profile");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, []);

  // upload profile picture
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {

      const resp = await fetch("http://localhost:8080/api/profile/image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (resp.ok) {
        const data = await resp.json();
        setProfileUrl(data.profilePicUrl);
        setProfileImage(data.profilePicUrl)
      } else {
        console.error("Failed to upload profile image");
      }
    } catch (err) {
      console.error("Error uploading image:", err);
    }
  };

  // update bio + gender
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {

      const resp = await fetch("http://localhost:8080/api/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bio, gender }),
      });

      if (resp.ok) {
        const data = await resp.json();
        console.log("Profile updated:", data);
      } else {
        console.error("Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  if (!user) return <p className="text-white">Loading...</p>;

  return (
    <div className="w-100 flex-column gap-3 text-white">
      <div className="m-auto flex-column" style={{ width: "70%" }}>
        <h5 className="mt-4 mb-4">Edit profile</h5>

        {/* Profile picture */}
        <div className="container bg-dark p-3 rounded d-flex justify-content-between align-items-center px-4">
          <div className="d-flex gap-3 align-items-center">
            {profileUrl && (
              <img
                src={profileUrl}
                alt="Profile"
                style={{ width: "50px", height: "50px", objectFit: "cover" }}
                className="rounded-circle"
              />
            )}
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

        {/* Bio + Gender form */}
        <div className="mt-4">
          <h5>Edit Profile</h5>
          <form
            className="d-flex flex-column gap-3"
            
            onSubmit={handleSubmit}
          >
            {/* Bio */}
            <div>
              <label className="form-label text-white">Bio</label>
             <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="form-control bg-black text-white text-start "
              placeholder="Enter your bio"
              name="bio"
              rows={4}   // controls height
              style={{ resize: "none", width: "100%"}}
            />

            </div>

            {/* Gender */}
            <div>
              <label className="form-label text-white">Gender</label>
              <select
                className="form-select bg-black text-white"
                name="gender"
                value={gender}
                style={{height:"60px"}}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary mt-3"
              style={{ width: "200px" }}
            >
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
