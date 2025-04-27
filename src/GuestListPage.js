// src/GuestListPage.js - COMPLETE FILE V5 (Restored from User Ref - Uses Date Props, Fixed Day Disable)
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle, Check, X, Users, UserCheck, UserMinus,
  UserPlus, Save, Upload, Download, FileText, Circle, Mail,
  HelpCircle, Loader, CalendarDays, Edit3 // Ensure all needed icons are imported
} from 'lucide-react';
import './WeddingPlannerApp.css'; // Use shared CSS file
import { generateTemplateCSV, generateTemplatePDF } from './TemplatePDFGenerator';

// --- Algorithms ---
// Algorithm for suggesting whether to invite a guest (Dependency check removed)
const generateSuggestion = (guest, allGuests) => {
  // Ensure guest is defined and has expected properties before calculating
  if (!guest || typeof guest.joyFactor === 'undefined') {
      return "Cannot Suggest"; // Or some default/error indication
  }
  let points = 0;
  if (guest.joyFactor === "Lots of joy") points += 3;
  else if (guest.joyFactor === "Some joy") points += 2;

  if (guest.relationshipCloseness === "Immediate family" || guest.relationshipCloseness === "Best friend") points += 3;
  else if (guest.relationshipCloseness === "Close friend" || guest.relationshipCloseness === "Extended family") points += 2;
  else if (["Friend", "Friend from college", "Friend of partner", "Coworker"].includes(guest.relationshipCloseness)) points += 1;

  if (guest.futureRelationshipPotential === "Want to maintain") points += 2;
  else if (guest.futureRelationshipPotential === "Likely to maintain") points += 1;

  if (guest.obligationLevel === "No obligations") points += 1;
  else if (guest.obligationLevel && guest.obligationLevel.includes("Obligated")) points -= 1; // Check if obligationLevel exists

  // Dependency check removed
  if (points >= 5) return "Strongly recommend inviting";
  else if (points >= 3) return "Consider inviting";
  else return "May want to reconsider";
};


// Function to parse CSV file (Dependencies field removed)
const parseCSV = (content) => {
  const lines = content.split(/\r?\n/);
  if (lines.length <= 1) throw new Error("CSV file is empty or has only headers");
  const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
  const nameIndex = headers.findIndex(h => h === 'name');
  const emailIndex = headers.findIndex(h => h === 'email');
  const phoneIndex = headers.findIndex(h => h === 'phone');
  const addressIndex = headers.findIndex(h => h === 'address');
  if (nameIndex === -1 || emailIndex === -1 || phoneIndex === -1 || addressIndex === -1) {
    throw new Error("CSV must contain 'name', 'email', 'phone', and 'address' columns");
  }
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    const guest = {
      id: Date.now() + i,
      name: values[nameIndex]?.trim().replace(/^"|"$/g, '') || '',
      email: values[emailIndex]?.trim().replace(/^"|"$/g, '') || '',
      phone: values[phoneIndex]?.trim().replace(/^"|"$/g, '') || '',
      address: values[addressIndex]?.trim().replace(/^"|"$/g, '') || '',
      joyFactor: "Some joy", relationshipCloseness: "Friend", futureRelationshipPotential: "Uncertain",
      obligationLevel: "No obligations", inviteDecision: "Consider inviting", inviteSent: "Not sent",
      rsvpStatus: "Pending"
    };
    if (guest.name && guest.email) results.push(guest);
  }
  return results;
};


