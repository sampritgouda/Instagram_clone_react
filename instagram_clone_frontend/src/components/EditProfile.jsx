import React, { useEffect, useRef, useState } from "react";
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../config';

const EditProfile = () => {
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [profileUrl, setProfileUrl] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const token = localStorage.getItem("token");
  const { setProfileImage } = useUser();
  const { addToast } = useToast();

  // fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/api/profile/edit`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (resp.ok) {
          const data = await resp.json();
          setUser(data);
          setProfileUrl(data.profilePicUrl || "");
          setBio(data.bio || "");
          setGender(data.gender || "");
        } else {
          addToast("Failed to load profile details", "error");
        }
      } catch (err) {
        addToast("Error fetching profile", "error");
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
    setUploading(true);

    try {
      const resp = await fetch(`${API_BASE_URL}/api/profile/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (resp.ok) {
        const data = await resp.json();
        setProfileUrl(data.profilePicUrl);
        setProfileImage(data.profilePicUrl);
        addToast("Profile picture updated successfully!", "success");
      } else {
        addToast("Failed to upload profile image", "error");
      }
    } catch (err) {
      addToast("Error uploading image", "error");
    } finally {
      setUploading(false);
    }
  };

  // update bio + gender
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const resp = await fetch(`${API_BASE_URL}/api/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bio, gender }),
      });

      if (resp.ok) {
        await resp.json();
        addToast("Profile updated successfully!", "success");
      } else {
        addToast("Failed to update profile details", "error");
      }
    } catch (err) {
      addToast("Error saving profile changes", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <p className="text-white">Loading...</p>;

  return (
    <div className="w-100 text-white">
      <div className="mx-auto px-2" style={{ maxWidth: "600px" }}>
        <h4 className="fw-bold mb-4 mt-2" style={{ letterSpacing: '0.3px' }}>Edit Profile</h4>

        {/* Profile picture */}
        <div className="bg-dark-card border-dark-glow p-3 rounded-4 d-flex justify-content-between align-items-center px-4 mb-4 shadow-sm">
          <div className="d-flex gap-3 align-items-center">
            <div
              className="profile-img-container"
              onClick={() => !uploading && fileInputRef.current.click()}
              style={{ position: 'relative' }}
            >
              {profileUrl ? (
                <img
                  src={profileUrl}
                  alt="Profile"
                  style={{ width: "56px", height: "56px", objectFit: "cover" }}
                  className="rounded-circle border border-secondary"
                />
              ) : (
                <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center" style={{ width: "56px", height: "56px" }}>
                  <span className="text-white fw-bold">U</span>
                </div>
              )}
            </div>
            <div>
              <p className="mb-0 fw-bold" style={{ fontSize: '15px' }}>{user.username}</p>
              <p className="mb-0 text-secondary" style={{ fontSize: '12px' }}>{user.email}</p>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: "none" }}
          />

          <button
            className="btn btn-sm btn-primary fw-semibold px-3 py-2 rounded-3"
            disabled={uploading}
            onClick={() => fileInputRef.current.click()}
            style={{ width: '90px' }}
          >
            {uploading ? (
              <span className="d-flex align-items-center gap-2">
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '12px', height: '12px' }}></span>
                Uploading...
              </span>
            ) : (
              "Change Photo"
            )}
          </button>
        </div>

        {/* Bio + Gender form */}
        <div className="bg-dark-card border-dark-glow p-4 rounded-4 shadow-sm">
          <form
            className="d-flex flex-column gap-4"
            onSubmit={handleSubmit}
          >
            {/* Bio */}
            <div className="d-flex flex-column">
              <label className="form-label text-white fw-semibold mb-2" style={{ fontSize: '14px' }}>Bio</label>
              <textarea
                value={bio}
                disabled={saving}
                onChange={(e) => setBio(e.target.value)}
                className="form-control custom-input border-dark-glow text-white text-start"
                placeholder="Write something about yourself..."
                name="bio"
                rows={4}
                style={{ resize: "none", width: "100%" }}
              />
            </div>

            {/* Gender */}
            <div className="d-flex flex-column">
              <label className="form-label text-white fw-semibold mb-2" style={{ fontSize: '14px' }}>Gender</label>
              <select
                className="form-select custom-input custom-select border-dark-glow text-white"
                name="gender"
                value={gender}
                style={{ height: "50px" }}
                disabled={saving}
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
              className="btn btn-primary fw-semibold mt-2 py-2.5 rounded-3 shadow-sm text-center d-flex align-items-center justify-content-center"
              style={{ width: "100%", maxWidth: "160px" }}
              disabled={saving}
            >
              {saving ? (
                <span className="d-flex align-items-center justify-content-center gap-2">
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '14px', height: '14px' }}></span>
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
