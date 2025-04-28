// src/VendorHubPage.js - V2 (Corrected - Uses Table Structure)
import React, { useState } from 'react';
import { PlusCircle, Edit2, Trash2, Search, Save, XCircle, Phone, Mail } from 'lucide-react'; // Added Phone, Mail for icons
import './WeddingPlannerApp.css'; // Reuse existing styles
import './VendorHubStyles.css'; // Import dedicated Vendor Hub Styles

// Default Vendor Categories (Example - Reuse or customize)
const defaultVendorCategories = [
    "Venue", "Catering", "Photography", "Videography", "Music/DJ", "Florist",
    "Cake", "Attire", "Hair & Makeup", "Stationery", "Officiant", "Transportation",
    "Rentals", "Planner/Coordinator", "Other"
];

// Initial sample vendor data (can be empty or managed in App.js)
// const initialVendors = [
//     { id: 1, name: "Grand Hall Rentals", category: "Venue", contactName: "Ms. Eleanor", phone: "555-111-2222", email: "eleanor@grandhall.com", contractStatus: "Signed", paymentDue: "2024-10-01", notes: "Includes setup and cleanup." },
//     { id: 2, name: "Chef's Delight Catering", category: "Catering", contactName: "Mr. John", phone: "555-333-4444", email: "john@chefsdelight.com", contractStatus: "Pending", paymentDue: "2024-11-15", notes: "Final guest count needed 2 weeks prior." },
// ]; // Using props from App.js instead