// Component receives date state and setters via props
function GuestListPage({
    guests, setGuests, // Guest state/setter
    // Date state/setters from App.js
    weddingMonth, setWeddingMonth,
    weddingDay, setWeddingDay,
    weddingYear, setWeddingYear,
    countdownDays, formattedWeddingDate,
    isSettingDate, setIsSettingDate,
    // Helper function passed down
    getDaysInMonth
}) {
  // --- Local States (Non-Date Related) ---
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [inviteeLimit, setInviteeLimit] = useState(100);
  const [editingGuest, setEditingGuest] = useState(null); // Stores the guest object being edited (without dependencies)
  const [newGuest, setNewGuest] = useState({ // Dependencies removed
    name: "", email: "", phone: "", address: "", joyFactor: "Some joy", relationshipCloseness: "Friend",
    futureRelationshipPotential: "Uncertain", obligationLevel: "No obligations", inviteDecision: "Consider inviting",
    inviteSent: "Not sent", rsvpStatus: "Pending"
  });
  const [csvError, setCsvError] = useState("");
  const fileInputRef = useRef(null);
  // REMOVED: searchTerms, showDropdowns state
  const [uploadState, setUploadState] = useState('idle'); // 'idle', 'processing', 'success', 'error'
  const [newlyAddedGuestIds, setNewlyAddedGuestIds] = useState([]);
  const [uploadMessage, setUploadMessage] = useState('');
  // REMOVED: Local date state and calculation effect

  // --- Effect for highlight fade ---
  useEffect(() => {
    if (newlyAddedGuestIds.length > 0) {
      const timer = setTimeout(() => {
        setNewlyAddedGuestIds([]);
      }, 5500); // 5s animation + buffer
      return () => clearTimeout(timer);
    }
  }, [newlyAddedGuestIds]);


  // --- Calculations ---
  const metrics = useMemo(() => {
    const definitelyInvitingList = guests.filter(g => g.inviteDecision === "Definitely inviting");
    const invitesSentList = guests.filter(g => g.inviteSent === "Sent");
    return {
      totalGuests: guests.length,
      definitelyInviting: definitelyInvitingList.length,
      maybeInviting: guests.filter(g => g.inviteDecision === "Consider inviting").length,
      notInviting: guests.filter(g => g.inviteDecision === "Definitely not inviting").length,
      invitesSent: invitesSentList.length,
      rsvpsConfirmed: invitesSentList.filter(g => g.rsvpStatus === "Confirmed").length,
      rsvpsDeclined: invitesSentList.filter(g => g.rsvpStatus === "Declined").length,
      rsvpsPending: invitesSentList.filter(g => g.rsvpStatus === "Pending").length,
    };
  }, [guests]);

  // --- Event Handlers ---
  const handleAddGuest = () => {
    if (newGuest.name && newGuest.email) {
      const guestWithId = { ...newGuest, id: Math.max(0, ...guests.map(g => g.id)) + 1 };
      setGuests(prevGuests => [...prevGuests, guestWithId]);
      setNewGuest({ name: "", email: "", phone: "", address: "", joyFactor: "Some joy", relationshipCloseness: "Friend", futureRelationshipPotential: "Uncertain", obligationLevel: "No obligations", inviteDecision: "Consider inviting", inviteSent: "Not sent", rsvpStatus: "Pending" });
      setIsAddingGuest(false);
    }
  };

  const handleGuestUpdate = (id, updates) => {
    const { dependencies, ...restUpdates } = updates; // Ensure dependencies isn't passed
    setGuests(prevGuests => prevGuests.map(guest =>
      guest.id === id ? { ...guest, ...restUpdates } : guest
    ));
  };

  const handleStatusChange = (id, value) => handleGuestUpdate(id, { inviteDecision: value });
  const handleInviteSentChange = (id) => {
      const guest = guests.find(g => g.id === id);
      if (!guest) return;
      const newSentStatus = guest.inviteSent === "Sent" ? "Not sent" : "Sent";
      handleGuestUpdate(id, {
          inviteSent: newSentStatus,
          rsvpStatus: newSentStatus === "Not sent" ? "Pending" : guest.rsvpStatus
      });
  };
  const handleRsvpStatusChange = (id, value) => handleGuestUpdate(id, { rsvpStatus: value });
  const handleCriteriaChange = (id, field, value) => handleGuestUpdate(id, { [field]: value });
  const startEditingGuest = (guest) => {
     const { dependencies, ...guestToEdit } = guest; // Exclude dependencies if present
     setEditingGuest({ ...guestToEdit }); // Store the editing guest object locally
  };
  const saveEditedGuest = () => {
    if (editingGuest && editingGuest.name && editingGuest.email) {
      handleGuestUpdate(editingGuest.id, editingGuest); // Pass local editing state up
      setEditingGuest(null);
    }
  };
  const cancelEditing = () => setEditingGuest(null);
  const handleEditingKeyDown = (e) => {
    if (e.key === 'Enter' && editingGuest) saveEditedGuest();
    else if (e.key === 'Escape') cancelEditing();
  };

  const downloadTemplateCSV = () => generateTemplateCSV();
  const downloadTemplatePDF = () => generateTemplatePDF();
  const toggleRsvpStatus = (id, currentStatus) => {
    const guest = guests.find(g => g.id === id);
    if (guest && guest.inviteSent === "Sent") {
      const newStatus = currentStatus === "Pending" ? "Confirmed" : currentStatus === "Confirmed" ? "Declined" : "Pending";
      handleRsvpStatusChange(id, newStatus);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setCsvError("");
    setUploadState('processing');
    setUploadMessage('Reading file...');
    setTimeout(() => {
        if (!file.name.endsWith('.csv')) {
            setCsvError("Please upload a CSV file"); setUploadState('error');
            setUploadMessage('Invalid file type!'); setTimeout(() => setUploadState('idle'), 2000);
            if (fileInputRef.current) fileInputRef.current.value = ""; return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                setUploadMessage('Parsing data...');
                const content = e.target.result;
                const parsedGuests = parseCSV(content);
                if (parsedGuests.length === 0) {
                    setCsvError("No valid guests found in the CSV"); setUploadState('error');
                    setUploadMessage('No guests found!'); setTimeout(() => setUploadState('idle'), 2000);
                    if (fileInputRef.current) fileInputRef.current.value = ""; return;
                }
                setUploadMessage('Adding guests...');
                const maxId = Math.max(0, ...guests.map(g => g.id));
                const guestsWithIds = parsedGuests.map((guest, index) => ({ ...guest, id: maxId + index + 1, inviteSent: "Not sent", rsvpStatus: "Pending" }));
                const addedIds = guestsWithIds.map(g => g.id);
                setGuests(prevGuests => [...prevGuests, ...guestsWithIds]);
                setNewlyAddedGuestIds(addedIds);
                setUploadState('success');
                setUploadMessage('Upload successful!');
                setTimeout(() => { setUploadState('idle'); }, 750);
                if (fileInputRef.current) { fileInputRef.current.value = ""; }
            } catch (error) {
                console.error("Error processing CSV:", error); setCsvError(error.message || "Failed to parse CSV file");
                setUploadState('error'); setUploadMessage('Parsing failed!'); setTimeout(() => setUploadState('idle'), 2000);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.onerror = () => {
            setCsvError("Error reading the file"); setUploadState('error');
            setUploadMessage('File read error!'); setTimeout(() => setUploadState('idle'), 2000);
            if (fileInputRef.current) fileInputRef.current.value = "";
        };
        reader.readAsText(file);
    }, 50);
  };

  // --- Date Handlers (Use props setters) ---
  const handleMonthChange = (e) => setWeddingMonth(e.target.value);
  const handleDayChange = (e) => setWeddingDay(e.target.value);
  const handleYearChange = (e) => setWeddingYear(e.target.value);
  const handleEditDate = () => setIsSettingDate(true);

  // --- Dropdown Options ---
  const monthOptions = useMemo(() => [ { value: '', label: 'Month' }, ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(0, i).toLocaleString('en-US', { month: 'long' }) })) ], []);
  const yearOptions = useMemo(() => { const currentYear = new Date().getFullYear(); return [ { value: '', label: 'Year' }, ...Array.from({ length: 10 }, (_, i) => ({ value: String(currentYear + i), label: String(currentYear + i) })) ]; }, []);
  const dayOptions = useMemo(() => {
      const monthNum = parseInt(weddingMonth, 10);
      const yearNum = parseInt(weddingYear, 10);
      // console.log(`[dayOptions useMemo] Month Prop: ${weddingMonth}, Year Prop: ${weddingYear}, Parsed Month: ${monthNum}, Parsed Year: ${yearNum}`);
      if (typeof getDaysInMonth !== 'function') { console.error("getDaysInMonth prop is not a function!"); return [{ value: '', label: 'Day' }]; }
      const daysInSelectedMonth = getDaysInMonth(monthNum, yearNum);
      // console.log(`[dayOptions useMemo] getDaysInMonth returned: ${daysInSelectedMonth}`);
      const options = [ { value: '', label: 'Day' }, ...Array.from({ length: daysInSelectedMonth || 0 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })) ];
      // console.log(`[dayOptions useMemo] Generated options array:`, options);
      return options;
  }, [weddingMonth, weddingYear, getDaysInMonth]); // Depend on props


  // --- Render Functions (Defined Inside Component) ---
  const renderInviteDecision = (decision, id, isEditMode = false) => {
     const currentValue = isEditMode && editingGuest?.id === id ? editingGuest.inviteDecision : decision;
     if (isEditMode && editingGuest?.id === id) {
       return ( <select className="status-select" value={currentValue} onChange={(e) => setEditingGuest({...editingGuest, inviteDecision: e.target.value})} onKeyDown={handleEditingKeyDown}> <option value="Definitely inviting">Definitely inviting</option><option value="Consider inviting">Consider inviting</option><option value="Definitely not inviting">Definitely not inviting</option> </select> );
     }
     const statusMap = { "Definitely inviting": { icon: Check, className: "status-yes", next: "Consider inviting", title: "Definitely inviting" }, "Consider inviting": { icon: HelpCircle, className: "status-maybe", next: "Definitely not inviting", title: "Consider inviting" }, "Definitely not inviting": { icon: X, className: "status-no", next: "Definitely inviting", title: "Definitely not inviting" } };
     const current = statusMap[decision] || statusMap["Consider inviting"]; const Icon = current.icon;
     return ( <button className={`status-icon ${current.className}`} onClick={(e) => { e.stopPropagation(); handleStatusChange(id, current.next); }} title={current.title}> <Icon size={18} /> </button> );
  };

  const renderInviteSentToggle = (status, id, isEditMode = false) => {
      const currentValue = isEditMode && editingGuest?.id === id ? editingGuest.inviteSent : status;
      if (isEditMode && editingGuest?.id === id) {
        return ( <select className="status-select" value={currentValue} onChange={(e) => setEditingGuest({...editingGuest, inviteSent: e.target.value, rsvpStatus: e.target.value === "Not sent" ? "Pending" : editingGuest.rsvpStatus})} onKeyDown={handleEditingKeyDown}> <option value="Sent">Sent</option><option value="Not sent">Not sent</option> </select> );
      }
      return ( <button className={`toggle-button ${status === "Sent" ? "sent" : "not-sent"}`} onClick={(e) => { e.stopPropagation(); handleInviteSentChange(id); }} title={status === "Sent" ? "Invite Sent" : "Invite Not Sent"}> <span className="toggle-icon">{status === "Sent" && <Check size={14} />}</span> {status === "Sent" ? "Sent" : "Not sent"} </button> );
  };

   const renderRsvpStatus = (status, inviteSent, id, isEditMode = false) => {
     const currentValue = isEditMode && editingGuest?.id === id ? editingGuest.rsvpStatus : status;
     const currentInviteSent = isEditMode && editingGuest?.id === id ? editingGuest.inviteSent : inviteSent;
     if (isEditMode && editingGuest?.id === id) {
        return ( <select className="status-select" value={currentValue} onChange={(e) => setEditingGuest({...editingGuest, rsvpStatus: e.target.value})} disabled={currentInviteSent !== "Sent"} onKeyDown={handleEditingKeyDown}> <option value="Pending">Pending</option><option value="Confirmed">Confirmed</option><option value="Declined">Declined</option> </select> );
     }
     if (currentInviteSent !== "Sent") { return <div className="rsvp-status-icon rsvp-not-invited" title="Invite not sent"><Circle size={18} /></div>; }
     const statusMap = { "Pending": { icon: Mail, className: "rsvp-pending", title: "RSVP Pending" }, "Confirmed": { icon: Check, className: "rsvp-confirmed", title: "RSVP Confirmed" }, "Declined": { icon: X, className: "rsvp-declined", title: "RSVP Declined" }, };
     const current = statusMap[status] || statusMap["Pending"]; const Icon = current.icon;
     return ( <button className={`rsvp-status-icon ${current.className}`} onClick={(e) => { e.stopPropagation(); toggleRsvpStatus(id, status); }} title={current.title}> <Icon size={18} /> </button> );
 };


  // Filtered guests
  const filteredGuests = useMemo(() => {
    if (activeFilter === 'all') return guests;
    return guests.filter(guest => guest.inviteDecision === activeFilter);
  }, [guests, activeFilter]);

  // --- JSX Return (Ensure full structure) ---
  return (
    <div className="page-container guest-list-page-container">
      <div className="app-header">
        <h1 className="app-title">Aisle Be There</h1>
        <h2 className="app-subtitle">Your Personal Wedding Planning Assistant</h2>
      </div>

      {/* Dashboard Section */}
      <section className="dashboard">
          <div className={`dashboard-card dashboard-total ${activeFilter === 'all' ? 'dashboard-active' : ''}`} onClick={() => setActiveFilter('all')}> <div className="dashboard-icon"><Users size={24} /></div> <div> <p className="dashboard-label">Total Guests</p> <p className="dashboard-value">{metrics.totalGuests}</p> </div> </div>
          <div className={`dashboard-card dashboard-yes ${activeFilter === 'Definitely inviting' ? 'dashboard-active' : ''}`} onClick={() => setActiveFilter('Definitely inviting')}> <div className="dashboard-icon"><UserCheck size={24} /></div> <div> <p className="dashboard-label">Definitely Inviting</p> <p className="dashboard-value">{metrics.definitelyInviting}</p> </div> </div>
          <div className={`dashboard-card dashboard-maybe ${activeFilter === 'Consider inviting' ? 'dashboard-active' : ''}`} onClick={() => setActiveFilter('Consider inviting')}> <div className="dashboard-icon"><UserPlus size={24} /></div> <div> <p className="dashboard-label">Considering</p> <p className="dashboard-value">{metrics.maybeInviting}</p> </div> </div>
          <div className={`dashboard-card dashboard-no ${activeFilter === 'Definitely not inviting' ? 'dashboard-active' : ''}`} onClick={() => setActiveFilter('Definitely not inviting')}> <div className="dashboard-icon"><UserMinus size={24} /></div> <div> <p className="dashboard-label">Not Inviting</p> <p className="dashboard-value">{metrics.notInviting}</p> </div> </div>
      </section>

      {/* Status Cards Section */}
      <section className="status-cards">
          {/* Guest Limit Card */}
          <div className="limit-card status-card-item">
              <h3 className="limit-title">Guest Limit</h3>
              <div className="limit-content"> <div className="limit-number-container"> <input type="number" className="limit-number" value={inviteeLimit} onChange={(e) => setInviteeLimit(Math.max(1, parseInt(e.target.value) || 0))} min="1"/> <span className="limit-label">guests allowed</span> </div> <div className="progress-container"> <div className={`progress-bar ${metrics.definitelyInviting <= inviteeLimit ? 'progress-good' : 'progress-over'}`} style={{ width: `${Math.min(100, (metrics.definitelyInviting / Math.max(1, inviteeLimit)) * 100)}%` }}></div> </div> <div className="limit-info"> <div className="limit-stat"><span className="stat-value">{metrics.definitelyInviting}</span> invited</div> <div className="limit-stat"><span className="stat-value">{Math.max(0, inviteeLimit - metrics.definitelyInviting)}</span> spots left</div> </div> {metrics.definitelyInviting > inviteeLimit && ( <div className="limit-warning">Over limit by {metrics.definitelyInviting - inviteeLimit}!</div> )} </div>
          </div>
          {/* Wedding Date Card */}
          <div className="wedding-date-card status-card-item">
              <h3 className="wedding-date-title"> <CalendarDays size={18} /> Wedding Countdown </h3>
              <div className="wedding-date-content">
                   {isSettingDate || !formattedWeddingDate || formattedWeddingDate === "Invalid Date" ? (
                      <div className="date-input-view">
                          <p>Select your wedding date:</p>
                          <div className="date-dropdown-container">
                              <select className="date-select" value={weddingMonth} onChange={handleMonthChange}> {monthOptions.map(opt => <option key={opt.value || 'month-placeholder'} value={opt.value}>{opt.label}</option>)} </select>
                              <select className="date-select" value={weddingDay} onChange={handleDayChange} disabled={!weddingMonth}>
                                  {/* Ensure dayOptions is an array before mapping */}
                                  {Array.isArray(dayOptions) && dayOptions.map(opt => <option key={opt.value || 'day-placeholder'} value={opt.value}>{opt.label}</option>)}
                              </select>
                              <select className="date-select" value={weddingYear} onChange={handleYearChange}> {yearOptions.map(opt => <option key={opt.value || 'year-placeholder'} value={opt.value}>{opt.label}</option>)} </select>
                          </div>
                           {formattedWeddingDate === "Invalid Date" && <p className="date-error">Please select a valid date.</p>}
                      </div>
                  ) : (
                      <div className="countdown-display-view">
                           {countdownDays !== null && countdownDays !== "Passed!" ? ( <> <div className="countdown-days">{countdownDays}</div> <div className="countdown-label">days until your big day!</div> </> )
                           : ( <div className="countdown-days passed">Passed!</div> )}
                           <div className="countdown-date">{formattedWeddingDate}</div>
                           <button onClick={handleEditDate} className="edit-date-button"> <Edit3 size={14}/> Change Date </button>
                      </div>
                  )}
              </div>
          </div>
          {/* Invites Sent Card */}
          <div className="invites-sent-card status-card-item">
               <h3 className="invites-title">Invitations & RSVP</h3>
               <div className="invites-content"> <div className="invites-number"> {metrics.invitesSent} <span className="invites-label">of {metrics.definitelyInviting} invites sent</span> </div> <div className="invites-progress-container"> <div className="invites-progress-bar" style={{ width: `${metrics.definitelyInviting > 0 ? (metrics.invitesSent / metrics.definitelyInviting) * 100 : 0}%` }}></div> </div> <div className="rsvp-stats"> <div className="rsvp-stat"><div className="rsvp-icon-indicator rsvp-confirmed"></div><span className="rsvp-count">{metrics.rsvpsConfirmed}</span> confirmed</div> <div className="rsvp-stat"><div className="rsvp-icon-indicator rsvp-declined"></div><span className="rsvp-count">{metrics.rsvpsDeclined}</span> declined</div> <div className="rsvp-stat"><div className="rsvp-icon-indicator rsvp-pending"></div><span className="rsvp-count">{metrics.rsvpsPending}</span> pending</div> </div> {metrics.definitelyInviting > 0 && metrics.invitesSent < metrics.definitelyInviting && ( <div className="invites-remaining">{metrics.definitelyInviting - metrics.invitesSent} invitations left to send</div> )} {metrics.rsvpsPending > 0 && ( <Link to="/reminders" className="action-button secondary-button send-reminder-link"> <Mail size={16} /> Send RSVP Reminders </Link> )} </div>
           </div>
      </section>

      {/* Guest List Section Header */}
      <header className="guest-list-header">
        <h3 className="guest-list-title">Guest List</h3>
        {activeFilter !== 'all' && ( <span className="filter-indicator"> Filtered by: {activeFilter.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} <button onClick={() => setActiveFilter('all')} className="clear-filter-inline" title="Clear Filter">×</button> </span> )}
        <div className="guest-list-actions">
          <div className="template-buttons"> <button onClick={downloadTemplateCSV} className="action-button secondary-button" title="Download CSV template"><Download size={16} /> CSV</button> <button onClick={downloadTemplatePDF} className="action-button secondary-button" title="Download PDF template"><FileText size={16} /> PDF</button> </div>
          <div className="csv-upload-container"> <input type="file" accept=".csv" onChange={handleFileUpload} ref={fileInputRef} id="csv-upload" style={{ display: 'none' }} disabled={uploadState === 'processing'} /> <label htmlFor="csv-upload" className={`action-button secondary-button ${uploadState === 'processing' ? 'disabled' : ''}`}> {uploadState === 'processing' ? <Loader size={16} className='spinner-inline'/> : <Upload size={16} />} Upload </label> {csvError && <div className="csv-error-tooltip">{csvError}</div>} </div>
          {!isAddingGuest && ( <button onClick={() => setIsAddingGuest(true)} className="action-button primary-button add-guest-button" disabled={uploadState === 'processing'}> <PlusCircle size={16} /> Add Guest </button> )}
        </div>
      </header>

      {/* Guest List Table Area with Overlay */}
      <div className="guest-table-area-wrapper">
        {(uploadState === 'processing' || uploadState === 'success' || uploadState === 'error') && (
          <div className={`upload-status-overlay ${uploadState}`} aria-live="polite">
            <div className="upload-status-content">
              {uploadState === 'processing' && <Loader size={32} className="spinner" />}
              {uploadState === 'success' && <Check size={32} />}
              {uploadState === 'error' && <X size={32} />}
              <p>{uploadMessage}</p>
            </div>
          </div>
        )}
        <div className={`guest-table-container ${uploadState === 'processing' ? 'processing-table' : ''}`}>
          <table className="guest-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Phone</th><th>Address</th>
                <th>Joy</th><th>Relationship</th><th>Future Relationship</th><th>Obligation</th>
                <th>Suggestion</th><th>Invite Decision</th><th>Sent?</th><th>RSVP</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Add Guest Row */}
              {isAddingGuest && (
                 <tr className="add-guest-row">
                    <td><input type="text" value={newGuest.name} onChange={(e) => setNewGuest({...newGuest, name: e.target.value})} placeholder="Name" className="guest-input"/></td>
                    <td><input type="email" value={newGuest.email} onChange={(e) => setNewGuest({...newGuest, email: e.target.value})} placeholder="Email" className="guest-input"/></td>
                    <td><input type="tel" value={newGuest.phone} onChange={(e) => setNewGuest({...newGuest, phone: e.target.value})} placeholder="Phone" className="guest-input"/></td>
                    <td><input type="text" value={newGuest.address} onChange={(e) => setNewGuest({...newGuest, address: e.target.value})} placeholder="Address" className="guest-input"/></td>
                    <td> <select value={newGuest.joyFactor} onChange={(e) => setNewGuest({...newGuest, joyFactor: e.target.value})} className="guest-select"> <option>Lots of joy</option><option>Some joy</option><option>I just feel obligated</option> </select> </td>
                    <td> <select value={newGuest.relationshipCloseness} onChange={(e) => setNewGuest({...newGuest, relationshipCloseness: e.target.value})} className="guest-select"> <option>Immediate family</option><option>Extended family</option><option>Best friend</option><option>Close friend</option> <option>Friend</option><option>Friend of partner</option><option>Coworker</option><option>Distant relative</option> </select> </td>
                    <td> <select value={newGuest.futureRelationshipPotential} onChange={(e) => setNewGuest({...newGuest, futureRelationshipPotential: e.target.value})} className="guest-select"> <option>Want to maintain</option><option>Likely to maintain</option><option>Uncertain</option><option>Unlikely to maintain</option> </select> </td>
                    <td> <select value={newGuest.obligationLevel} onChange={(e) => setNewGuest({...newGuest, obligationLevel: e.target.value})} className="guest-select"> <option>No obligations</option><option>Obligated if inviting family</option><option>Obligated if inviting friends</option> <option>Obligated if inviting coworkers</option><option>Other obligation</option> </select> </td>
                    <td className="suggestion">{generateSuggestion(newGuest, guests)}</td>
                    <td> <select className="status-select" value={newGuest.inviteDecision} onChange={(e)=> setNewGuest({...newGuest, inviteDecision: e.target.value})}> <option>Consider inviting</option><option>Definitely inviting</option><option>Definitely not inviting</option> </select> </td>
                    <td> <select className="status-select" value={newGuest.inviteSent} onChange={(e)=> setNewGuest({...newGuest, inviteSent: e.target.value})}> <option>Not sent</option><option>Sent</option></select></td>
                    <td> <select className="status-select" value={newGuest.rsvpStatus} disabled> <option>Pending</option> </select> </td>
                    <td> <div className="action-buttons"> <button onClick={handleAddGuest} className="confirm-button" disabled={!newGuest.name || !newGuest.email} title="Save Guest"><Check size={16} /></button> <button onClick={() => setIsAddingGuest(false)} className="cancel-button" title="Cancel Add"><X size={16} /></button> </div> </td>
                  </tr>
              )}
              {/* Guest Rows */}
              {filteredGuests.map((guest) => {
                const isNewlyAdded = newlyAddedGuestIds.includes(guest.id);
                const { dependencies, ...guestData } = guest;
                return (
                  <tr key={guestData.id} className={`guest-row ${editingGuest?.id === guestData.id ? "editing" : "clickable-row"} ${isNewlyAdded ? 'newly-added' : ''}`} onClick={() => !(editingGuest || isAddingGuest) && startEditingGuest(guestData)}>
                    {editingGuest?.id === guestData.id ? (
                      // Edit Mode
                      <>
                        <td><input type="text" value={editingGuest.name || ''} onChange={(e) => setEditingGuest({...editingGuest, name: e.target.value})} className="guest-input" onKeyDown={handleEditingKeyDown}/></td>
                        <td><input type="email" value={editingGuest.email || ''} onChange={(e) => setEditingGuest({...editingGuest, email: e.target.value})} className="guest-input" onKeyDown={handleEditingKeyDown}/></td>
                        <td><input type="tel" value={editingGuest.phone || ''} onChange={(e) => setEditingGuest({...editingGuest, phone: e.target.value})} className="guest-input" onKeyDown={handleEditingKeyDown}/></td>
                        <td><input type="text" value={editingGuest.address || ''} onChange={(e) => setEditingGuest({...editingGuest, address: e.target.value})} className="guest-input" onKeyDown={handleEditingKeyDown}/></td>
                        <td> <select value={editingGuest.joyFactor || 'Some joy'} onChange={(e) => setEditingGuest({...editingGuest, joyFactor: e.target.value})} className="guest-select" onKeyDown={handleEditingKeyDown}> <option>Lots of joy</option><option>Some joy</option><option>I just feel obligated</option> </select> </td>
                        <td> <select value={editingGuest.relationshipCloseness || 'Friend'} onChange={(e) => setEditingGuest({...editingGuest, relationshipCloseness: e.target.value})} className="guest-select" onKeyDown={handleEditingKeyDown}> <option>Immediate family</option><option>Extended family</option><option>Best friend</option><option>Close friend</option> <option>Friend</option><option>Friend of partner</option><option>Coworker</option><option>Distant relative</option> </select> </td>
                        <td> <select value={editingGuest.futureRelationshipPotential || 'Uncertain'} onChange={(e) => setEditingGuest({...editingGuest, futureRelationshipPotential: e.target.value})} className="guest-select" onKeyDown={handleEditingKeyDown}> <option>Want to maintain</option><option>Likely to maintain</option><option>Uncertain</option><option>Unlikely to maintain</option> </select> </td>
                        <td> <select value={editingGuest.obligationLevel || 'No obligations'} onChange={(e) => setEditingGuest({...editingGuest, obligationLevel: e.target.value})} className="guest-select" onKeyDown={handleEditingKeyDown}> <option>No obligations</option><option>Obligated if inviting family</option><option>Obligated if inviting friends</option> <option>Obligated if inviting coworkers</option><option>Other obligation</option> </select> </td>
                        <td className="suggestion">{generateSuggestion(editingGuest, guests)}</td>
                        <td><div className="status-selector">{renderInviteDecision(editingGuest.inviteDecision, editingGuest.id, true)}</div></td>
                        <td><div className="invite-sent-toggle">{renderInviteSentToggle(editingGuest.inviteSent, editingGuest.id, true)}</div></td>
                        <td><div className="rsvp-status-toggle">{renderRsvpStatus(editingGuest.rsvpStatus, editingGuest.inviteSent, editingGuest.id, true)}</div></td>
                        <td> <div className="action-buttons"> <button onClick={saveEditedGuest} className="confirm-button" disabled={!editingGuest.name || !editingGuest.email} title="Save Changes"><Save size={16} /></button> <button onClick={cancelEditing} className="cancel-button" title="Cancel Edit"><X size={16} /></button> </div> </td>
                      </>
                    ) : (
                      // View Mode
                      <>
                        <td>{guestData.name}</td>
                        <td>{guestData.email}</td>
                        <td>{guestData.phone}</td>
                        <td>{guestData.address}</td>
                        <td> <select value={guestData.joyFactor} onChange={(e) => handleCriteriaChange(guestData.id, 'joyFactor', e.target.value)} className="guest-select view-mode-select" onClick={(e) => e.stopPropagation()}> <option>Lots of joy</option><option>Some joy</option><option>I just feel obligated</option> </select> </td>
                        <td> <select value={guestData.relationshipCloseness} onChange={(e) => handleCriteriaChange(guestData.id, 'relationshipCloseness', e.target.value)} className="guest-select view-mode-select" onClick={(e) => e.stopPropagation()}> <option>Immediate family</option><option>Extended family</option><option>Best friend</option><option>Close friend</option> <option>Friend</option><option>Friend of partner</option><option>Coworker</option><option>Distant relative</option> </select> </td>
                        <td> <select value={guestData.futureRelationshipPotential} onChange={(e) => handleCriteriaChange(guestData.id, 'futureRelationshipPotential', e.target.value)} className="guest-select view-mode-select" onClick={(e) => e.stopPropagation()}> <option>Want to maintain</option><option>Likely to maintain</option><option>Uncertain</option><option>Unlikely to maintain</option> </select> </td>
                        <td> <select value={guestData.obligationLevel} onChange={(e) => handleCriteriaChange(guestData.id, 'obligationLevel', e.target.value)} className="guest-select view-mode-select" onClick={(e) => e.stopPropagation()}> <option>No obligations</option><option>Obligated if inviting family</option><option>Obligated if inviting friends</option> <option>Obligated if inviting coworkers</option><option>Other obligation</option> </select> </td>
                        <td className={`suggestion ${ generateSuggestion(guestData, guests).includes("Strongly") ? "suggestion-yes" : generateSuggestion(guestData, guests).includes("Consider") ? "suggestion-maybe" : "suggestion-no" }`}> {generateSuggestion(guestData, guests)} </td>
                        {/* Call render functions correctly for view mode */}
                        <td><div className="status-selector">{renderInviteDecision(guestData.inviteDecision, guestData.id)}</div></td>
                        <td><div className="invite-sent-toggle">{renderInviteSentToggle(guestData.inviteSent, guestData.id)}</div></td>
                        <td><div className="rsvp-status-toggle">{renderRsvpStatus(guestData.rsvpStatus, guestData.inviteSent, guestData.id)}</div></td>
                        <td>{/* Empty cell for alignment */}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredGuests.length === 0 && !isAddingGuest && (
             <p className="no-guests-message">
                {activeFilter === 'all' ? "No guests added yet. Click 'Add Guest' to start!" : `No guests match the filter "${activeFilter.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}"`}
             </p>
           )}
        </div>
      </div>

      {/* Footer Section */}
      <footer className="app-footer">
          <div className="footer-content">
              <div className="footer-logo"> <h3>Aisle Be There</h3> <p>Making wedding planning joyful</p> </div>
              <div className="footer-links"> <Link to="/reminders" className="footer-link"> <Mail size={14} /> Create Reminder Emails </Link> </div>
              <div className="footer-attribution"> <p>© {new Date().getFullYear()} Wedding Planner App</p> </div>
          </div>
      </footer>
    </div> // End page container
  ); // End component return
} // End of GuestListPage Component

export default GuestListPage;