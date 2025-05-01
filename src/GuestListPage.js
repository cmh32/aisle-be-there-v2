// src/GuestListPage.js - FINAL COMPLETE Code - Dropdowns Expanded, Partner Status Removed
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle, Check, X, Users, UserCheck, UserMinus, ThumbsUp, ThumbsDown,
  AlertTriangle, Tooltip, UserPlus, Save, Upload, Download, FileText, Circle, Mail, Info,
  HelpCircle, Loader, CalendarDays, Edit3, Settings
} from 'lucide-react';
import './WeddingPlannerApp.css';
import { generateTemplateCSV, generateTemplatePDF } from './TemplatePDFGenerator';

// --- Original generateSuggestion ---
const generateSuggestion = (guest) => {
    if (!guest || typeof guest.joyFactor === 'undefined' || typeof guest.relationshipCloseness === 'undefined' || typeof guest.futureRelationshipPotential === 'undefined' || typeof guest.obligationLevel === 'undefined') { return "Cannot Suggest"; }
    let points = 0;
    if (guest.joyFactor === "Lots of joy") points += 3; else if (guest.joyFactor === "Some joy") points += 2;
    if (guest.relationshipCloseness === "Immediate family" || guest.relationshipCloseness === "Best friend") points += 3; else if (guest.relationshipCloseness === "Close friend" || guest.relationshipCloseness === "Extended family") points += 2; else if (["Friend", "Friend from college", "Friend of partner", "Coworker"].includes(guest.relationshipCloseness)) points += 1;
    if (guest.futureRelationshipPotential === "Want to maintain") points += 2; else if (guest.futureRelationshipPotential === "Likely to maintain") points += 1;
    if (guest.obligationLevel === "No obligations") points += 1; else if (guest.obligationLevel?.includes("Obligated")) points -= 1;
    if (points >= 5) return "Strongly recommend inviting"; else if (points >= 3) return "Consider inviting"; else return "May want to reconsider";
};

// --- Original parseCSV - REMOVED partner_status ---
const parseCSV = (content) => {
    const lines = content.split(/\r?\n/);
    if (lines.length <= 1) throw new Error("CSV file is empty or has only headers");
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const nameIndex = headers.indexOf('name');
    const emailIndex = headers.indexOf('email');
    const phoneIndex = headers.indexOf('phone');
    const addressIndex = headers.indexOf('address');
    if (nameIndex === -1 || emailIndex === -1) { throw new Error("CSV must contain at least 'name' and 'email' columns"); }
    const results = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
         const guest = {
             id: Date.now() + i, name: values[nameIndex] || '', email: values[emailIndex] || '',
             phone: values[phoneIndex] || '', address: values[addressIndex] || '',
             joyFactor: "Some joy", relationshipCloseness: "Friend", futureRelationshipPotential: "Uncertain",
             obligationLevel: "No obligations", inviteDecision: "Consider inviting", inviteSent: "Not sent", rsvpStatus: "Pending",
             // partner_status: 'Unknown', // REMOVED
             knows_many_others: true, is_out_of_town: false, is_wedding_party: false,
             is_serious_relationship: false
         };
         if(guest.name && guest.email) results.push(guest);
    }
    return results;
};


