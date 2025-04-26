// src/App.js - V4 (Corrected Dark Mode Effect)
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavigationBar from './NavigationBar';
import GuestListPage from './GuestListPage';
import ReminderEmailsPage from './ReminderEmailsPage';
// Removed theme icons import
import './WeddingPlannerApp.css';

// --- Helper functions ---
function getDaysInMonth(month, year) {
    if (!month || !year || isNaN(month) || isNaN(year)) return 31; month = Number(month); year = Number(year);
    if (month === 2) { return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28; }
    else if ([4, 6, 9, 11].includes(month)) { return 30; } else { return 31; }
}
function formatDate(month, day, year) { /* ... unchanged ... */ if (!month || !day || !year || isNaN(month) || isNaN(day) || isNaN(year)) return null; const date = new Date(year, month - 1, day); if (isNaN(date.getTime())) return null; return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });}
function calculateDaysUntil(month, day, year) { /* ... unchanged ... */ if (!month || !day || !year || isNaN(month) || isNaN(day) || isNaN(year)) return null; try { const today = new Date(); today.setHours(0, 0, 0, 0); const weddingDate = new Date(year, month - 1, day); if (isNaN(weddingDate.getTime())) return null; weddingDate.setHours(0, 0, 0, 0); if (weddingDate < today) return "Passed!"; const diffTime = weddingDate - today; const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); return diffDays; } catch (e) { return null; } }
function calculateRsvpDate(month, day, year, daysBefore) { /* ... unchanged ... */ if (!month || !day || !year || daysBefore === null || daysBefore === '' || isNaN(month) || isNaN(day) || isNaN(year) || isNaN(daysBefore)) { return null; } try { const weddingDate = new Date(Number(year), Number(month) - 1, Number(day)); if (isNaN(weddingDate.getTime())) return null; const deadlineDate = new Date(weddingDate.getTime()); deadlineDate.setDate(weddingDate.getDate() - Number(daysBefore)); if (isNaN(deadlineDate.getTime())) return null; return deadlineDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); } catch (e) { console.error("Error calculating RSVP date:", e); return null; } }

// --- Initial Guest Data ---
const initialGuests = [ /* ... unchanged ... */ ];
// Removed themes array

function App() {
  // --- State ---
  const [guests, setGuests] = useState(initialGuests);
  // Removed selectedTheme state
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [isDarkMode, setIsDarkMode] = useState(prefersDark);
  const [weddingMonth, setWeddingMonth] = useState('');
  const [weddingDay, setWeddingDay] = useState('');
  const [weddingYear, setWeddingYear] = useState('');
  const [countdownDays, setCountdownDays] = useState(null);
  const [formattedWeddingDate, setFormattedWeddingDate] = useState("");
  const [isSettingDate, setIsSettingDate] = useState(true);
  const [rsvpDeadlineDays, setRsvpDeadlineDays] = useState(30);
  const [rsvpDeadlineDate, setRsvpDeadlineDate] = useState(null);

  // --- Effects ---
  // REMOVED Effect for setting selectedTheme colors

  // CORRECTED Effect to apply dark/light mode attribute
  useEffect(() => {
    const newTheme = isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    // Let CSS variables defined in index.css handle the body background
    document.body.style.backgroundColor = 'var(--background-color)';
  }, [isDarkMode]); // Only depends on isDarkMode

  // Effect to Calculate Countdown (depends on date state)
   useEffect(() => {
    const monthNum = parseInt(weddingMonth, 10);
    const dayNum = parseInt(weddingDay, 10);
    const yearNum = parseInt(weddingYear, 10);
    const validDate = formatDate(monthNum, dayNum, yearNum);
    if (validDate && validDate !== "Invalid Date") {
        const days = calculateDaysUntil(monthNum, dayNum, yearNum);
        setCountdownDays(days); setFormattedWeddingDate(validDate);
        if (days !== null) { setIsSettingDate(false); } else { setIsSettingDate(true); }
    } else {
        setCountdownDays(null); setFormattedWeddingDate(""); setRsvpDeadlineDate(null); setIsSettingDate(true);
    }
  }, [weddingMonth, weddingDay, weddingYear]);

  // Effect to Calculate RSVP Deadline Date (depends on date state and deadline days)
  useEffect(() => {
      const monthNum = parseInt(weddingMonth, 10);
      const dayNum = parseInt(weddingDay, 10);
      const yearNum = parseInt(weddingYear, 10);
      const daysNum = parseInt(rsvpDeadlineDays, 10);
      if (formattedWeddingDate && formattedWeddingDate !== "Invalid Date" && !isNaN(daysNum) && daysNum >= 0) {
          const deadline = calculateRsvpDate(monthNum, dayNum, yearNum, daysNum);
          setRsvpDeadlineDate(deadline);
      } else {
          setRsvpDeadlineDate(null);
      }
  }, [formattedWeddingDate, weddingMonth, weddingDay, weddingYear, rsvpDeadlineDays]);


  return (
    <>
      <NavigationBar
         // Removed theme props
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
      <main className="main-content-area">
        <Routes>
          <Route
            path="/"
            element={
              <GuestListPage
                guests={guests} setGuests={setGuests}
                weddingMonth={weddingMonth} setWeddingMonth={setWeddingMonth}
                weddingDay={weddingDay} setWeddingDay={setWeddingDay}
                weddingYear={weddingYear} setWeddingYear={setWeddingYear}
                countdownDays={countdownDays} formattedWeddingDate={formattedWeddingDate}
                isSettingDate={isSettingDate} setIsSettingDate={setIsSettingDate}
                getDaysInMonth={getDaysInMonth}
              />
            }
          />
          <Route
            path="/reminders"
            element={
              <ReminderEmailsPage
                guests={guests}
                isWeddingDateSet={!!formattedWeddingDate && formattedWeddingDate !== "Invalid Date"}
                rsvpDeadlineDays={rsvpDeadlineDays} setRsvpDeadlineDays={setRsvpDeadlineDays}
                rsvpDeadlineDate={rsvpDeadlineDate}
              />
            }
          />
        </Routes>
      </main>
    </>
  );
}

export default App;