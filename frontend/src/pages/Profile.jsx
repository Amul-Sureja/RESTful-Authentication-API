import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api.js";

/* ── tiny countdown hook ── */
function useCountdown(seconds) {
  const [left, setLeft] = useState(0);
  const timer = useRef(null);

  const start = () => {
    setLeft(seconds);
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      setLeft((prev) => {
        if (prev <= 1) { clearInterval(timer.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(timer.current), []);
  return { left, start };
}

const Profile = () => {
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({
    firstName: "", lastName: "", username: "", email: "", phone: "", profilePictureURL: "",
  });
  const [profileImage, setProfileImage] = useState("/profile.jpg");
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ── email verify state ── */
  const [emailVerified, setEmailVerified] = useState(false);
  const [showEmailOTP, setShowEmailOTP] = useState(false);
  const [emailOTP, setEmailOTP] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailMsg, setEmailMsg] = useState({ type: "", text: "" }); // {type:"ok"|"err", text}
  const emailCountdown = useCountdown(60);

  /* ── phone verify state ── */
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showPhoneOTP, setShowPhoneOTP] = useState(false);
  const [phoneOTP, setPhoneOTP] = useState("");
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);
  const [phoneMsg, setPhoneMsg] = useState({ type: "", text: "" });
  const phoneCountdown = useCountdown(60);

  useEffect(() => { fetchProfile(); }, []);

  /* ────────────────── fetch ────────────────── */
  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/auth/profile");
      const p = data.user;
      setUser({
        firstName: p.firstName || "",
        lastName: p.lastName || "",
        username: p.username || "",
        email: p.email || "",
        phone: p.phone || "",
        profilePictureURL: p.profilePictureURL || "",
      });
      setProfileImage(p.profilePictureURL || "/profile.jpg");
      setEmailVerified(p.emailVerified === true);
      setPhoneVerified(p.phoneVerified === true);
    } catch (err) {
      if (err.response?.status !== 401) setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setUser({ ...user, [e.target.name]: e.target.value });
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setProfileImage(URL.createObjectURL(file)); }
  };

  /* ────────────────── email OTP ────────────────── */
  const sendEmailOTP = async () => {
    setEmailMsg({ type: "", text: "" });
    setEmailSending(true);
    try {
      await api.post("/auth/send-email-otp");
      setShowEmailOTP(true);
      setEmailOTP("");
      emailCountdown.start();
      setEmailMsg({ type: "ok", text: "OTP sent to your email address." });
    } catch (err) {
      setEmailMsg({ type: "err", text: err.response?.data?.message || "Failed to send email OTP" });
    } finally {
      setEmailSending(false);
    }
  };

  const verifyEmailOTP = async () => {
    if (emailOTP.length !== 6) {
      setEmailMsg({ type: "err", text: "Please enter the 6-digit OTP." });
      return;
    }
    setEmailMsg({ type: "", text: "" });
    setEmailVerifying(true);
    try {
      await api.post("/auth/verify-email-otp", { otp: emailOTP });
      setEmailVerified(true);
      setShowEmailOTP(false);
      setEmailOTP("");
      setEmailMsg({ type: "ok", text: "Email verified successfully!" });
    } catch (err) {
      setEmailMsg({ type: "err", text: err.response?.data?.message || "Invalid OTP" });
    } finally {
      setEmailVerifying(false);
    }
  };

  /* ────────────────── phone OTP ────────────────── */
  const sendPhoneOTP = async () => {
    setPhoneMsg({ type: "", text: "" });
    setPhoneSending(true);
    try {
      await api.post("/auth/send-phone-otp");
      setShowPhoneOTP(true);
      setPhoneOTP("");
      phoneCountdown.start();
      setPhoneMsg({ type: "ok", text: "OTP sent to your phone number." });
    } catch (err) {
      setPhoneMsg({ type: "err", text: err.response?.data?.message || "Failed to send phone OTP" });
    } finally {
      setPhoneSending(false);
    }
  };

  const verifyPhoneOTP = async () => {
    if (phoneOTP.length !== 6) {
      setPhoneMsg({ type: "err", text: "Please enter the 6-digit OTP." });
      return;
    }
    setPhoneMsg({ type: "", text: "" });
    setPhoneVerifying(true);
    try {
      await api.post("/auth/verify-phone-otp", { otp: phoneOTP });
      setPhoneVerified(true);
      setShowPhoneOTP(false);
      setPhoneOTP("");
      setPhoneMsg({ type: "ok", text: "Phone verified successfully!" });
    } catch (err) {
      setPhoneMsg({ type: "err", text: err.response?.data?.message || "Invalid OTP" });
    } finally {
      setPhoneVerifying(false);
    }
  };

  /* ────────────────── save profile ────────────────── */
  const handleSave = async () => {
    setError(""); setSuccess("");
    try {
      const formData = new FormData();
      formData.append("firstName", user.firstName);
      formData.append("lastName", user.lastName);
      if (imageFile) formData.append("image", imageFile);

      const { data } = await api.patch("/auth/update-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const u = data.user;
      setUser((prev) => ({
        ...prev,
        firstName: u.firstName,
        lastName: u.lastName,
        username: u.username,
        profilePictureURL: u.profilePictureURL,
      }));
      if (u.profilePictureURL) setProfileImage(u.profilePictureURL);
      setIsEditing(false);
      setImageFile(null);
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setImageFile(null);
    setError(""); setSuccess("");
    setShowEmailOTP(false); setEmailOTP(""); setEmailMsg({ type: "", text: "" });
    setShowPhoneOTP(false); setPhoneOTP(""); setPhoneMsg({ type: "", text: "" });
  };

  const handleLogout = async () => {
    try { await api.get("/auth/logout"); } catch { }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleLogoutAll = async () => {
    try { await api.get("/auth/logout-all"); } catch { }
    localStorage.clear();
    navigate("/login");
  };

  /* ────────────────── loading screen ────────────────── */
  if (loading) {
    return (
      <section className="profile">
        <div className="profile-card">
          <div className="profile-banner" />
          <div className="profile-body">
            <p className="profile-loading">Loading profile...</p>
          </div>
        </div>
      </section>
    );
  }

  /* ────────────────── render ────────────────── */
  return (
    <section className="profile">
      <div className="profile-card">
        <div className="profile-banner" />

        {/* ── Avatar ── */}
        <div className="profile-image-wrapper">
          <img src={profileImage} alt="Profile" className="profile-image" />
          {isEditing && (
            <>
              <label htmlFor="profile-upload" className="camera-icon">📷</label>
              <input id="profile-upload" type="file" accept="image/*" onChange={handleImageChange} hidden />
            </>
          )}
        </div>

        <div className="profile-body">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* ══════════════ VIEW MODE ══════════════ */}
          {!isEditing ? (
            <>
              <h2>{user.username}</h2>
              <p className="profile-role">{user.email}</p>

              <div className="profile-info-grid">
                <div className="profile-info">
                  <label>Email Address</label>
                  <p>{user.email}</p>
                </div>
                <div className="profile-info">
                  <label>Phone Number</label>
                  <p>{user.phone || "—"}</p>
                </div>
              </div>

              <div className="profile-actions">
                <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
                <button className="logout-all-btn" onClick={handleLogoutAll}>Logout All Devices</button>
              </div>
            </>
          ) : (
            /* ══════════════ EDIT MODE ══════════════ */
            <>
              {/* First Name */}
              <div className="form-group">
                <label>FIRST NAME</label>
                <input type="text" name="firstName" value={user.firstName} onChange={handleChange} placeholder="First Name" />
              </div>

              {/* Last Name */}
              <div className="form-group">
                <label>LAST NAME</label>
                <input type="text" name="lastName" value={user.lastName} onChange={handleChange} placeholder="Last Name" />
              </div>

              {/* ── Email verify ── */}
              <div className="form-group">
                <label>EMAIL ADDRESS</label>
                <div className="contact-field">
                  <div className="contact-field-row">
                    <div className="contact-field-value">
                      <span className="contact-field-text">{user.email}</span>
                    </div>

                    {emailVerified ? (
                      <span className="verified-badge">Verified</span>
                    ) : showEmailOTP ? (
                      /* resend button while OTP box is open */
                      <button
                        type="button"
                        className="verify-btn-inline"
                        onClick={sendEmailOTP}
                        disabled={emailSending || emailCountdown.left > 0}
                      >
                        {emailSending
                          ? "Sending…"
                          : emailCountdown.left > 0
                            ? `Resend (${emailCountdown.left}s)`
                            : "Resend"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="verify-btn-inline"
                        onClick={sendEmailOTP}
                        disabled={emailSending}
                      >
                        {emailSending ? "Sending…" : "Verify"}
                      </button>
                    )}
                  </div>

                  {/* per-field message */}
                  {emailMsg.text && (
                    <p className={emailMsg.type === "ok" ? "field-msg field-msg--ok" : "field-msg field-msg--err"}>
                      {emailMsg.text}
                    </p>
                  )}

                  {/* OTP input row */}
                  {!emailVerified && showEmailOTP && (
                    <div className="otp-box">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Enter 6-digit OTP"
                        value={emailOTP}
                        maxLength={6}
                        onChange={(e) => setEmailOTP(e.target.value.replace(/\D/g, ""))}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="otp-submit-btn"
                        onClick={verifyEmailOTP}
                        disabled={emailVerifying || emailOTP.length !== 6}
                      >
                        {emailVerifying ? "Verifying…" : "Submit"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Phone verify ── */}
              <div className="form-group">
                <label>PHONE NUMBER</label>
                <div className="contact-field">
                  <div className="contact-field-row">
                    <div className="contact-field-value">
                        <span className="contact-field-text">{user.phone || "—"}</span>
                    </div>

                    {phoneVerified ? (
                      <span className="verified-badge">Verified</span>
                    ) : showPhoneOTP ? (
                      <button
                        type="button"
                        className="verify-btn-inline"
                        onClick={sendPhoneOTP}
                        disabled={phoneSending || phoneCountdown.left > 0}
                      >
                        {phoneSending
                          ? "Sending…"
                          : phoneCountdown.left > 0
                            ? `Resend (${phoneCountdown.left}s)`
                            : "Resend"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="verify-btn-inline"
                        onClick={sendPhoneOTP}
                        disabled={phoneSending}
                      >
                        {phoneSending ? "Sending…" : "Verify"}
                      </button>
                    )}
                  </div>

                  {/* per-field message */}
                  {phoneMsg.text && (
                    <p className={phoneMsg.type === "ok" ? "field-msg field-msg--ok" : "field-msg field-msg--err"}>
                      {phoneMsg.text}
                    </p>
                  )}

                  {/* OTP input row */}
                  {!phoneVerified && showPhoneOTP && (
                    <div className="otp-box">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Enter 6-digit OTP"
                        value={phoneOTP}
                        maxLength={6}
                        onChange={(e) => setPhoneOTP(e.target.value.replace(/\D/g, ""))}
                      />
                      <button
                        type="button"
                        className="otp-submit-btn"
                        onClick={verifyPhoneOTP}
                        disabled={phoneVerifying || phoneOTP.length !== 6}
                      >
                        {phoneVerifying ? "Verifying…" : "Submit"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Save / Cancel */}
              <div className="edit-actions">
                <button className="save-btn" onClick={handleSave}>Save Changes</button>
                <button className="cancel-btn" onClick={cancelEdit}>Cancel</button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Profile;