// --- COMPONENT DEFINITION ---
function GuestListPage({
    guests, setGuests,
    weddingMonth, setWeddingMonth, weddingDay, setWeddingDay, weddingYear, setWeddingYear,
    countdownDays, formattedWeddingDate,
    isSettingDate, setIsSettingDate,
    getDaysInMonth
}) {
    // --- Component States ---
    const [isAddingGuest, setIsAddingGuest] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [inviteeLimit, setInviteeLimit] = useState(100);
    const [editingGuest, setEditingGuest] = useState(null);
    const [csvError, setCsvError] = useState("");
    const fileInputRef = useRef(null);
    const [uploadState, setUploadState] = useState('idle');
    const [newlyAddedGuestIds, setNewlyAddedGuestIds] = useState([]);
    const [uploadMessage, setUploadMessage] = useState('');
    // State for guest fields in Add Form - REMOVED partner_status
    const initialNewGuestState = {
        name: "", email: "", phone: "", address: "", joyFactor: "Some joy", relationshipCloseness: "Friend",
        futureRelationshipPotential: "Uncertain", obligationLevel: "No obligations", inviteDecision: "Consider inviting",
        inviteSent: "Not sent", rsvpStatus: "Pending",
        // partner_status: 'Unknown', // REMOVED
        knows_many_others: true, is_out_of_town: false, is_wedding_party: false,
        is_serious_relationship: false
    };
    const [newGuest, setNewGuest] = useState(initialNewGuestState);
    // State for Plus One Recommender
    const [maxCourtesyPlusOnes, setMaxCourtesyPlusOnes] = useState(10);
    const [recommendations, setRecommendations] = useState([]);
    const [isLoadingRecs, setIsLoadingRecs] = useState(false);
    const [recsError, setRecsError] = useState('');
    const [showRecs, setShowRecs] = useState(false);

    // --- Effects ---
    useEffect(() => {
        if (newlyAddedGuestIds.length > 0) {
          const timer = setTimeout(() => setNewlyAddedGuestIds([]), 5500);
          return () => clearTimeout(timer);
        }
    }, [newlyAddedGuestIds]);

    // --- Calculations ---
    const metrics = useMemo(() => {
        const guestList = Array.isArray(guests) ? guests : [];
        const definitelyInvitingList = guestList.filter(g => g?.inviteDecision === "Definitely inviting");
        const invitesSentList = guestList.filter(g => g?.inviteSent === "Sent");
        return {
          totalGuests: guestList.length,
          definitelyInviting: definitelyInvitingList.length,
          maybeInviting: guestList.filter(g => g?.inviteDecision === "Consider inviting").length,
          notInviting: guestList.filter(g => g?.inviteDecision === "Definitely not inviting").length,
          invitesSent: invitesSentList.length,
          rsvpsConfirmed: invitesSentList.filter(g => g?.rsvpStatus === "Confirmed").length,
          rsvpsDeclined: invitesSentList.filter(g => g?.rsvpStatus === "Declined").length,
          rsvpsPending: invitesSentList.filter(g => g?.rsvpStatus === "Pending").length,
        };
    }, [guests]);

    // --- Event Handlers ---
    const handleInputChange = (e, isEditing = false) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        const targetStateSetter = isEditing ? setEditingGuest : setNewGuest;
        targetStateSetter(prev => ({ ...prev, [name]: val }));
    };

    const handleAddGuest = () => {
        if (newGuest.name && newGuest.email) {
          const guestToAdd = { ...newGuest, id: Math.max(0, ...(guests || []).map(g => g.id), 0) + 1 };
          setGuests(prevGuests => [...(prevGuests || []), guestToAdd]);
          setNewGuest(initialNewGuestState);
          setIsAddingGuest(false);
        } else { alert("Please provide at least Name and Email."); }
    };

     const startEditingGuest = (guest) => { setEditingGuest({ ...guest }); };
     const saveEditedGuest = () => {
         if (editingGuest && editingGuest.name && editingGuest.email) {
             setGuests(prevGuests => prevGuests.map(g => g.id === editingGuest.id ? { ...editingGuest } : g));
             setEditingGuest(null);
         } else { alert("Name and Email are required."); }
     };
    const cancelEditing = () => setEditingGuest(null);

    const handleEditingKeyDown = (e) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          if (editingGuest) { saveEditedGuest(); }
      } else if (e.key === 'Escape') { cancelEditing(); }
    };

    const handleCriteriaChange = (id, field, value) => setGuests(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
    const handleStatusChange = (id, value) => handleCriteriaChange(id, 'inviteDecision', value);
    const handleInviteSentChange = (id) => {
        setGuests(prev => prev.map(g => {
            if (g.id === id) {
                const newSentStatus = g.inviteSent === "Sent" ? "Not sent" : "Sent";
                return { ...g, inviteSent: newSentStatus, rsvpStatus: newSentStatus === "Not sent" ? "Pending" : g.rsvpStatus };
            } return g;
        }));
    };
    const handleRsvpStatusChange = (id, value) => handleCriteriaChange(id, 'rsvpStatus', value);
    const toggleRsvpStatus = (id, currentStatus) => {
        const guest = guests.find(g => g.id === id);
        if (guest && guest.inviteSent === "Sent") {
          const newStatus = currentStatus === "Pending" ? "Confirmed" : currentStatus === "Confirmed" ? "Declined" : "Pending";
          handleRsvpStatusChange(id, newStatus);
        }
    };
    const downloadTemplateCSV = () => generateTemplateCSV();
    const downloadTemplatePDF = () => generateTemplatePDF();

   const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setCsvError("");
        setUploadState('processing');
        setUploadMessage('Reading file...');

        if (!file.name.endsWith('.csv')) {
            setCsvError("Please upload a CSV file");
            setUploadState('error');
            setUploadMessage('Invalid file type!');
            setTimeout(() => setUploadState('idle'), 2000);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                setUploadMessage('Parsing data...');
                const content = e.target.result;
                const parsedGuests = parseCSV(content);

                if (parsedGuests.length === 0) {
                    setCsvError("No valid guests found in the CSV");
                    setUploadState('error');
                    setUploadMessage('No guests found!');
                    setTimeout(() => setUploadState('idle'), 2000);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    return;
                }

                setUploadMessage('Adding guests...');
                const maxId = Math.max(0, ...(guests || []).map(g => g.id), 0);
                const guestsWithIds = parsedGuests.map((guest, index) => ({ ...guest, id: maxId + index + 1 }));
                const addedIds = guestsWithIds.map(g => g.id);
                setGuests(prevGuests => [...(prevGuests || []), ...guestsWithIds]);
                setNewlyAddedGuestIds(addedIds);

                setUploadState('success');
                setUploadMessage(`Added ${parsedGuests.length} guests!`);
                setTimeout(() => setUploadState('idle'), 1500);
                if (fileInputRef.current) { fileInputRef.current.value = ""; }

            } catch (error) {
                console.error("Error processing CSV:", error);
                setCsvError(error.message || "Failed to process CSV file");
                setUploadState('error');
                setUploadMessage('Processing failed!');
                setTimeout(() => setUploadState('idle'), 2000);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.onerror = (error) => {
            console.error("FileReader onerror event:", error);
            setCsvError("Error reading the file");
            setUploadState('error');
            setUploadMessage('File read error!');
            setTimeout(() => setUploadState('idle'), 2000);
            if (fileInputRef.current) fileInputRef.current.value = "";
        };
        reader.readAsText(file);
    };

    // --- Date Handlers & Options ---
    const handleMonthChange = (e) => setWeddingMonth(e.target.value);
    const handleDayChange = (e) => setWeddingDay(e.target.value);
    const handleYearChange = (e) => setWeddingYear(e.target.value);
    const handleEditDate = () => setIsSettingDate(true);
    const monthOptions = useMemo(() => [ { value: '', label: 'Month' }, ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(0, i).toLocaleString('en-US', { month: 'long' }) })) ], []);
    const yearOptions = useMemo(() => { const currentYear = new Date().getFullYear(); return [ { value: '', label: 'Year' }, ...Array.from({ length: 10 }, (_, i) => ({ value: String(currentYear + i), label: String(currentYear + i) })) ]; }, []);
    const dayOptions = useMemo(() => {
        const monthNum = parseInt(weddingMonth, 10);
        const yearNum = parseInt(weddingYear, 10);
        if (typeof getDaysInMonth !== 'function') { console.error("getDaysInMonth prop is not a function!"); return [{ value: '', label: 'Day' }]; }
        const daysInSelectedMonth = getDaysInMonth(monthNum, yearNum);
        return [ { value: '', label: 'Day' }, ...Array.from({ length: daysInSelectedMonth || 0 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })) ];
    }, [weddingMonth, weddingYear, getDaysInMonth]);

    // --- Render Functions ---
    const renderInviteDecision = (decision, id, isEditMode = false) => {
        const currentValue = isEditMode && editingGuest?.id === id ? editingGuest.inviteDecision : decision;
        const options = ["Definitely inviting", "Consider inviting", "Definitely not inviting"];
        if (isEditMode && editingGuest?.id === id) {
          // NOTE: Removed onKeyDown here, moved to TR
          return ( <select name="inviteDecision" className="status-select" value={currentValue || "Consider inviting"} onChange={(e) => handleInputChange(e, true)} > {options.map(o => <option key={o} value={o}>{o}</option>)} </select> );
        }
        const statusMap = { "Definitely inviting": { icon: Check, className: "status-yes", next: "Consider inviting", title: "Definitely inviting" }, "Consider inviting": { icon: HelpCircle, className: "status-maybe", next: "Definitely not inviting", title: "Consider inviting" }, "Definitely not inviting": { icon: X, className: "status-no", next: "Definitely inviting", title: "Definitely not inviting" } };
        const current = statusMap[decision] || statusMap["Consider inviting"]; const Icon = current.icon;
        return ( <button className={`status-icon ${current.className}`} onClick={(e) => { e.stopPropagation(); handleStatusChange(id, current.next); }} title={current.title}> <Icon size={18} /> </button> );
    };
    const renderInviteSentToggle = (status, id, isEditMode = false) => {
        const currentValue = isEditMode && editingGuest?.id === id ? editingGuest.inviteSent : status;
        if (isEditMode && editingGuest?.id === id) {
            // NOTE: Removed onKeyDown here, moved to TR
            return ( <select name="inviteSent" className="status-select" value={currentValue || "Not sent"} onChange={(e) => handleInputChange(e, true)} > <option value="Sent">Sent</option><option value="Not sent">Not sent</option> </select> );
        }
        return ( <button className={`toggle-button ${status === "Sent" ? "sent" : "not-sent"}`} onClick={(e) => { e.stopPropagation(); handleInviteSentChange(id); }} title={status === "Sent" ? "Invite Sent" : "Invite Not Sent"}> <span className="toggle-icon">{status === "Sent" && <Check size={14} />}</span> {status === "Sent" ? "Sent" : "Not sent"} </button> );
    };
    const renderRsvpStatus = (status, inviteSent, id, isEditMode = false) => {
         const currentValue = isEditMode && editingGuest?.id === id ? editingGuest.rsvpStatus : status;
         const currentInviteSent = isEditMode && editingGuest?.id === id ? editingGuest.inviteSent : inviteSent;
         if (isEditMode && editingGuest?.id === id) {
            // NOTE: Removed onKeyDown here, moved to TR
            return ( <select name="rsvpStatus" className="status-select" value={currentValue || "Pending"} onChange={(e) => handleInputChange(e, true)} disabled={currentInviteSent !== "Sent"} > <option value="Pending">Pending</option><option value="Confirmed">Confirmed</option><option value="Declined">Declined</option> </select> );
         }
         if (currentInviteSent !== "Sent") { return <div className="rsvp-status-icon rsvp-not-invited" title="Invite not sent"><Circle size={18} /></div>; }
         const statusMap = { "Pending": { icon: Mail, className: "rsvp-pending", title: "RSVP Pending" }, "Confirmed": { icon: Check, className: "rsvp-confirmed", title: "RSVP Confirmed" }, "Declined": { icon: X, className: "rsvp-declined", title: "RSVP Declined" }, };
         const current = statusMap[status] || statusMap["Pending"]; const Icon = current.icon;
         return ( <button className={`rsvp-status-icon ${current.className}`} onClick={(e) => { e.stopPropagation(); toggleRsvpStatus(id, status); }} title={current.title}> <Icon size={18} /> </button> );
    };

    // --- Filtered guests ---
    const filteredGuests = useMemo(() => {
        const guestList = Array.isArray(guests) ? guests : [];
        if (activeFilter === 'all') return guestList;
        return guestList.filter(guest => guest?.inviteDecision === activeFilter);
    }, [guests, activeFilter]);

    // --- Fetch Recommendations Function ---
    const handleGeneratePlusOneRecs = async () => {
        setIsLoadingRecs(true); setRecsError(''); setRecommendations([]); setShowRecs(true);
        if (!guests || guests.length === 0) { setRecsError("Add guests first."); setIsLoadingRecs(false); return; }
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
        try {
            const response = await fetch(`${backendUrl}/api/recommend-plus-ones`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guests: guests, max_courtesy_plus_ones: maxCourtesyPlusOnes })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || `HTTP Error ${response.status}`);
            if (data.recommendations && Array.isArray(data.recommendations)) {
                 setRecommendations(data.recommendations);
            } else { throw new Error("Invalid response format from server - expected 'recommendations' array."); }
        } catch (error) { console.error("Rec fetch error:", error); setRecsError(`Failed: ${error.message}`);
        } finally { setIsLoadingRecs(false); }
    };

    // --- JSX Return ---
    return (
        <div className="page-container guest-list-page-container">

            {/* App Header Section */}
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
                    <div className="limit-content">
                        <div className="limit-number-container"> <input type="number" className="limit-number" value={inviteeLimit} onChange={(e) => setInviteeLimit(Math.max(1, parseInt(e.target.value) || 0))} min="1"/> <span className="limit-label">guests allowed</span> </div>
                        <div className="progress-container"> <div className={`progress-bar ${metrics.definitelyInviting <= inviteeLimit ? 'progress-good' : 'progress-over'}`} style={{ width: `${Math.min(100, (metrics.definitelyInviting / Math.max(1, inviteeLimit)) * 100)}%` }}></div> </div>
                        <div className="limit-info"> <div className="limit-stat"><span className="stat-value">{metrics.definitelyInviting}</span> invited</div> <div className="limit-stat"><span className="stat-value">{Math.max(0, inviteeLimit - metrics.definitelyInviting)}</span> spots left</div> </div>
                        {metrics.definitelyInviting > inviteeLimit && ( <div className="limit-warning">Over limit by {metrics.definitelyInviting - inviteeLimit}!</div> )}
                    </div>
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
                                    <select className="date-select" value={weddingDay} onChange={handleDayChange} disabled={!weddingMonth}> {dayOptions.map(opt => <option key={opt.value || 'day-placeholder'} value={opt.value}>{opt.label}</option>)} </select>
                                    <select className="date-select" value={weddingYear} onChange={handleYearChange}> {yearOptions.map(opt => <option key={opt.value || 'year-placeholder'} value={opt.value}>{opt.label}</option>)} </select>
                                </div>
                                {formattedWeddingDate === "Invalid Date" && <p className="date-error">Please select a valid date.</p>}
                            </div>
                        ) : (
                            <div className="countdown-display-view">
                                 {countdownDays !== null && typeof countdownDays === 'number' ? (
                                    <> <div className="countdown-days">{countdownDays}</div> <div className="countdown-label">days until!</div> </>
                                 ) : ( <div className="countdown-days passed">{countdownDays || 'Set Date!'}</div> )}
                                 <div className="countdown-date">{formattedWeddingDate}</div>
                                 {typeof handleEditDate === 'function' && <button onClick={handleEditDate} className="edit-date-button"> <Edit3 size={14}/> Change Date </button>}
                            </div>
                        )}
                    </div>
                </div>
                 {/* Invites Sent Card */}
                 <div className="invites-sent-card status-card-item">
                    <h3 className="invites-title">Invitations & RSVP</h3>
                    <div className="invites-content">
                        <div className="invites-number"> {metrics.invitesSent} <span className="invites-label">of {metrics.definitelyInviting} invites sent</span> </div>
                        <div className="invites-progress-container"> <div className="invites-progress-bar" style={{ width: `${metrics.definitelyInviting > 0 ? (metrics.invitesSent / metrics.definitelyInviting) * 100 : 0}%` }}></div> </div>
                        <div className="rsvp-stats">
                            <div className="rsvp-stat"><div className="rsvp-icon-indicator rsvp-confirmed"></div><span className="rsvp-count">{metrics.rsvpsConfirmed}</span> confirmed</div>
                            <div className="rsvp-stat"><div className="rsvp-icon-indicator rsvp-declined"></div><span className="rsvp-count">{metrics.rsvpsDeclined}</span> declined</div>
                            <div className="rsvp-stat"><div className="rsvp-icon-indicator rsvp-pending"></div><span className="rsvp-count">{metrics.rsvpsPending}</span> pending</div>
                         </div>
                        {metrics.definitelyInviting > 0 && metrics.invitesSent < metrics.definitelyInviting && ( <div className="invites-remaining">{metrics.definitelyInviting - metrics.invitesSent} invitations left to send</div> )}
                        {metrics.rsvpsPending > 0 && ( <Link to="/reminders" className="action-button secondary-button send-reminder-link"> <Mail size={16} /> Send RSVP Reminders </Link> )}
                    </div>
                 </div>
            </section>

            {/* Guest List Header */}
            <header className="guest-list-header guest-list-actions-multi-row">
                 <div className="guest-list-title-row">
                    <h3 className="guest-list-title">Guest List</h3>
                     {activeFilter !== 'all' && ( <span className="filter-indicator">Filtered by: {activeFilter.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} <button onClick={() => setActiveFilter('all')} className="clear-filter-inline" title="Clear Filter">×</button> </span> )}
                 </div>
                 <div className="guest-list-action-row">
                    {/* Plus One Controls */}
                    <div className="plus-one-controls">
                         <label htmlFor="maxCourtesyPlusOnes">Max Courtesy +1s:</label>
                         <input type="number" id="maxCourtesyPlusOnes" value={maxCourtesyPlusOnes} onChange={(e) => setMaxCourtesyPlusOnes(Math.max(0, parseInt(e.target.value, 10) || 0))} min="0" className="plus-one-limit-input" />
                        <button onClick={handleGeneratePlusOneRecs} className="action-button primary-button recommend-button" disabled={isLoadingRecs || !Array.isArray(guests) || guests.length === 0} title={!Array.isArray(guests) || guests.length === 0 ? "Add guests first" : "Generate Plus-One Recommendations"}>
                            {isLoadingRecs ? <Loader size={16} className="spinner-inline"/> : <ThumbsUp size={16}/>} {isLoadingRecs ? ' Analyzing...' : ' Recommend +1s'}
                        </button>
                     </div>
                     {/* Original Actions */}
                     <div className="template-buttons">
                         <button onClick={downloadTemplateCSV} className="action-button secondary-button" title="Download CSV template"><Download size={16} /> CSV</button>
                         <button onClick={downloadTemplatePDF} className="action-button secondary-button" title="Download PDF template"><FileText size={16} /> PDF</button>
                     </div>
                     <div className="csv-upload-container">
                         <input type="file" accept=".csv" onChange={handleFileUpload} ref={fileInputRef} id="csv-upload" style={{ display: 'none' }} disabled={uploadState === 'processing'} />
                         <label htmlFor="csv-upload" className={`action-button secondary-button ${uploadState === 'processing' ? 'disabled' : ''}`}> {uploadState === 'processing' ? <Loader size={16} className='spinner-inline'/> : <Upload size={16} />} Upload </label>
                         {csvError && <div className="csv-error-tooltip">{csvError}</div>}
                     </div>
                    {!isAddingGuest && ( <button onClick={() => setIsAddingGuest(true)} className="action-button primary-button add-guest-button" disabled={uploadState === 'processing'}> <PlusCircle size={16} /> Add Guest </button> )}
                </div>
            </header>

            {/* Guest List Table Area */}
            <div className="guest-table-area-wrapper">
                 {(uploadState === 'processing' || uploadState === 'success' || uploadState === 'error') && ( <div className={`upload-status-overlay ${uploadState}`}><div className="upload-status-content">{uploadMessage}</div></div> )}
                 <div className={`guest-table-container ${uploadState === 'processing' ? 'processing-table' : ''}`}>
                    <table className="guest-table extra-wide-table">
                        <thead>
                            <tr>
                                <th>Name</th><th>Email</th><th>Phone</th><th>Address</th>
                                <th>Joy</th><th>Relationship</th><th>Future Rel.</th><th>Obligation</th>
                                {/* REMOVED <th>Partner Status</th> */}
                                <th>Knows Others?</th><th>Out of Town?</th><th>Wedding Party?</th>
                                <th>Serious Rel.?</th>
                                <th>Invite Suggestion</th><th>Invite Decision</th><th>Sent?</th><th>RSVP</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Add Guest Row */}
                            {isAddingGuest && (
                                <tr className="add-guest-row">
                                    <td><input name="name" type="text" value={newGuest.name} onChange={handleInputChange} placeholder="Name" className="guest-input"/></td>
                                    <td><input name="email" type="email" value={newGuest.email} onChange={handleInputChange} placeholder="Email" className="guest-input"/></td>
                                    <td><input name="phone" type="tel" value={newGuest.phone} onChange={handleInputChange} placeholder="Phone" className="guest-input"/></td>
                                    <td><input name="address" type="text" value={newGuest.address} onChange={handleInputChange} placeholder="Address" className="guest-input"/></td>
                                    <td><select name="joyFactor" value={newGuest.joyFactor} onChange={handleInputChange} className="guest-select"><option>Lots of joy</option><option>Some joy</option><option>I just feel obligated</option></select></td>
                                    <td><select name="relationshipCloseness" value={newGuest.relationshipCloseness} onChange={handleInputChange} className="guest-select"><option>Friend</option><option>Immediate family</option><option>Extended family</option><option>Best friend</option><option>Close friend</option><option>Friend of partner</option><option>Coworker</option><option>Distant relative</option></select></td>
                                    <td><select name="futureRelationshipPotential" value={newGuest.futureRelationshipPotential} onChange={handleInputChange} className="guest-select"><option>Uncertain</option><option>Want to maintain</option><option>Likely to maintain</option><option>Unlikely to maintain</option></select></td>
                                    <td><select name="obligationLevel" value={newGuest.obligationLevel} onChange={handleInputChange} className="guest-select"><option>No obligations</option><option>Obligated if inviting family</option><option>Obligated if inviting friends</option><option>Obligated if inviting coworkers</option><option>Other obligation</option></select></td>
                                    {/* REMOVED Partner Status Input */}
                                    <td><input name="knows_many_others" type="checkbox" checked={newGuest.knows_many_others} onChange={handleInputChange} /></td>
                                    <td><input name="is_out_of_town" type="checkbox" checked={newGuest.is_out_of_town} onChange={handleInputChange} /></td>
                                    <td><input name="is_wedding_party" type="checkbox" checked={newGuest.is_wedding_party} onChange={handleInputChange} /></td>
                                    <td><input name="is_serious_relationship" type="checkbox" checked={newGuest.is_serious_relationship} onChange={handleInputChange} title="Check if guest is in a known serious/long-term relationship"/></td>
                                    <td className="suggestion">{generateSuggestion(newGuest)}</td>
                                    <td><select name="inviteDecision" value={newGuest.inviteDecision} onChange={handleInputChange} className="guest-select"><option>Consider inviting</option><option>Definitely inviting</option><option>Definitely not inviting</option></select></td>
                                    <td><select name="inviteSent" value={newGuest.inviteSent} onChange={handleInputChange} className="guest-select"><option>Not sent</option><option>Sent</option></select></td>
                                    <td><select value="Pending" disabled className="guest-select"><option>Pending</option></select></td>
                                    <td><div className="action-buttons"><button onClick={handleAddGuest} className="confirm-button" title="Save Guest"><Check size={16} /></button><button onClick={() => setIsAddingGuest(false)} className="cancel-button" title="Cancel Add"><X size={16} /></button></div></td>
                                </tr>
                            )}
                            {/* Guest Rows */}
                            {filteredGuests.map((guest) => (
                                // onKeyDown listener is on the TR for edit mode
                                <tr
                                    key={guest.id}
                                    className={`guest-row ${editingGuest?.id === guest.id ? "editing" : "clickable-row"} ${newlyAddedGuestIds.includes(guest.id) ? 'newly-added' : ''}`}
                                    onClick={() => !(editingGuest || isAddingGuest) && startEditingGuest(guest)}
                                    onKeyDown={editingGuest?.id === guest.id ? handleEditingKeyDown : undefined}
                                >
                                    {editingGuest?.id === guest.id ? (
                                        // EDIT MODE - REMOVED partner_status, REMOVED onKeyDown from inputs
                                        <>
                                            <td><input name="name" type="text" value={editingGuest.name} onChange={(e) => handleInputChange(e, true)} className="guest-input"/></td>
                                            <td><input name="email" type="email" value={editingGuest.email} onChange={(e) => handleInputChange(e, true)} className="guest-input"/></td>
                                            <td><input name="phone" type="tel" value={editingGuest.phone} onChange={(e) => handleInputChange(e, true)} className="guest-input"/></td>
                                            <td><input name="address" type="text" value={editingGuest.address} onChange={(e) => handleInputChange(e, true)} className="guest-input"/></td>
                                            <td><select name="joyFactor" value={editingGuest.joyFactor || 'Some joy'} onChange={(e) => handleInputChange(e, true)} className="guest-select"><option>Lots of joy</option><option>Some joy</option><option>I just feel obligated</option></select></td>
                                            <td><select name="relationshipCloseness" value={editingGuest.relationshipCloseness || 'Friend'} onChange={(e) => handleInputChange(e, true)} className="guest-select"><option>Friend</option><option>Immediate family</option><option>Extended family</option><option>Best friend</option><option>Close friend</option><option>Friend of partner</option><option>Coworker</option><option>Distant relative</option></select></td>
                                            <td><select name="futureRelationshipPotential" value={editingGuest.futureRelationshipPotential || 'Uncertain'} onChange={(e) => handleInputChange(e, true)} className="guest-select"><option>Uncertain</option><option>Want to maintain</option><option>Likely to maintain</option><option>Unlikely to maintain</option></select></td>
                                            <td><select name="obligationLevel" value={editingGuest.obligationLevel || 'No obligations'} onChange={(e) => handleInputChange(e, true)} className="guest-select"><option>No obligations</option><option>Obligated if inviting family</option><option>Obligated if inviting friends</option><option>Obligated if inviting coworkers</option><option>Other obligation</option></select></td>
                                            {/* REMOVED Partner Status Edit Input */}
                                            <td><input name="knows_many_others" type="checkbox" checked={editingGuest.knows_many_others ?? true} onChange={(e) => handleInputChange(e, true)} /></td>
                                            <td><input name="is_out_of_town" type="checkbox" checked={editingGuest.is_out_of_town ?? false} onChange={(e) => handleInputChange(e, true)} /></td>
                                            <td><input name="is_wedding_party" type="checkbox" checked={editingGuest.is_wedding_party ?? false} onChange={(e) => handleInputChange(e, true)} /></td>
                                            <td><input name="is_serious_relationship" type="checkbox" checked={editingGuest.is_serious_relationship ?? false} onChange={(e) => handleInputChange(e, true)} title="Check if guest is in a known serious/long-term relationship"/></td>
                                            <td className="suggestion">{generateSuggestion(editingGuest)}</td>
                                            <td><div className="status-selector">{renderInviteDecision(editingGuest.inviteDecision, editingGuest.id, true)}</div></td>
                                            <td><div className="invite-sent-toggle">{renderInviteSentToggle(editingGuest.inviteSent, editingGuest.id, true)}</div></td>
                                            <td><div className="rsvp-status-toggle">{renderRsvpStatus(editingGuest.rsvpStatus, editingGuest.inviteSent, editingGuest.id, true)}</div></td>
                                            <td><div className="action-buttons"><button onClick={saveEditedGuest} className="confirm-button" title="Save Changes"><Save size={16} /></button><button onClick={cancelEditing} className="cancel-button" title="Cancel Edit"><X size={16} /></button></div></td>
                                        </>
                                    ) : (
                                        // VIEW MODE - REMOVED partner_status
                                        <>
                                            <td>{guest.name}</td><td>{guest.email}</td><td>{guest.phone}</td><td>{guest.address}</td>
                                            <td><select value={guest.joyFactor} onChange={(e) => handleCriteriaChange(guest.id, 'joyFactor', e.target.value)} onClick={(e) => e.stopPropagation()} className="guest-select view-mode-select"><option>Lots of joy</option><option>Some joy</option><option>I just feel obligated</option></select></td>
                                            <td><select value={guest.relationshipCloseness} onChange={(e) => handleCriteriaChange(guest.id, 'relationshipCloseness', e.target.value)} onClick={(e) => e.stopPropagation()} className="guest-select view-mode-select"><option>Friend</option><option>Immediate family</option><option>Extended family</option><option>Best friend</option><option>Close friend</option><option>Friend of partner</option><option>Coworker</option><option>Distant relative</option></select></td>
                                            <td><select value={guest.futureRelationshipPotential} onChange={(e) => handleCriteriaChange(guest.id, 'futureRelationshipPotential', e.target.value)} onClick={(e) => e.stopPropagation()} className="guest-select view-mode-select"><option>Uncertain</option><option>Want to maintain</option><option>Likely to maintain</option><option>Unlikely to maintain</option></select></td>
                                            <td><select value={guest.obligationLevel} onChange={(e) => handleCriteriaChange(guest.id, 'obligationLevel', e.target.value)} onClick={(e) => e.stopPropagation()} className="guest-select view-mode-select"><option>No obligations</option><option>Obligated if inviting family</option><option>Obligated if inviting friends</option><option>Obligated if inviting coworkers</option><option>Other obligation</option></select></td>
                                            {/* REMOVED Partner Status View Cell */}
                                            <td>{guest.knows_many_others ? 'Yes' : 'No'}</td>
                                            <td>{guest.is_out_of_town ? 'Yes' : 'No'}</td>
                                            <td>{guest.is_wedding_party ? 'Yes' : 'No'}</td>
                                            <td>{guest.is_serious_relationship ? 'Yes' : 'No'}</td>
                                            <td className="suggestion">{generateSuggestion(guest)}</td>
                                            <td><div className="status-selector">{renderInviteDecision(guest.inviteDecision, guest.id)}</div></td>
                                            <td><div className="invite-sent-toggle">{renderInviteSentToggle(guest.inviteSent, guest.id)}</div></td>
                                            <td><div className="rsvp-status-toggle">{renderRsvpStatus(guest.rsvpStatus, guest.inviteSent, guest.id)}</div></td>
                                            <td>{/* Empty cell for actions alignment */}</td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {/* No guests message */}
                     {filteredGuests.length === 0 && !isAddingGuest && ( <p className="no-guests-message"> {activeFilter === 'all' ? "No guests added yet. Click 'Add Guest' to start!" : `No guests match the filter "${activeFilter.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}"`} </p> )}
                 </div>
            </div>

            {/* Recommendation Results Section */}
            {showRecs && (
                <section className="recommendation-results-section">
                     <h3 className="recommendation-title">Plus-One Recommendations Results</h3>
                    {isLoadingRecs && <div className="loading-indicator"><Loader size={24} className="spinner"/> Loading recommendations...</div>}
                    {recsError && <div className="recommendation-error-banner"><AlertTriangle size={16}/> {recsError}</div>}
                    {!isLoadingRecs && !recsError && Array.isArray(recommendations) && recommendations.length > 0 && (
                        <div className="recommendation-content">
                            <div className="recommendation-split-layout">
                                <div className="recommendation-list recommended-list">
                                    <h4><ThumbsUp size={16}/> Recommended for +1</h4>
                                    <table>
                                        <thead><tr><th>Name</th><th>Reason</th></tr></thead>
                                        <tbody>
                                            {recommendations.filter(r => r.recommendation === 'Yes').map(rec => (
                                                <tr key={`rec-${rec.guestId}`}><td>{rec.name}</td><td>{rec.reason}</td></tr>
                                            ))}
                                            {recommendations.filter(r => r.recommendation === 'Yes').length === 0 && (
                                                <tr><td colSpan="2"><p>None</p></td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="recommendation-list not-recommended-list">
                                    <h4><ThumbsDown size={16}/> Not Recommended for +1</h4>
                                     <table>
                                         <thead><tr><th>Name</th><th>Reason</th></tr></thead>
                                         <tbody>
                                            {recommendations.filter(r => r.recommendation === 'No').map(rec => (
                                                <tr key={`notrec-${rec.guestId}`}><td>{rec.name}</td><td>{rec.reason}</td></tr>
                                            ))}
                                            {recommendations.filter(r => r.recommendation === 'No').length === 0 && (
                                                <tr><td colSpan="2"><p>None</p></td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Handle case where recommendations array is empty or not an array after loading */}
                    {!isLoadingRecs && !recsError && (!Array.isArray(recommendations) || recommendations.length === 0) && (
                        <p>No recommendations generated or data is empty.</p>
                    )}
                </section>
            )}

            {/* Footer Section */}
            <footer className="app-footer">
                 <div className="footer-content">
                     <div className="footer-logo"> <h3>Aisle Be There</h3> <p>Making wedding planning joyful</p> </div>
                     <div className="footer-links"> <Link to="/reminders" className="footer-link"> <Mail size={14} /> Create Reminder Emails </Link> </div>
                     <div className="footer-attribution"> <p>© {new Date().getFullYear()} Wedding Planner App</p> </div>
                 </div>
            </footer>

        </div> // End page container
    );
}

export default GuestListPage;