// src/DashboardPage.js - V3 (Restored Full Code with Props & Links)
import React, { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom'; // Ensure Link is imported
import {
    LayoutDashboard, // For potential future use maybe? Keep for now.
    DollarSign,     // Budget
    Users,          // Guest List
    ClipboardList,  // Vendor Hub (like a checklist)
    CalendarClock,  // Timeline Builder
    Palette,        // Design & Inspiration
    BookOpen,       // Notes/Documents
    Camera,         // Photo Placeholder Icon
    Edit3,          // Edit Date Icon
    CalendarDays,   // Calendar Icon
    ListChecks,     // Reminder Emails
    Briefcase,      // Vendor Hub Icon
    ArrowRight,     // Arrow Icon for ArrowRight
    Upload,         // Upload Icon for photo upload
    X,              // X Icon for removing photo
    MessagesSquare  // Wedding Assistant chatbot
} from 'lucide-react';
import './WeddingPlannerApp.css'; // Use shared CSS file

function DashboardPage({
    // Props from App.js
    guests,
    // Date props for countdown card
    weddingMonth, setWeddingMonth,
    weddingDay, setWeddingDay,
    weddingYear, setWeddingYear,
    countdownDays, formattedWeddingDate,
    isSettingDate, setIsSettingDate,
    getDaysInMonth,
    handleEditDate,
    // Budget props
    allottedBudget,
    totalSpentOrCommitted,
    formatCurrency, // Receive helper function
    // New props for Timeline Builder
    timelineEvents,
    setTimelineEvents
}) {
    // State for photo URL
    const [photoUrl, setPhotoUrl] = useState(null);
    // Ref for hidden file input
    const fileInputRef = useRef(null);

    // Guest Metrics Calculation (can stay here or use props if calc'd in App)
    const metrics = useMemo(() => {
        const definitelyInvitingList = guests.filter(g => g.inviteDecision === "Definitely inviting");
        const invitesSentList = guests.filter(g => g.inviteSent === "Sent");
        return {
            totalGuests: guests.length,
            definitelyInviting: definitelyInvitingList.length,
            rsvpsConfirmed: invitesSentList.filter(g => g.rsvpStatus === "Confirmed").length,
        };
    }, [guests]);

    // --- Date Dropdown Options & Handlers (For Countdown Card editing) ---
    const monthOptions = useMemo(() => [ { value: '', label: 'Month' }, ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(0, i).toLocaleString('en-US', { month: 'long' }) })) ], []);
    const yearOptions = useMemo(() => { const currentYear = new Date().getFullYear(); return [ { value: '', label: 'Year' }, ...Array.from({ length: 10 }, (_, i) => ({ value: String(currentYear + i), label: String(currentYear + i) })) ]; }, []);
    const dayOptions = useMemo(() => {
        const monthNum = parseInt(weddingMonth, 10);
        const yearNum = parseInt(weddingYear, 10);
        if (typeof getDaysInMonth !== 'function') { console.error("getDaysInMonth prop is not a function!"); return [{ value: '', label: 'Day' }]; }
        const daysInSelectedMonth = getDaysInMonth(monthNum, yearNum);
        const options = [ { value: '', label: 'Day' }, ...Array.from({ length: daysInSelectedMonth || 0 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })) ];
        return options;
    }, [weddingMonth, weddingYear, getDaysInMonth]);

    const handleMonthChange = (e) => setWeddingMonth(e.target.value);
    const handleDayChange = (e) => setWeddingDay(e.target.value);
    const handleYearChange = (e) => setWeddingYear(e.target.value);
    // handleEditDate is passed as a prop

    // Handle photo upload click - Open file dialog
    const handlePhotoUploadClick = () => {
        fileInputRef.current.click();
    };
    
    // Handle file selection
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    setPhotoUrl(event.target.result);
                };
                reader.readAsDataURL(file);
            } else {
                alert('Please select an image file.');
            }
        }
    };
    
    // Handle remove photo
    const handleRemovePhoto = (e) => {
        e.stopPropagation();
        setPhotoUrl(null);
    };

    // --- UPDATED renderStatusCard ---
    const renderStatusCard = (title, subtext, icon, linkTo = null, value = null) => {
         // NEW STRUCTURE: Icon in circle, Title, Subtext/Value, Arrow
        const cardContent = (
            <>
                 {/* Icon Wrapper - Apply circle style via CSS */}
                 <div className="card-icon-wrapper">
                     {icon}
                 </div>
                 {/* Card Body */}
                <div className="card-body">
                    <h3 className="card-title">{title}</h3>
                    {/* Display either the primary value OR the subtext */}
                    {(value || subtext) && (
                         <p className="card-subtext">{value || subtext}</p>
                    )}
                </div>
                 {/* Arrow Indicator */}
                 <ArrowRight className="card-arrow" size={20} />
            </>
        );

        const cardDiv = <div className="status-card-item planning-step-card">{cardContent}</div>; // Add planning-step-card class

        if (linkTo) {
            // Wrap the styled div in a Link
            return (
                <Link to={linkTo} className="status-card-item-link">
                    {cardDiv}
                </Link>
            );
        } else {
            // Render the styled div directly (for non-clickable cards)
            return cardDiv;
        }
    };

    return (
        <div className="page-container dashboard-page-container">
            {/* Dashboard Header */}
            <header className="dashboard-header">
                <div className="logo-container">
                     <h1 className="app-logo-dashboard">Aisle Be There</h1>
                </div>
                <div className="couple-photo-container">
                    <div className="couple-photo-placeholder" onClick={handlePhotoUploadClick} title="Upload Couple Photo">
                        {photoUrl ? (
                            <>
                                <img src={photoUrl} alt="Couple" className="couple-photo-image" />
                                <button 
                                    className="remove-photo-button" 
                                    onClick={handleRemovePhoto} 
                                    title="Remove Photo"
                                >
                                    <X size={16} />
                                </button>
                            </>
                        ) : (
                            <>
                                <Camera size={48} className="photo-placeholder-icon" />
                                <span className="photo-placeholder-text">
                                    <Upload size={14} className="upload-icon" /> Add Photo
                                </span>
                            </>
                        )}
                        {/* Hidden file input */}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="image/*" 
                            style={{ display: 'none' }} 
                        />
                    </div>
                </div>
            </header>

            {/* Countdown Timer Section */}
            <section className="countdown-section status-card-item">
                 <h3 className="wedding-date-title"> <CalendarDays size={18} /> Wedding Countdown </h3>
                 <div className="wedding-date-content">
                    {isSettingDate || !formattedWeddingDate || formattedWeddingDate === "Invalid Date" ? (
                        <div className="date-input-view">
                            <p>Set your wedding date to start the countdown!</p>
                            <div className="date-dropdown-container">
                                <select className="date-select" value={weddingMonth} onChange={handleMonthChange}> {monthOptions.map(opt => <option key={opt.value || 'month-placeholder'} value={opt.value}>{opt.label}</option>)} </select>
                                <select className="date-select" value={weddingDay} onChange={handleDayChange} disabled={!weddingMonth}>
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
                            {/* Ensure handleEditDate is passed from App.js */}
                            {handleEditDate && (
                               <button onClick={handleEditDate} className="edit-date-button"> <Edit3 size={14}/> Change Date </button>
                            )}
                        </div>
                    )}
                 </div>
            </section>

            {/* Planning Steps Grid */}
            <section className="planning-steps-grid">
                {/* Budget Tracker Card - Links to /budget */}
                {renderStatusCard(
                    "Budget Tracker",
                    "Track expenses & payments",
                    <DollarSign size={24} />,
                    "/budget",
                    allottedBudget ? `${formatCurrency(allottedBudget)} Allotted` : null
                )}

                {/* Guest List Manager Card - Links to /guest-list */}
                 {renderStatusCard(
                    "Guest Manager",
                    "Manage RSVPs & invites",
                    <Users size={24} />,
                    "/guest-list",
                    `${guests?.length || 0} Guests`
                 )}

                {/* Vendor Hub Card */}
                {renderStatusCard(
                    "Vendor Hub",
                    "Manage contracts & contacts",
                    <Briefcase size={24} />,
                    "/vendor-hub"
                )}

                {/* Timeline Builder Card */}
                {renderStatusCard(
                    "Timeline Builder",
                    "Plan your day-of schedule",
                    <CalendarClock size={24} />,
                    "/timeline"
                )}

                {/* Design & Inspiration Card */}
                {renderStatusCard(
                    "Design & Inspiration",
                    "Mood boards & style guides.",
                    <Palette size={24} />,
                    null
                )}

                {/* Document Repository Card */}
                {renderStatusCard(
                    "Document Repository",
                    "Store contracts & docs.",
                    <BookOpen size={24} />,
                    null
                )}

                {/* Reminder Emails Card */}
                {renderStatusCard(
                    "Email Reminders",
                    "Send RSVP follow-ups.",
                    <ListChecks size={24} />,
                    "/reminders"
                )}
                
                {/* Wedding Assistant Chatbot Card */}
                {renderStatusCard(
                    "Wedding Assistant",
                    "AI-powered planning help",
                    <MessagesSquare size={24} />,
                    "/chatbot"
                )}
            </section>

             {/* Footer */}
             <footer className="app-footer">
                 <div className="footer-content">
                     <div className="footer-logo"> <h3>Aisle Be There</h3> <p>Your complete wedding planner</p> </div>
                     <div className="footer-attribution"> <p>© {new Date().getFullYear()} Wedding Planner App</p> </div>
                 </div>
             </footer>
        </div>
    );
}

export default DashboardPage;