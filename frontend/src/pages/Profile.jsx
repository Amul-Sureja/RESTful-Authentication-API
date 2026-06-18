import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api.js";

const Profile = () => {
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    profilePictureURL: "",
  });
  const [profileImage, setProfileImage] = useState("/profile.jpg");
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    // const token = localStorage.getItem("accessToken");

    // if (!token) {
    //   navigate("/login");
    //   return;
    // }

    try {
      const response = await api.get("/auth/profile");
      const profile = response.data.user;

      setUser({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        username: profile.username || `${profile.firstName} ${profile.lastName}`.trim(),
        email: profile.email || "",
        phone: profile.phone || "",
        profilePictureURL: profile.profilePictureURL || "",
      });

      setProfileImage(profile.profilePictureURL || "/profile.jpg");
    } catch (err) {
      if (err.response?.status !== 401) {
      //   navigate("/login");
      // } else {
        setError("Failed to load profile");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("firstName", user.firstName);
      formData.append("lastName", user.lastName);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await api.patch("/auth/update-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updated = response.data.user;
      setUser((prev) => ({
        ...prev,
        firstName: updated.firstName,
        lastName: updated.lastName,
        username: updated.username,
        profilePictureURL: updated.profilePictureURL,
      }));

      if (updated.profilePictureURL) {
        setProfileImage(updated.profilePictureURL);
      }

      setIsEditing(false);
      setImageFile(null);
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleLogout = async () => {
    try {
      await api.get("/auth/logout");
    } catch {
      // ignore
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleLogoutAll = async () => {
    try {
      await api.get("/auth/logout-all");
    } catch {
      // ignore
    }
    localStorage.clear();
    navigate("/login");
  };

  if (loading) {
    return (
      <section className="profile">
        <div className="profile-card">
          <p>Loading profile...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="profile">
      <div className="profile-card">
        <div className="profile-image-wrapper">
          <img src={profileImage} alt="Profile" className="profile-image" />

          {isEditing && (
            <>
              <label htmlFor="profile-upload" className="camera-icon">
                📷
              </label>
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                hidden
              />
            </>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {!isEditing ? (
          <>
            <h2>{user.username}</h2>

            <div className="profile-info">
              <label>Email Address</label>
              <p>{user.email}</p>
            </div>

            <div className="profile-info">
              <label>Phone Number</label>
              <p>{user.phone}</p>
            </div>

            <button className="edit-btn" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>

            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>

            <button className="logout-all-btn" onClick={handleLogoutAll}>
              Logout All Devices
            </button>
          </>
        ) : (
          <>
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={user.firstName}
                onChange={handleChange}
                placeholder="First Name"
              />
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={user.lastName}
                onChange={handleChange}
                placeholder="Last Name"
              />
            </div>

            <div className="form-group">
              <label>Email Address (cannot change)</label>
              <input type="email" value={user.email} disabled />
            </div>

            <div className="form-group">
              <label>Phone Number (cannot change)</label>
              <input type="text" value={user.phone} disabled />
            </div>

            <div className="edit-actions">
              <button className="save-btn" onClick={handleSave}>
                Save Changes
              </button>
              <button
                className="cancel-btn"
                onClick={() => { setIsEditing(false); setImageFile(null); setError(""); }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Profile;