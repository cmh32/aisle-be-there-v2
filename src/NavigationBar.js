// src/NavigationBar.js - V7 (Dashboard Link is Text)
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
// --- REMOVE LayoutDashboard import ---
import { Sun, Moon, Home, Users, Mail, DollarSign, Briefcase, Clock, MessagesSquare } from 'lucide-react';
import './WeddingPlannerApp.css';

function NavigationBar({ isDarkMode, setIsDarkMode }) {

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
           <NavLink
             to="/"
             className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
             end
           >
             <Home size={18} /> Dashboard
           </NavLink>
           <NavLink 
             to="/guest-list" 
             className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
           >
             <Users size={18} /> Guest List
           </NavLink>
           <NavLink 
             to="/budget" 
             className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
           >
             <DollarSign size={18} /> Budget
           </NavLink>
           <NavLink 
             to="/vendor-hub" 
             className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
           >
             <Briefcase size={18} /> Vendor Hub
           </NavLink>
           <NavLink to="/timeline" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
             <Clock size={18} /> Timeline
           </NavLink>
           <NavLink 
             to="/reminders" 
             className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
           >
             <Mail size={18} /> Reminders
           </NavLink>
           <NavLink 
             to="/chatbot" 
             className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
           >
             <MessagesSquare size={18} /> Wedding Assistant
           </NavLink>
        </div>

        <div className="navbar-actions">
            <button
                className="dark-mode-toggle"
                onClick={toggleDarkMode}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </div>
      </div>
    </nav>
  );
}

export default NavigationBar;