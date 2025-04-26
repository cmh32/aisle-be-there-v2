// src/NavigationBar.js - V4 (Removed Theme Selector) - Verified
import React from 'react'; // Removed useState
import { Link, NavLink } from 'react-router-dom';
// REMOVED Palette icon import
import { Sun, Moon } from 'lucide-react'; // Keep Sun/Moon
import './WeddingPlannerApp.css';

// Only needs dark mode props now
function NavigationBar({ isDarkMode, setIsDarkMode }) {

  // Toggle dark mode state (passed up to App.js)
  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="navbar-logo">Aisle Be There</Link>
        </div>

        <div className="navbar-links">
           <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')} end>Guest List</NavLink>
           <NavLink to="/reminders" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Reminder Emails</NavLink>
        </div>

        {/* Container for just the dark mode toggle */}
        <div className="navbar-actions">
            <button
                className="dark-mode-toggle"
                onClick={toggleDarkMode}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
                {/* Show Moon icon for Light mode, Sun icon for Dark mode */}
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {/* Theme selector completely removed */}
        </div>
      </div>
    </nav>
  );
}

export default NavigationBar;