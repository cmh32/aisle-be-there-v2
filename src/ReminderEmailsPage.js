// src/ReminderEmailsPage.js - COMPLETE V3 (Fixed Syntax Error)
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom'; // Import Link for prompt message
import { Mail, Send, Loader, User, Check, X, CalendarX2, Info } from 'lucide-react'; // Added Check, X, CalendarX2, Info
import './WeddingPlannerApp.css';

// Function to call the backend API for generating reminders
const generateEmailReminders = async (guestsToRemind, additionalFacts, rsvpDeadlineDate) => {
  console.log("Calling backend to generate reminders for:", guestsToRemind.map(g => g.name));
  console.log("RSVP Deadline Date to send:", rsvpDeadlineDate);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001/api/generate-reminders';

  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          guests: guestsToRemind,
          facts: additionalFacts,
          rsvpDeadlineDate: rsvpDeadlineDate
      }),
    });

    if (!response.ok) {
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
      } catch (e) { /* ignore parsing error */ }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    console.log("Received generated emails from backend:", data);
    return data;

  } catch (error) {
    console.error("Error fetching reminders from backend:", error);
    throw new Error(`Failed to generate reminders: ${error.message}`);
  }
};


// Receive necessary props from App.js
function ReminderEmailsPage({ guests, isWeddingDateSet, rsvpDeadlineDays, setRsvpDeadlineDays, rsvpDeadlineDate }) {
  const [additionalFacts, setAdditionalFacts] = useState({});
  const [generatedEmails, setGeneratedEmails] = useState({});
  const [loadingStates, setLoadingStates] = useState({}); // guestId: boolean, 'all': boolean
  const [error, setError] = useState(null);

  // Memoize guests needing reminder
  const guestsNeedingReminder = useMemo(() => {
    return guests.filter(g => g.inviteSent === 'Sent' && g.rsvpStatus === 'Pending');
  }, [guests]);

  // Handler for fact input change
  const handleFactChange = (guestId, value) => {
    setAdditionalFacts(prev => ({ ...prev, [guestId]: value }));
  };

  // Helper to set loading state
  const setLoading = (key, value) => {
    setLoadingStates(prev => ({...prev, [key]: value }));
  };

  // Handler to generate emails (single or all)
  const handleGenerate = async (guest = null) => {
    if (!isWeddingDateSet) {
        setError("Please set the Wedding Date on the Guest List page first.");
        return;
    }

    const guestsToProcess = guest ? [guest] : guestsNeedingReminder;
    if (guestsToProcess.length === 0) return;

    const loadingKey = guest ? guest.id : 'all';
    setLoading(loadingKey, true);
    setError(null); // Clear previous general errors

    // Clear previous results only for the guests being processed now
    setGeneratedEmails(prev => {
        const next = {...prev};
        guestsToProcess.forEach(g => delete next[g.id]);
        return next;
    });

    try {
      const factsForRequest = {};
       guestsToProcess.forEach(g => {
           if(additionalFacts[g.id]) factsForRequest[g.id] = additionalFacts[g.id];
       });

      // Pass the calculated rsvpDeadlineDate (might be null)
      const results = await generateEmailReminders(guestsToProcess, factsForRequest, rsvpDeadlineDate);
      setGeneratedEmails(prev => ({ ...prev, ...results }));

    } catch (err) {
      console.error("Failed to generate reminders:", err);
      setError(`Failed to generate reminders. Please check the backend server. Error: ${err.message}`);
      // Mark specific guests as errored
      guestsToProcess.forEach(g => {
           setGeneratedEmails(prev => ({ ...prev, [g.id]: "Error" }));
       });
    } finally {
      setLoading(loadingKey, false); // Stop loading for this key
    }
  };

  // Function to create mailto link (unchanged)
  const createMailtoLink = (guest, emailBody) => {
    if (!guest || !guest.email || !emailBody || emailBody === "Error") return '#';
    const subjectMatch = emailBody.match(/^Subject: (.*)$/m);
    const subject = subjectMatch ? subjectMatch[1] : "Wedding RSVP Reminder";
    const body = emailBody.replace(/^Subject: .*?\n\n/, '');
    return `mailto:${guest.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Handler for deadline days input (unchanged)
  const handleDeadlineDaysChange = (e) => {
      const value = e.target.value;
      if (value === '' || /^\d+$/.test(value)) {
          setRsvpDeadlineDays(value === '' ? '' : Math.max(0, parseInt(value, 10)));
      }
  };

  // --- JSX Return ---
  return (
    <div className="page-container reminder-page-container">
      <div className="app-header">
        <h1 className="app-title">RSVP Reminders</h1>
        <h2 className="app-subtitle">Generate personalized emails for guests who haven't RSVP'd</h2>
      </div>

      {error && <div className="reminder-error-banner">{error}</div>}

      {/* RSVP Deadline Section */}
      <section className="rsvp-deadline-section">
          {!isWeddingDateSet ? (
              <div className="prompt-set-date">
                  <Info size={18} /> Please <Link to="/">set your Wedding Date</Link> on the Guest List page to calculate the RSVP deadline.
              </div>
          ) : (
              <div className="rsvp-deadline-card">
                  <label htmlFor="deadline-days">RSVP Deadline:</label>
                  <div className="deadline-input-group">
                      <input
                          type="number"
                          id="deadline-days"
                          className="deadline-input"
                          value={rsvpDeadlineDays}
                          onChange={handleDeadlineDaysChange}
                          min="0"
                          max="180"
                      />
                      <span>days before wedding</span>
                  </div>
                  {rsvpDeadlineDate && (
                      <p className="deadline-display">
                          Calculated Deadline: <strong>{rsvpDeadlineDate}</strong>
                      </p>
                  )}
                  {rsvpDeadlineDays === '' && !rsvpDeadlineDate && ( // Show only if input is empty AND date not calculated
                       <p className="deadline-info">Enter days before wedding to set deadline.</p>
                  )}
              </div>
          )}
      </section>

      {/* Main Controls */}
      <div className="reminder-controls">
        <button
          onClick={() => handleGenerate()} // Generate for all
          disabled={!isWeddingDateSet || loadingStates['all'] || guestsNeedingReminder.length === 0}
          className="action-button primary-button generate-all-button"
          title={!isWeddingDateSet ? "Set Wedding Date on Guest List page first" : ""}
        >
           {/* --- REMOVED erroneous line with placeholder comments --- */}
           {/* Correct conditional rendering for button text */}
           {loadingStates['all'] ? ( <> <Loader size={16} className="spinner" /> Generating All... </> ) : ( <> <Mail size={16} /> Generate All Reminders ({guestsNeedingReminder.length}) </> )}
        </button>
        {guestsNeedingReminder.length === 0 && isWeddingDateSet && <p className="no-reminders-message">No guests currently need a reminder!</p>}
      </div>

      {/* Guest Card List */}
      <div className="reminder-guest-list">
        {guestsNeedingReminder.map(guest => {
            // Determine loading state for this specific card
            const isLoadingThisCard = loadingStates[guest.id] || loadingStates['all'];
            const emailContent = generatedEmails[guest.id];
            const hasError = emailContent === "Error";

            return (
            <div key={guest.id} className={`reminder-guest-card ${hasError ? 'has-error' : ''}`}>
                <div className="card-header">
                  <User size={20} />
                  <h3>{guest.name}</h3>
                  <span>({guest.email})</span>
                </div>

                <div className="card-body">
                  <div className="additional-facts">
                      <label htmlFor={`facts-${guest.id}`}>Optional personal notes/facts:</label>
                      <textarea
                      id={`facts-${guest.id}`}
                      value={additionalFacts[guest.id] || ''}
                      onChange={(e) => handleFactChange(guest.id, e.target.value)}
                      placeholder={`e.g., "Can't wait to catch up!"`}
                      rows={2}
                      disabled={isLoadingThisCard} // Disable based on card-specific loading
                      />
                  </div>

                  <div className="generated-email-section">
                      {/* Show Generate button if no content and not loading */}
                      {!emailContent && !isLoadingThisCard && (
                        <button
                            onClick={() => handleGenerate(guest)} // Generate for single guest
                            disabled={!isWeddingDateSet} // Disable if wedding date isn't set
                            className="action-button secondary-button generate-single-button"
                            title={!isWeddingDateSet ? "Set Wedding Date first" : ""}
                        >
                          <Mail size={14}/> Generate Reminder
                        </button>
                      )}

                      {/* Show Loading indicator if loading this specific card */}
                      {isLoadingThisCard && !emailContent && (
                          <div className="loading-indicator"><Loader size={16} className="spinner" /> Generating...</div>
                      )}

                      {/* Show Error message */}
                      {hasError && (
                           <p className="reminder-error-text">Could not generate reminder.</p>
                      )}

                      {/* Show Generated Email and Send button */}
                      {emailContent && !hasError && (
                      <>
                          <label htmlFor={`email-${guest.id}`}>Generated Email:</label>
                          <textarea
                              id={`email-${guest.id}`}
                              value={emailContent}
                              readOnly
                              rows={8}
                              className="generated-email-display"
                          />
                          <a
                            href={createMailtoLink(guest, emailContent)}
                            className="action-button primary-button send-email-button"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                          <Send size={16} /> Send via Email Client
                          </a>
                      </>
                      )}
                  </div>
                </div>
            </div>
            );
         })}
      </div>

      {/* Footer */}
      <footer className="app-footer reminder-footer">
         <div className="footer-content">
            <div className="footer-logo">
                <h3>Aisle Be There</h3>
                <p>Reminders made easy</p>
            </div>
            <div className="footer-attribution">
                <p>© {new Date().getFullYear()} Wedding Planner App</p>
            </div>
        </div>
      </footer>
    </div>
  );
}

export default ReminderEmailsPage;