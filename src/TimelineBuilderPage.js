// src/TimelineBuilderPage.js - V2 (Styling Refinements & Modal Structure)
import React, { useState, useMemo, useEffect } from 'react';
import { PlusCircle, Edit2, Trash2, ArrowUp, ArrowDown, Clock, MapPin, FileText, X, Copy, CalendarPlus, CalendarCheck, Save, Download, Plus } from 'lucide-react'; // Added icons
import './WeddingPlannerApp.css';
import './TimelineEventStyles.css';
import PageTransition from './components/PageTransition';
import { v4 as uuidv4 } from 'uuid';

// --- Sample Templates (Unchanged) ---
const templates = { /* ... unchanged templates object ... */ };
// --- Time Options & Helpers (Unchanged) ---
const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
const minutes = ['00', '15', '30', '45'];
const amPmOptions = ['AM', 'PM'];
const convertTo24Hour = (hourStr, minuteStr, amPm) => { /* ... unchanged ... */ if (!hourStr || !minuteStr) return ''; let hour = parseInt(hourStr, 10); if (amPm === 'PM' && hour !== 12) hour += 12; if (amPm === 'AM' && hour === 12) hour = 0; return `${hour.toString().padStart(2, '0')}:${minuteStr}`; };
const convertFrom24Hour = (time24) => { /* ... unchanged ... */ if (!time24 || !time24.includes(':')) return { hour: '', minute: '', amPm: 'AM' }; const [hour24Str, minuteStr] = time24.split(':'); const hour24 = parseInt(hour24Str, 10); const amPm = hour24 >= 12 ? 'PM' : 'AM'; let hour12 = hour24 % 12; if (hour12 === 0) hour12 = 12; return { hour: hour12.toString(), minute: minuteStr, amPm: amPm }; };
// --- Initial New Event State (Unchanged) ---
const initialNewEventState = { 
    title: '',
    startHour: '',
    startMinute: '',
    startAmPm: 'AM',
    endHour: '',
    endMinute: '',
    endAmPm: 'AM',
    location: '',
    description: ''
};

