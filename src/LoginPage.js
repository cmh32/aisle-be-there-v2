// src/LoginPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react'; // Optional icons
import './WeddingPlannerApp.css'; // Use shared CSS file

// This component receives a function prop from App.js to signal successful login
function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();

  // Placeholder login handler
  const handleLogin = () => {
    console.log("Login button clicked - simulating login.");
    // Signal to App.js that login was successful
    onLoginSuccess();
    // Navigate to the main dashboard
    navigate('/'); // Navigate to the root route which now shows the dashboard
  };

  // Placeholder signup handler
  const handleSignUp = () => {
    alert("Sign Up feature coming soon!");
  };

  return (
    <div className="page-container login-page-container">
      <div className="login-box">
        <h1 className="login-welcome">Welcome to</h1>
        {/* You can reuse the logo style or create a specific one */}
        <h2 className="app-logo-login">Aisle Be There</h2>
        <p className="login-subtitle">Your personal wedding planning assistant</p>

        <button className="action-button primary-button login-button" onClick={handleLogin}>
           <LogIn size={18} /> Login Now
        </button>

        <button className="action-button secondary-button signup-button" onClick={handleSignUp}>
           <UserPlus size={18} /> Sign Up Now!
        </button>
         <p className="login-note"> (No username/password needed for now) </p>
      </div>
    </div>
  );
}

export default LoginPage;