function VendorHubPage({ vendors = [], setVendors }) { // Default vendors to empty array if not passed via props
    // State for form visibility and editing state
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingVendorId, setEditingVendorId] = useState(null);
    // Initialize form data with default category
    const [formData, setFormData] = useState({
        name: '', category: defaultVendorCategories[0], contactName: '', phone: '',
        email: '', contractStatus: 'Pending', paymentDue: '', notes: ''
    });

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle showing the add form
    const handleShowAddForm = () => {
        setIsFormVisible(true);
        setEditingVendorId(null);
        // Reset form data
        setFormData({
            name: '', category: defaultVendorCategories[0], contactName: '', phone: '',
            email: '', contractStatus: 'Pending', paymentDue: '', notes: ''
        });
    };

    // Handle editing a vendor
    const handleEditVendor = (vendor) => {
        setIsFormVisible(true);
        setEditingVendorId(vendor.id);
        // Populate form with vendor data
        setFormData({
            name: vendor.name,
            category: vendor.category,
            contactName: vendor.contactName || '',
            phone: vendor.phone || '',
            email: vendor.email || '',
            contractStatus: vendor.contractStatus || 'Pending',
            paymentDue: vendor.paymentDue || '',
            notes: vendor.notes || ''
        });
    };

    // Handle form cancel
    const handleCancel = () => {
        setIsFormVisible(false);
        setEditingVendorId(null);
    };

    // Handle form submission
    const handleSaveVendor = (e) => {
        e.preventDefault();
        
        if (editingVendorId) {
            // Update existing vendor
            setVendors(prev => prev.map(v => 
                v.id === editingVendorId ? { ...v, ...formData } : v
            ));
        } else {
            // Add new vendor
            const newVendor = {
                ...formData,
                id: Date.now(), // Simple ID generation
            };
            setVendors(prev => [...prev, newVendor]);
        }
        
        // Close form and reset state
        setIsFormVisible(false);
        setEditingVendorId(null);
    };

    // Delete vendor
    const handleDeleteVendor = (id) => {
        if (window.confirm("Are you sure you want to delete this vendor?")) {
            setVendors(prev => prev.filter(v => v.id !== id));
        }
    };

    return (
        <div className="page-container vendor-hub-container">
            <h1 className="vendor-hub-title">Vendor Hub</h1>
            <p className="vendor-hub-subtitle">Manage your wedding vendors, contracts, and payments</p>

            {/* Vendor Search Section */}
            <section className="vendor-search-section">
                <div className="vendor-search-title">
                    <Search size={20} />
                    Vendor Search & Recommendations
                    <span className="coming-soon-tag">Coming Soon!</span>
                </div>
                <div className="search-input-group">
                    <Search size={16} className="search-icon" />
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder="Search vendors..." 
                        disabled 
                    />
                </div>
            </section>

            {/* Add/Edit Vendor Section */}
            {isFormVisible && (
                <section className="add-edit-vendor-section status-card-item">
                    <h3 className="budget-section-title">{editingVendorId ? 'Edit Vendor' : 'Add New Vendor'}</h3>
                    <form onSubmit={handleSaveVendor} className="vendor-form">
                         <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="name">Vendor Name*</label>
                                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required className="vendor-input" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="category">Category*</label>
                                <select id="category" name="category" value={formData.category} onChange={handleInputChange} required className="vendor-select">
                                    {defaultVendorCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="contactName">Contact Name</label>
                                <input type="text" id="contactName" name="contactName" value={formData.contactName} onChange={handleInputChange} className="vendor-input" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="phone">Phone</label>
                                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="e.g., 555-123-4567" className="vendor-input" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="e.g., contact@vendor.com" className="vendor-input" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="contractStatus">Contract Status</label>
                                <select id="contractStatus" name="contractStatus" value={formData.contractStatus} onChange={handleInputChange} className="vendor-select">
                                    <option value="Pending">Pending</option>
                                    <option value="Signed">Signed</option>
                                    <option value="Negotiating">Negotiating</option>
                                    <option value="Not Needed">Not Needed</option>
                                </select>
                            </div>
                             <div className="form-group">
                                <label htmlFor="paymentDue">Next Payment Due</label>
                                <input type="date" id="paymentDue" name="paymentDue" value={formData.paymentDue} onChange={handleInputChange} className="vendor-input" />
                            </div>
                             <div className="form-group full-width">
                                <label htmlFor="notes">Notes / Contract Details</label>
                                <textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} rows="3" placeholder="e.g., Package details, payment schedule, arrival time..." className="vendor-input"></textarea>
                            </div>
                        </div>
                         <div className="form-actions">
                            <button type="submit" className="action-button primary-button">
                                {editingVendorId ? <><Save size={16}/> Save Changes</> : <><PlusCircle size={16}/> Add Vendor</>}
                            </button>
                            <button type="button" onClick={handleCancel} className="action-button secondary-button">Cancel</button>
                        </div>
                    </form>
                </section>
            )}

            {/* Vendor List Section */}
            <section className="your-vendors-section">
                <div className="your-vendors-header">
                    <h2 className="your-vendors-title">Your Vendors</h2>
                    {/* Show Add button only if form is not visible */}
                    {!isFormVisible && (
                        <button onClick={handleShowAddForm} className="add-vendor-button">
                            <PlusCircle size={18} /> Add Vendor
                        </button>
                    )}
                </div>

                <div className="vendor-table-container">
                    <table className="vendor-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Contact</th>
                                <th>Contract</th>
                                <th>Next Payment</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendors.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>
                                        No vendors added yet. Click "Add Vendor" to get started.
                                    </td>
                                </tr>
                            ) : (
                                vendors.map(vendor => {
                                    // Calculate if payment is upcoming (within 30 days)
                                    const paymentDate = vendor.paymentDue ? new Date(vendor.paymentDue) : null;
                                    const now = new Date();
                                    const isUpcoming = paymentDate && 
                                                      ((paymentDate - now) / (1000 * 60 * 60 * 24)) <= 30 &&
                                                      paymentDate > now;
                                    const isPast = paymentDate && paymentDate < now;
                                    
                                    return (
                                        <tr key={vendor.id}>
                                            <td data-label="Name">{vendor.name}</td>
                                            <td data-label="Category">{vendor.category}</td>
                                            <td data-label="Contact">
                                                <div className="vendor-contact-info">
                                                    {vendor.contactName && (
                                                        <div>{vendor.contactName}</div>
                                                    )}
                                                    {vendor.phone && (
                                                        <div className="contact-detail">
                                                            <Phone size={14} className="icon" />
                                                            {vendor.phone}
                                                        </div>
                                                    )}
                                                    {vendor.email && (
                                                        <div className="contact-detail">
                                                            <Mail size={14} className="icon" />
                                                            <a href={`mailto:${vendor.email}`} className="contact-email">
                                                                {vendor.email}
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td data-label="Contract">
                                                <span className={`status-indicator ${vendor.contractStatus === 'Signed' ? 'status-signed' : 'status-pending'}`}>
                                                    {vendor.contractStatus}
                                                </span>
                                            </td>
                                            <td data-label="Next Payment">
                                                {vendor.paymentDue ? (
                                                    <div className="payment-info">
                                                        <span className={`payment-date ${isUpcoming ? 'upcoming' : ''} ${isPast ? 'past' : ''}`}>
                                                            {new Date(vendor.paymentDue).toLocaleDateString(undefined, {
                                                                month: 'numeric',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                ) : "Not set"}
                                            </td>
                                            <td data-label="Actions" className="actions">
                                                <div className="action-cell">
                                                    <button 
                                                        className="edit-vendor-button" 
                                                        onClick={() => handleEditVendor(vendor)}
                                                        title="Edit Vendor"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        className="delete-vendor-button" 
                                                        onClick={() => handleDeleteVendor(vendor.id)}
                                                        title="Delete Vendor"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Footer */}
            <footer className="app-footer">
                <div className="footer-content">
                    <div className="footer-logo">
                        <h3>Aisle Be There</h3>
                        <p>Vendor management made simple</p>
                    </div>
                    <div className="footer-attribution">
                        <p>© {new Date().getFullYear()} Wedding Planner App</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default VendorHubPage;