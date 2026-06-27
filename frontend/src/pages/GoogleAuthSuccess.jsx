import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const GoogleAuthSuccess = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const user = params.get("user");

        if (token && user) {
            localStorage.setItem("accessToken", token);
            localStorage.setItem("user", user);
            navigate("/profile");
        } else {
            navigate("/login?error=google_auth_failed");
        }
    }, [navigate]);

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
            <p>Signing you in with Google...</p>
        </div>
    );
};

export default GoogleAuthSuccess;