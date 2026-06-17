import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home">
      <div className="home-overlay">
        <div className="home-content">
          <h1>Smart Parking System</h1>
          <p>
            Welcome to our secure authentication platform.
            Register a new account or login to continue.
          </p>
          <div className="home-buttons">
            <button className="register-btn" onClick={() => navigate("/register")}>
              Register
            </button>
            <button className="login-btn" onClick={() => navigate("/login")}>
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
