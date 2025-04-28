// src/InvitationGeneratorPage.js
import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader, AlertTriangle, Copy, Send, Download } from 'lucide-react';
import './WeddingPlannerApp.css'; // Assuming shared styles

// Pass necessary props from App.js, e.g., formattedWeddingDate, rsvpDeadlineDate
function InvitationGeneratorPage({ formattedWeddingDate, rsvpDeadlineDate }) {
    const [formData, setFormData] = useState({
        coupleNames: '',
        weddingDate: formattedWeddingDate || '',
        weddingTime: '4:00 PM',
        venueName: '',
        venueAddress: '',
        rsvpDeadline: rsvpDeadlineDate || '',
        rsvpMethod: 'Via our website: [Your Link Here]',
        additionalInfo: 'Reception to follow',
        theme: 'Elegant',
        styleDescription: '',
        outputFormat: 'SVG',
    });
    const [svgString, setSvgString] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Effect to update form if props change
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            weddingDate: formattedWeddingDate || prev.weddingDate,
            rsvpDeadline: rsvpDeadlineDate || prev.rsvpDeadline
        }));
    }, [formattedWeddingDate, rsvpDeadlineDate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = {
                ...prev,
                [name]: value,
            };
            // If the theme field was changed *away* from Custom, clear description
            if (name === 'theme' && value !== 'Custom') {
                newState.styleDescription = '';
            }
             // If output format changes, clear previous results
             if (name === 'outputFormat') {
                setSvgString('');
                setImageUrl('');
                setError('');
             }
            return newState;
        });
    };

    const handleGenerateInvitation = async (e) => {
        e.preventDefault();
        setError('');
        setSvgString(''); // Clear previous results
        setImageUrl('');
        setIsLoading(true);

        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
        // Determine endpoint based on format
        const endpoint = formData.outputFormat === 'SVG'
            ? `${backendUrl}/api/generate-invitation`
            : `${backendUrl}/api/generate-invitation-image`; // New endpoint for images

        console.log(`Requesting ${formData.outputFormat} from URL:`, endpoint);

        // Basic frontend validation
        const requiredFields = ['coupleNames', 'weddingDate', 'weddingTime', 'venueName', 'venueAddress', 'rsvpDeadline', 'rsvpMethod', 'theme', 'outputFormat'];
        for (const field of requiredFields) {
            if (!formData[field]) {
                setError(`Please fill in all required fields marked with * and select a theme/format.`);
                setIsLoading(false);
                return;
            }
        }
        if (formData.theme === 'Custom' && !formData.styleDescription) {
             setError("Please provide a style description when selecting the 'Custom' theme.");
             setIsLoading(false);
             return;
        }

        // Prepare data for backend (send all form data for context)
        const payload = {
            ...formData,
            styleDescription: formData.theme === 'Custom' ? formData.styleDescription : '',
        };
        // Remove outputFormat from payload if backend doesn't need it (optional)
        // delete payload.outputFormat;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            // Handle response based on format
            if (formData.outputFormat === 'SVG') {
                if (data.svgString && data.svgString.trim().startsWith('<svg') && data.svgString.trim().endsWith('</svg>')) {
                    setSvgString(data.svgString);
                } else {
                     throw new Error("Received invalid SVG data from server.");
                }
            } else { // Image format
                if (data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.startsWith('http')) {
                    setImageUrl(data.imageUrl);
                } else {
                     throw new Error("Received invalid image URL from server.");
                }
            }

        } catch (err) {
            console.error(`Invitation generation error (${formData.outputFormat}):`, err);
            setError(err.message || `Failed to generate invitation ${formData.outputFormat}. Please try again.`);
            setSvgString('');
            setImageUrl('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyToClipboard = () => {
        if (!svgString) return;
        navigator.clipboard.writeText(svgString)
            .then(() => { alert('SVG code copied to clipboard!'); })
            .catch(err => { console.error('Failed to copy SVG code: ', err); alert('Failed to copy SVG code.'); });
    };

     // Function to handle image download (basic implementation)
     const handleDownloadImage = () => {
        if (!imageUrl) return;
        // Simple link-based download; more robust methods exist
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `wedding-invitation-${formData.theme?.toLowerCase() || 'custom'}.png`; // Suggest filename
        // Note: This might not work for all CORS setups with the OpenAI URL.
        // A backend proxy for download might be needed in some cases.
        // Also, OpenAI URLs expire, so long-term saving requires downloading.
        link.target = '_blank'; // Open in new tab as fallback
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Helper to check if required fields are filled
    const isFormValid = () => {
        const requiredFieldsFilled = formData.coupleNames && formData.weddingDate && formData.weddingTime && formData.venueName && formData.venueAddress && formData.rsvpDeadline && formData.rsvpMethod && formData.theme && formData.outputFormat;
        const customThemeValid = formData.theme !== 'Custom' || (formData.theme === 'Custom' && formData.styleDescription);
        return requiredFieldsFilled && customThemeValid;
    };

    return (
        <div className="page-container invitation-generator-page">
            <div className="app-header">
                <h1 className="app-title">Invitation Generator (AI Draft)</h1>
                <h2 className="app-subtitle">Create a visual invitation draft using AI</h2>
            </div>

            <div className="invitation-content-layout">
                {/* Form Section */}
                <section className="invitation-form-section status-card-item">
                    <h3 className="budget-section-title">Invitation Details & Style</h3>
                    <form onSubmit={handleGenerateInvitation} className="invitation-form">
                        <div className="form-grid">
                             {/* Output Format Selector */}
                            <div className="form-group full-width">
                                <label htmlFor="outputFormat">Output Format*</label>
                                <select id="outputFormat" name="outputFormat" value={formData.outputFormat} onChange={handleInputChange} required className="vendor-input">
                                    <option value="SVG">SVG (Code - Good for Text)</option>
                                    <option value="Image">Image (AI Generated - Good for Visuals)</option>
                                </select>
                            </div>

                            {/* Couple Names */}
                            <div className="form-group">
                                <label htmlFor="coupleNames">Couple's Names*</label>
                                <input type="text" id="coupleNames" name="coupleNames" value={formData.coupleNames} onChange={handleInputChange} required className="vendor-input" placeholder="e.g., Alex & Jordan" />
                            </div>
                            {/* Wedding Date */}
                            <div className="form-group">
                                <label htmlFor="weddingDate">Wedding Date*</label>
                                <input type="text" id="weddingDate" name="weddingDate" value={formData.weddingDate} onChange={handleInputChange} required className="vendor-input" placeholder="e.g., Saturday, October 26, 2025" />
                            </div>
                             {/* Wedding Time */}
                             <div className="form-group">
                                <label htmlFor="weddingTime">Wedding Time*</label>
                                <input type="text" id="weddingTime" name="weddingTime" value={formData.weddingTime} onChange={handleInputChange} required className="vendor-input" placeholder="e.g., 4:00 PM" />
                            </div>
                            {/* Venue Name */}
                            <div className="form-group">
                                <label htmlFor="venueName">Venue Name*</label>
                                <input type="text" id="venueName" name="venueName" value={formData.venueName} onChange={handleInputChange} required className="vendor-input" placeholder="e.g., The Grand Ballroom" />
                            </div>
                             {/* Venue Address */}
                             <div className="form-group full-width">
                                <label htmlFor="venueAddress">Venue Address*</label>
                                <input type="text" id="venueAddress" name="venueAddress" value={formData.venueAddress} onChange={handleInputChange} required className="vendor-input" placeholder="e.g., 123 Main St, Anytown, USA" />
                            </div>
                             {/* RSVP Deadline */}
                             <div className="form-group">
                                <label htmlFor="rsvpDeadline">RSVP Deadline*</label>
                                <input type="text" id="rsvpDeadline" name="rsvpDeadline" value={formData.rsvpDeadline} onChange={handleInputChange} required className="vendor-input" placeholder="e.g., September 15, 2025" />
                            </div>
                            {/* RSVP Method */}
                            <div className="form-group">
                                <label htmlFor="rsvpMethod">RSVP Method*</label>
                                <input type="text" id="rsvpMethod" name="rsvpMethod" value={formData.rsvpMethod} onChange={handleInputChange} required className="vendor-input" placeholder="e.g., Via our website: yoursite.com" />
                            </div>
                             {/* Additional Info */}
                             <div className="form-group full-width">
                                <label htmlFor="additionalInfo">Additional Info (Optional)</label>
                                <textarea id="additionalInfo" name="additionalInfo" value={formData.additionalInfo} onChange={handleInputChange} rows="2" className="vendor-input" placeholder="e.g., Reception to follow, Dress code: Formal"></textarea>
                            </div>
                             {/* Theme Selector */}
                             <div className="form-group">
                                 <label htmlFor="theme">Visual Theme*</label>
                                 <select id="theme" name="theme" value={formData.theme} onChange={handleInputChange} required className="vendor-input">
                                     <option value="Elegant">Elegant</option>
                                     <option value="Modern">Modern</option>
                                     <option value="Rustic">Rustic</option>
                                     <option value="Floral">Floral</option>
                                     <option value="Minimalist">Minimalist</option>
                                     <option value="Custom">Custom (Use Description)</option>
                                 </select>
                             </div>
                            {/* Style Description (Conditional) */}
                             <div className={`form-group ${formData.theme !== 'Custom' ? 'full-width' : ''}`}> {/* Span full if not custom */} 
                                <label htmlFor="styleDescription">
                                    {formData.theme === 'Custom' ? 'Custom Style Description*' : 'Style Description (Optional Refinements)'}
                                </label>
                                <textarea
                                    id="styleDescription"
                                    name="styleDescription"
                                    value={formData.styleDescription}
                                    onChange={handleInputChange}
                                    rows="3"
                                    required={formData.theme === 'Custom'}
                                    className="vendor-input"
                                    placeholder={formData.theme === 'Custom'
                                        ? "Describe the visual style (e.g., vintage watercolor, art deco...)"
                                        : "Add optional hints for the AI (e.g., \"emphasize the date\", \"use cursive for names\")"
                                    }
                                >
                                </textarea>
                            </div>
                        </div>
                         {/* Display input validation error */}
                         {error && !isLoading && !svgString && !imageUrl && (
                             <div className="reminder-error-banner" style={{marginBottom: '1rem', textAlign: 'left'}}>
                                 <AlertTriangle size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle'}} /> {error}
                            </div>
                         )}
                        <div className="form-actions">
                            <button
                                type="submit"
                                className="action-button primary-button"
                                disabled={isLoading || !isFormValid()}
                                title={!isFormValid() ? "Please complete required fields and theme/format selection" : `Generate ${formData.outputFormat}`}
                            >
                                {isLoading ? <><Loader size={16} className="spinner" /> Generating...</> : <><Send size={16} /> Generate {formData.outputFormat}</>}
                            </button>
                        </div>
                    </form>
                </section>

                {/* Preview Section */}
                <section className="invitation-preview-section status-card-item">
                    <h3 className="budget-section-title">Generated Preview ({formData.outputFormat})</h3>
                    <div className="svg-preview-container">
                        {isLoading && (
                            <div className="loading-preview">
                                <Loader size={32} className="spinner" />
                                <p>Generating your invitation preview...</p>
                            </div>
                        )}
                        {/* Display API/generation errors here */}
                        {error && !isLoading && (
                            <div className="error-preview">
                                <AlertTriangle size={32} />
                                <p>Error generating preview:</p>
                                <p className="error-message-text">{error}</p>
                            </div>
                        )}
                        {/* Empty State */}
                        {!isLoading && !error && !svgString && !imageUrl && (
                            <div className="empty-preview">
                                <ImageIcon size={48} />
                                <p>Fill in the details and click Generate.</p>
                                <p>Your invitation preview will appear here.</p>
                            </div>
                        )}
                        {/* Render SVG */}
                        {svgString && !isLoading && !error && formData.outputFormat === 'SVG' && (
                             <>
                                <div
                                    className="svg-invitation-preview"
                                    dangerouslySetInnerHTML={{ __html: svgString }}
                                />
                                <button
                                    onClick={handleCopyToClipboard}
                                    className="action-button secondary-button copy-svg-button"
                                    title="Copy SVG Code"
                                >
                                    <Copy size={16} /> Copy SVG Code
                                </button>
                                <p className="copy-svg-note">Note: Copies the underlying SVG code.</p>
                             </>
                        )}
                         {/* Render Image */}
                         {imageUrl && !isLoading && !error && formData.outputFormat === 'Image' && (
                             <>
                                <img
                                    src={imageUrl}
                                    alt={`AI Generated Invitation Preview (${formData.theme})`}
                                    className="ai-invitation-preview-image"
                                />
                                <button
                                    onClick={handleDownloadImage}
                                    className="action-button secondary-button copy-svg-button"
                                    title="Download Image (Note: URL may expire)"
                                >
                                    <Download size={16} /> Download Image
                                </button>
                                <p className="copy-svg-note">Note: Downloads the generated image. OpenAI URLs expire.</p>
                             </>
                        )}
                    </div>
                    <p className="preview-disclaimer">
                        AI-generated output is a draft. {formData.outputFormat === 'SVG'
                            ? "Layout, fonts, and alignment may require manual refinement in the code or a design tool."
                            : "Visuals and text rendering might differ from prompt details. Text accuracy isn't guaranteed."
                        }
                    </p>
                </section>
            </div>

             {/* Footer */}
             <footer className="app-footer">
                 <div className="footer-content">
                     <div className="footer-logo"><h3>Aisle Be There</h3><p>Invitation drafts made easier</p></div>
                     <div className="footer-attribution"><p>© {new Date().getFullYear()} Wedding Planner App</p></div>
                 </div>
             </footer>
        </div>
    );
}

export default InvitationGeneratorPage;