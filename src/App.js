// src/App.js - V8 (Corrected Errors and Warnings)
import React, { useState, useEffect, useMemo } from 'react'; // Restored useEffect import
// Removed unused Navigate import from react-router-dom
import { Routes, Route } from 'react-router-dom';
import NavigationBar from './NavigationBar';
import LoginPage from './LoginPage';
import DashboardPage from './DashboardPage';
import GuestListPage from './GuestListPage';
import ReminderEmailsPage from './ReminderEmailsPage';
import BudgetPage from './BudgetPage';
import VendorHubPage from './VendorHubPage';
import TimelineBuilderPage from './TimelineBuilderPage'; // Import the new page
import ChatbotPage from './ChatbotPage'; // Import the chatbot page
import FloatingRings from './components/FloatingRings'; // Import the component
import './WeddingPlannerApp.css';

// --- Helper functions (Restored) ---
function getDaysInMonth(month, year) { if (!month || !year || isNaN(month) || isNaN(year)) return 31; month = Number(month); year = Number(year); if (month === 2) { return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28; } else if ([4, 6, 9, 11].includes(month)) { return 30; } else { return 31; } }
function formatDate(month, day, year) { if (!month || !day || !year || isNaN(month) || isNaN(day) || isNaN(year)) return null; const date = new Date(year, month - 1, day); if (isNaN(date.getTime())) return null; return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });}
function calculateDaysUntil(month, day, year) { if (!month || !day || !year || isNaN(month) || isNaN(day) || isNaN(year)) return null; try { const today = new Date(); today.setHours(0, 0, 0, 0); const weddingDate = new Date(year, month - 1, day); if (isNaN(weddingDate.getTime())) return null; weddingDate.setHours(0, 0, 0, 0); if (weddingDate < today) return "Whoops! You've already missed the date!"; const diffTime = weddingDate - today; const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); return diffDays; } catch (e) { return null; } }
function calculateRsvpDate(month, day, year, daysBefore) { if (!month || !day || !year || daysBefore === null || daysBefore === '' || isNaN(month) || isNaN(day) || isNaN(year) || isNaN(daysBefore)) { return null; } try { const weddingDate = new Date(Number(year), Number(month) - 1, Number(day)); if (isNaN(weddingDate.getTime())) return null; const deadlineDate = new Date(weddingDate.getTime()); deadlineDate.setDate(weddingDate.getDate() - Number(daysBefore)); if (isNaN(deadlineDate.getTime())) return null; return deadlineDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); } catch (e) { console.error("Error calculating RSVP date:", e); return null; } }
function formatCurrency(amount) { if (amount === null || typeof amount === 'undefined' || isNaN(amount)) return '$0.00'; return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

// --- Initial Guest Data (Restored) ---
// Define some initial guests or leave as empty array
const initialGuests = [
    // Add sample guest objects here if needed, e.g.:
    // { id: 1, name: "Alice Smith", email: "alice@example.com", phone: "111-222-3333", address: "1 Main St", joyFactor: "Lots of joy", relationshipCloseness: "Close friend", futureRelationshipPotential: "Want to maintain", obligationLevel: "No obligations", inviteDecision: "Definitely inviting", inviteSent: "Sent", rsvpStatus: "Confirmed" },
    // { id: 2, name: "Bob Jones", email: "bob@example.com", phone: "444-555-6666", address: "2 Oak Ave", joyFactor: "Some joy", relationshipCloseness: "Friend", futureRelationshipPotential: "Likely to maintain", obligationLevel: "No obligations", inviteDecision: "Definitely inviting", inviteSent: "Sent", rsvpStatus: "Pending" }
];

// --- Initial Vendor Data (Add this) ---
const initialVendors = [
    { id: 1, name: "Grand Hall Rentals", category: "Venue", contactName: "Ms. Eleanor", phone: "555-111-2222", email: "eleanor@grandhall.com", contractStatus: "Signed", paymentDue: "2024-10-01", notes: "Includes setup and cleanup." },
    { id: 2, name: "Chef's Delight Catering", category: "Catering", contactName: "Mr. John", phone: "555-333-4444", email: "john@chefsdelight.com", contractStatus: "Pending", paymentDue: "2024-11-15", notes: "Final guest count needed 2 weeks prior." },
];

// --- Initial Timeline Data (can be empty or a default) ---
const initialTimelineEvents = []; // Start empty

function App() {
  // --- State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Use the restored initialGuests
  const [guests, setGuests] = useState(initialGuests);
  const [isDarkMode, setIsDarkMode] = useState(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  // Date State
  const [weddingMonth, setWeddingMonth] = useState('');
  const [weddingDay, setWeddingDay] = useState('');
  const [weddingYear, setWeddingYear] = useState('');
  const [countdownDays, setCountdownDays] = useState(null);
  const [formattedWeddingDate, setFormattedWeddingDate] = useState("");
  const [isSettingDate, setIsSettingDate] = useState(true);
  // Reminder State
  const [rsvpDeadlineDays, setRsvpDeadlineDays] = useState(30);
  const [rsvpDeadlineDate, setRsvpDeadlineDate] = useState(null);
  // Budget State
  const [allottedBudget, setAllottedBudget] = useState(20000);
  const [expenses, setExpenses] = useState([
        {id: 1, category: 'Venue', item: 'Grand Hall Rental', estimatedCost: 8000, actualCost: 8500},
        {id: 2, category: 'Catering', item: 'Dinner Buffet (100 guests)', estimatedCost: 6000, actualCost: null},
        {id: 3, category: 'Photography/Videography', item: 'Full Day Photo Package', estimatedCost: 3500, actualCost: 3500},
  ]);
  // Vendor State (Add this)
  const [vendors, setVendors] = useState(initialVendors);
  // Timeline State (Add this)
  const [timelineEvents, setTimelineEvents] = useState(initialTimelineEvents);

  // --- Effects (Restored) ---
  // Dark mode effect
  useEffect(() => {
    const newTheme = isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    document.body.style.backgroundColor = 'var(--background-color)';
  }, [isDarkMode]);

  // Countdown calculation effect
  useEffect(() => {
    const monthNum = parseInt(weddingMonth, 10);
    const dayNum = parseInt(weddingDay, 10);
    const yearNum = parseInt(weddingYear, 10);
    const validDate = formatDate(monthNum, dayNum, yearNum);
    if (validDate && validDate !== "Invalid Date") {
        const days = calculateDaysUntil(monthNum, dayNum, yearNum);
        // Use the state setters
        setCountdownDays(days);
        setFormattedWeddingDate(validDate);
        if (days !== null) { setIsSettingDate(false); } else { setIsSettingDate(true); }
    } else {
        setCountdownDays(null);
        setFormattedWeddingDate("");
        setRsvpDeadlineDate(null); // Also reset deadline if date becomes invalid
        setIsSettingDate(true);
    }
  }, [weddingMonth, weddingDay, weddingYear]); // Dependencies are correct

   // RSVP deadline calculation effect
   useEffect(() => {
     const monthNum = parseInt(weddingMonth, 10);
     const dayNum = parseInt(weddingDay, 10);
     const yearNum = parseInt(weddingYear, 10);
     const daysNum = parseInt(rsvpDeadlineDays, 10);
     // Check formattedWeddingDate is valid before calculating
     if (formattedWeddingDate && formattedWeddingDate !== "Invalid Date" && !isNaN(daysNum) && daysNum >= 0) {
         const deadline = calculateRsvpDate(monthNum, dayNum, yearNum, daysNum);
         // Use the state setter
         setRsvpDeadlineDate(deadline);
     } else {
         setRsvpDeadlineDate(null);
     }
     // Depend on formatted date and deadline days input
   }, [formattedWeddingDate, weddingMonth, weddingDay, weddingYear, rsvpDeadlineDays]);


  // --- Event Handlers ---
  const handleEditDate = () => setIsSettingDate(true);
  const handleLoginSuccess = () => setIsAuthenticated(true);

  // --- Memoized Budget Calculation ---
  // Calculate budget summary for passing to BudgetPage
  const totalSpentOrCommitted = useMemo(() => {
    return expenses.reduce((sum, item) => {
      const cost = Number(item.actualCost) || Number(item.estimatedCost) || 0;
      return sum + cost;
    }, 0);
  }, [expenses]);

  // --- Memoized Wedding Date Object (Optional but helpful) ---
  // We need the date for iCal export. formattedWeddingDate is just a string.
  const weddingDateObject = useMemo(() => {
      const monthNum = parseInt(weddingMonth, 10);
      const dayNum = parseInt(weddingDay, 10);
      const yearNum = parseInt(weddingYear, 10);
      if (monthNum && dayNum && yearNum && !isNaN(monthNum) && !isNaN(dayNum) && !isNaN(yearNum)) {
         const date = new Date(yearNum, monthNum - 1, dayNum);
         // Basic validation check
         if (!isNaN(date.getTime()) &&
             date.getFullYear() === yearNum &&
             date.getMonth() === monthNum - 1 &&
             date.getDate() === dayNum) {
              return date;
          }
      }
      return null; // Return null if date is invalid or not fully set
  }, [weddingMonth, weddingDay, weddingYear]);

  // --- Conditional Rendering (Unchanged) ---
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // --- Main App Layout ---
  return (
    <>
      <FloatingRings />
      <NavigationBar
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
      <main className="main-content-area">
        <Routes>
          <Route
            path="/"
            element={
              <DashboardPage
                weddingMonth={weddingMonth}
                weddingDay={weddingDay}
                weddingYear={weddingYear}
                countdownDays={countdownDays}
                formattedWeddingDate={formattedWeddingDate}
                isSettingDate={isSettingDate}
                setIsSettingDate={setIsSettingDate}
                guests={guests}
                expenses={expenses}
                allottedBudget={allottedBudget}
                formatCurrency={formatCurrency}
                setWeddingMonth={setWeddingMonth}
                setWeddingDay={setWeddingDay}
                setWeddingYear={setWeddingYear}
                getDaysInMonth={getDaysInMonth}
                handleEditDate={handleEditDate}
                totalSpentOrCommitted={totalSpentOrCommitted}
              />
            }
          />
          <Route
            path="/guest-list"
            element={
              <GuestListPage
                guests={guests}
                setGuests={setGuests}
                weddingMonth={weddingMonth}
                setWeddingMonth={setWeddingMonth}
                weddingDay={weddingDay}
                setWeddingDay={setWeddingDay}
                weddingYear={weddingYear}
                setWeddingYear={setWeddingYear}
                countdownDays={countdownDays}
                formattedWeddingDate={formattedWeddingDate}
                isSettingDate={isSettingDate}
                setIsSettingDate={setIsSettingDate}
                getDaysInMonth={getDaysInMonth}
              />
            }
          />
          <Route
            path="/budget"
            element={
              <BudgetPage
                allottedBudget={allottedBudget}
                setAllottedBudget={setAllottedBudget}
                expenses={expenses}
                setExpenses={setExpenses}
                totalSpentOrCommitted={totalSpentOrCommitted}
              />
            }
          />
          <Route
            path="/vendor-hub"
            element={
              <VendorHubPage
                vendors={vendors}
                setVendors={setVendors}
              />
            }
          />
          <Route
            path="/timeline"
            element={
              <TimelineBuilderPage
                timelineEvents={timelineEvents}
                setTimelineEvents={setTimelineEvents}
                weddingDate={weddingDateObject}
              />
            }
          />
          <Route
            path="/reminders"
            element={
              <ReminderEmailsPage
                guests={guests}
                isWeddingDateSet={!!formattedWeddingDate && formattedWeddingDate !== "Invalid Date"}
                rsvpDeadlineDays={rsvpDeadlineDays}
                setRsvpDeadlineDays={setRsvpDeadlineDays}
                rsvpDeadlineDate={rsvpDeadlineDate}
              />
            }
          />
          <Route
            path="/chatbot"
            element={
              <ChatbotPage
                guests={guests}
                formattedWeddingDate={formattedWeddingDate}
                countdownDays={countdownDays}
                rsvpDeadlineDate={rsvpDeadlineDate}
                expenses={expenses}
                allottedBudget={allottedBudget}
                vendors={vendors}
                timelineEvents={timelineEvents}
              />
            }
          />
        </Routes>
      </main>
    </>
  );
}

export default App;