function TimelineBuilderPage({
    timelineEvents = [],
    setTimelineEvents,
    weddingDate // Expecting a Date object or parsable string
}) {
    // State (unchanged)
    const [newEventData, setNewEventData] = useState(initialNewEventState);
    const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false); // Control edit modal visibility
    const [editingEventId, setEditingEventId] = useState(null);
    const [editFormData, setEditFormData] = useState(null);

    // Sorting (unchanged)
    const sortEvents = (events) => { /* ... */ return [...events].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')); };

    // --- Add/Edit/Delete Handlers (Logic Unchanged, Modal Control Updated) ---
    const handleNewEventInputChange = (e) => { /* ... */ setNewEventData(prev => ({ ...prev, [e.target.name]: e.target.value })); };
    const handleAddNewEvent = () => { /* ... validation ... */ const startTime24 = convertTo24Hour(newEventData.startHour, newEventData.startMinute, newEventData.startAmPm); const endTime24 = convertTo24Hour(newEventData.endHour, newEventData.endMinute, newEventData.endAmPm); if (!startTime24 || !endTime24 || !newEventData.title) { alert("Start Time, End Time, and Title are required to add an event."); return; } if (startTime24 >= endTime24) { alert("End Time must be after Start Time."); return; } const eventToAdd = { id: Date.now(), startTime: startTime24, endTime: endTime24, title: newEventData.title, location: newEventData.location, description: newEventData.description }; setTimelineEvents(sortEvents([...timelineEvents, eventToAdd])); setNewEventData(initialNewEventState); };
    const handleInlineKeyDown = (e) => { if (e.key === 'Enter') { handleAddNewEvent(); } };

    const handleShowEditModal = (event) => { /* ... */ const start = convertFrom24Hour(event.startTime); const end = convertFrom24Hour(event.endTime); setEditFormData({ id: event.id, startHour: start.hour, startMinute: start.minute, startAmPm: start.amPm, endHour: end.hour, endMinute: end.minute, endAmPm: end.amPm, title: event.title, location: event.location || '', description: event.description || '' }); setEditingEventId(event.id); setIsEditModalVisible(true); }; // Show modal
    const handleCloseEditModal = () => { /* ... */ setIsEditModalVisible(false); setEditingEventId(null); setEditFormData(null); }; // Hide modal
    const handleEditModalInputChange = (e) => { /* ... */ setEditFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };
    const handleSaveChanges = (e) => { /* ... validation ... */ e.preventDefault(); if (!editFormData) return; const startTime24 = convertTo24Hour(editFormData.startHour, editFormData.startMinute, editFormData.startAmPm); const endTime24 = convertTo24Hour(editFormData.endHour, editFormData.endMinute, editFormData.endAmPm); if (!startTime24 || !endTime24 || !editFormData.title) { alert("Start Time, End Time, and Title are required."); return; } if (startTime24 >= endTime24) { alert("End Time must be after Start Time."); return; } const eventDataToSave = { id: editingEventId, startTime: startTime24, endTime: endTime24, title: editFormData.title, location: editFormData.location, description: editFormData.description }; const updatedEvents = timelineEvents.map(event => event.id === editingEventId ? eventDataToSave : event ); setTimelineEvents(sortEvents(updatedEvents)); handleCloseEditModal(); };

    const handleDeleteEvent = (id) => { /* ... */ if (window.confirm("Are you sure you want to delete this timeline event?")) { setTimelineEvents(prev => prev.filter(event => event.id !== id)); } };
    const handleMoveEvent = (id, direction) => { /* ... unchanged ... */ };

    // --- Template Handling (Unchanged Logic) ---
     const handleShowTemplateModal = () => setIsTemplateModalVisible(true);
     const handleCloseTemplateModal = () => setIsTemplateModalVisible(false);
     const handleLoadTemplate = (templateKey) => { /* ... */ if (window.confirm("Loading a template will replace your current timeline. Are you sure?")) { const templateEvents = templates[templateKey].map(event => ({ ...event, description: event.notes || '', id: Date.now() + Math.random() })); setTimelineEvents(sortEvents(templateEvents)); handleCloseTemplateModal(); } };

    // --- iCal Export (Unchanged Logic) ---
    const handleExportSingleEvent = (event) => { /* ... unchanged ... */ };

    // Formatting Time (Unchanged)
    const formatTimeForDisplay = (time24) => { /* ... */ if (!time24) return ''; const parts = convertFrom24Hour(time24); return `${parts.hour}:${parts.minute} ${parts.amPm}`; };

    return (
        <PageTransition>
            <div className="timeline-builder-container">
                <div className="app-header">
                    <h1 className="app-title">Wedding Day Timeline</h1>
                    <p className="app-subtitle">Plan your perfect day, hour by hour</p>
                </div>

                {/* Action Bar */}
                <div className="action-bar">
                    <button className="action-button add-event-button" onClick={() => setIsEditModalVisible(true)}>
                        <Plus size={18} /> Add Event
                    </button>
                    <button className="action-button save-button">
                        <Save size={18} /> Save Timeline
                    </button>
                    <button className="action-button export-button">
                        <Download size={18} /> Export PDF
                    </button>
                </div>

                {/* Inline Add Event Row (unchanged structure, styles updated in CSS) */}
                <section className="add-event-inline-form event-block">
                    <div className="event-time">
                        <PlusCircle size={20} style={{ marginBottom: '0.5rem' }}/>
                        <span className="time-placeholder">Add New</span>
                    </div>
                    <div className="event-details add-details">
                        <div className="title-input-group">
                            <input 
                                type="text" 
                                id="new-title" 
                                name="title" 
                                placeholder="New Event Title*" 
                                value={newEventData.title} 
                                onChange={handleNewEventInputChange} 
                                className="inline-input"
                                onKeyDown={handleInlineKeyDown}
                                required
                            />
                        </div>
                    
                        <div className="start-time-section">
                            <label>Start Time*</label>
                            <div className="time-input-group">
                                <select 
                                    name="startHour" 
                                    value={newEventData.startHour} 
                                    onChange={handleNewEventInputChange}
                                    onKeyDown={handleInlineKeyDown}
                                    required
                                >
                                    <option value="" disabled>Hr</option>
                                    {hours.map(h => <option key={`start-h-${h}`} value={h}>{h}</option>)}
                                </select>
                                <span>:</span>
                                <select 
                                    name="startMinute" 
                                    value={newEventData.startMinute} 
                                    onChange={handleNewEventInputChange}
                                    onKeyDown={handleInlineKeyDown}
                                    required
                                >
                                    <option value="" disabled>Min</option>
                                    {minutes.map(m => <option key={`start-m-${m}`} value={m}>{m}</option>)}
                                </select>
                                <select 
                                    name="startAmPm" 
                                    value={newEventData.startAmPm} 
                                    onChange={handleNewEventInputChange}
                                    onKeyDown={handleInlineKeyDown}
                                    required
                                >
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </select>
                            </div>
                        </div>

                        <div className="end-time-section">
                            <label>End Time*</label>
                            <div className="time-input-group">
                                <select 
                                    name="endHour" 
                                    value={newEventData.endHour} 
                                    onChange={handleNewEventInputChange}
                                    onKeyDown={handleInlineKeyDown}
                                    required
                                >
                                    <option value="" disabled>Hr</option>
                                    {hours.map(h => <option key={`end-h-${h}`} value={h}>{h}</option>)}
                                </select>
                                <span>:</span>
                                <select 
                                    name="endMinute" 
                                    value={newEventData.endMinute} 
                                    onChange={handleNewEventInputChange}
                                    onKeyDown={handleInlineKeyDown}
                                    required
                                >
                                    <option value="" disabled>Min</option>
                                    {minutes.map(m => <option key={`end-m-${m}`} value={m}>{m}</option>)}
                                </select>
                                <select 
                                    name="endAmPm" 
                                    value={newEventData.endAmPm} 
                                    onChange={handleNewEventInputChange}
                                    onKeyDown={handleInlineKeyDown}
                                    required
                                >
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </select>
                            </div>
                        </div>

                        <div className="location-input-group">
                            <input 
                                type="text" 
                                id="new-location" 
                                name="location" 
                                placeholder="Location" 
                                value={newEventData.location} 
                                onChange={handleNewEventInputChange} 
                                className="inline-input"
                                onKeyDown={handleInlineKeyDown}
                            />
                        </div>

                        <div className="description-input-group">
                            <textarea 
                                id="new-description" 
                                name="description" 
                                placeholder="Description" 
                                value={newEventData.description} 
                                onChange={handleNewEventInputChange} 
                                className="inline-input" 
                                rows="1"
                                onKeyDown={handleInlineKeyDown}
                            />
                        </div>
                    </div>
                    
                    <div className="event-actions">
                        <button 
                            onClick={handleAddNewEvent} 
                            className="action-button primary-button"
                        >
                            Add
                        </button>
                    </div>
                </section>

                {/* Event List (Structure unchanged, styles updated in CSS) */}
                <section className="timeline-list-section">
                     <div className="timeline-list">
                         {timelineEvents.length === 0 ? (
                              <p className="no-data-message">No timeline events added yet. Add one above or load a template.</p>
                         ) : (
                            sortEvents(timelineEvents).map((event, index) => {
                                const isComplete = false; // Placeholder for completion status logic
                                return (
                                    <div key={event.id} className={`event-block status-card-item ${isComplete ? 'complete' : 'incomplete'}`}>
                                        <div className="event-time">
                                            <Clock size={20} />
                                            {formatTimeForDisplay(event.startTime)}
                                            <span className="time-separator">-</span>
                                            {formatTimeForDisplay(event.endTime)}
                                        </div>
                                        <div className="event-details">
                                            <h3 className="event-title">{event.title}</h3>
                                            {event.location && <p className="event-location"><MapPin size={14} /> {event.location}</p>}
                                            {event.description && <p className="event-notes"><FileText size={14} /> {event.description}</p>}
                                        </div>
                                        <div className="event-actions">
                                             <button onClick={() => handleMoveEvent(event.id, 'up')} className="action-button move-button" title="Move Up" disabled={index === 0}> <ArrowUp size={18} /> </button>
                                             <button onClick={() => handleMoveEvent(event.id, 'down')} className="action-button move-button" title="Move Down" disabled={index === timelineEvents.length - 1}> <ArrowDown size={18} /> </button>
                                             <button onClick={() => handleExportSingleEvent(event)} className="action-button export-button" title="Export to Calendar (.ics)" disabled={!weddingDate}> <CalendarPlus size={18} /> </button>
                                             <button onClick={() => handleShowEditModal(event)} className="action-button edit-button" title="Edit Event"> <Edit2 size={18} /> </button>
                                             <button onClick={() => handleDeleteEvent(event.id)} className="action-button delete-button" title="Delete Event"> <Trash2 size={18} /> </button>
                                             {/* Add completion toggle later */}
                                             {/* <button className="action-button complete-button" title="Mark Complete"><CalendarCheck size={18}/></button> */}
                                        </div>
                                    </div>
                                );
                            })
                         )}
                     </div>
                </section>

                {/* Edit Event Modal (Controlled by state) */}
                {isEditModalVisible && editFormData && (
                    <div className="modal-overlay"> {/* Added overlay */}
                        <div className="modal-content edit-modal"> {/* Added class */}
                            <button className="modal-close-button" onClick={handleCloseEditModal}><X size={20} /></button>
                            <h2>Edit Timeline Event</h2>
                            <form onSubmit={handleSaveChanges} className="event-form"> {/* Added class */}
                                {/* Title */}
                                <div className="form-group"> <label htmlFor="edit-title">Title*</label> <input type="text" id="edit-title" name="title" value={editFormData.title} onChange={handleEditModalInputChange} required /> </div>
                                {/* Location */}
                                <div className="form-group"> <label htmlFor="edit-location">Location</label> <input type="text" id="edit-location" name="location" value={editFormData.location} onChange={handleEditModalInputChange} /> </div>
                                {/* Description */}
                                <div className="form-group"> <label htmlFor="edit-description">Description</label> <textarea id="edit-description" name="description" value={editFormData.description} onChange={handleEditModalInputChange} rows="3"/> </div>
                                 {/* Start Time */}
                                <div className="form-group form-group-time"> <label>Start Time*</label> <div className="time-input-group"> <select name="startHour" value={editFormData.startHour} onChange={handleEditModalInputChange} required> <option value="" disabled>Hr</option> {hours.map(h => <option key={`edit-start-h-${h}`} value={h}>{h}</option>)} </select> <span>:</span> <select name="startMinute" value={editFormData.startMinute} onChange={handleEditModalInputChange} required> <option value="" disabled>Min</option> {minutes.map(m => <option key={`edit-start-m-${m}`} value={m}>{m}</option>)} </select> <select name="startAmPm" value={editFormData.startAmPm} onChange={handleEditModalInputChange} required> <option value="AM">AM</option> <option value="PM">PM</option> </select> </div> </div>
                                 {/* End Time */}
                                <div className="form-group form-group-time"> <label>End Time*</label> <div className="time-input-group"> <select name="endHour" value={editFormData.endHour} onChange={handleEditModalInputChange} required> <option value="" disabled>Hr</option> {hours.map(h => <option key={`edit-end-h-${h}`} value={h}>{h}</option>)} </select> <span>:</span> <select name="endMinute" value={editFormData.endMinute} onChange={handleEditModalInputChange} required> <option value="" disabled>Min</option> {minutes.map(m => <option key={`edit-end-m-${m}`} value={m}>{m}</option>)} </select> <select name="endAmPm" value={editFormData.endAmPm} onChange={handleEditModalInputChange} required> <option value="AM">AM</option> <option value="PM">PM</option> </select> </div> </div>
                                {/* Actions */}
                                <div className="form-actions">
                                    <button type="submit" className="action-button primary-button">Save Changes</button>
                                    <button type="button" onClick={handleCloseEditModal} className="action-button secondary-button">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Template Modal (Controlled by state) */}
                {isTemplateModalVisible && (
                    <div className="modal-overlay"> {/* Added overlay */}
                        <div className="modal-content template-modal"> {/* Added class */}
                             <button className="modal-close-button" onClick={handleCloseTemplateModal}><X size={20}/></button>
                            <h2>Load Timeline Template</h2>
                            <p>Loading a template will replace your current timeline.</p>
                            <div className="template-options">
                                {Object.keys(templates).map(templateKey => (
                                    <button key={templateKey} onClick={() => handleLoadTemplate(templateKey)} className="action-button secondary-button template-option">
                                        Load {templateKey.charAt(0).toUpperCase() + templateKey.slice(1)} Template
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                 {/* Footer (unchanged) */}
                 <footer className="app-footer"> {/* ... */} </footer>
            </div>
        </PageTransition>
    );
}

export default TimelineBuilderPage;