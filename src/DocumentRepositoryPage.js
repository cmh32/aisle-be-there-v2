import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaFileUpload, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFileAlt, FaTrashAlt, FaDownload, FaSearch, FaTimes } from 'react-icons/fa';
// Assuming a CSS file exists and is imported in the main App component or similar
// import './WeddingPlannerApp.css'; // Or wherever styles are located

const MOCK_DOCUMENTS = [
  { id: 1, name: 'Vendor Contract - Venue.pdf', type: 'pdf', size: 1234567, uploadDate: new Date(2024, 5, 15, 10, 30), url: '#view-pdf' },
  { id: 2, name: 'Catering Menu Options.docx', type: 'docx', size: 54321, uploadDate: new Date(2024, 5, 16, 14, 0), url: '#download-doc' },
  { id: 3, name: 'Guest List Final.xlsx', type: 'xlsx', size: 23456, uploadDate: new Date(2024, 5, 18, 9, 0), url: '#download-xls' },
  { id: 4, name: 'Inspiration Moodboard.jpg', type: 'jpg', size: 2345678, uploadDate: new Date(2024, 5, 20, 16, 45), url: '#view-image' },
  { id: 5, name: 'Invoice - Photographer.pdf', type: 'pdf', size: 98765, uploadDate: new Date(2024, 5, 21, 11, 10), url: '#view-pdf-2' },
  { id: 6, name: 'Notes on Ceremony Music.txt', type: 'txt', size: 1024, uploadDate: new Date(2024, 5, 22, 15, 0), url: '#download-txt' },
];

const getFileIcon = (type) => {
  switch (type.toLowerCase()) {
    case 'pdf': return <FaFilePdf />;
    case 'docx':
    case 'doc': return <FaFileWord />;
    case 'xlsx':
    case 'xls': return <FaFileExcel />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif': return <FaFileImage />;
    default: return <FaFileAlt />;
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const DocumentRepositoryPage = () => {
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Simulate initial loading
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // { name: string, progress: number } | null
  const [uploadStatus, setUploadStatus] = useState(null); // { type: 'success' | 'error', message: string } | null
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // Stores ID of document to delete

  useEffect(() => {
    // Simulate fetching documents
    setTimeout(() => {
      setDocuments(MOCK_DOCUMENTS);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Check if the leave event is not triggered by moving over a child element
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) {
        return;
    }
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow drop
    e.stopPropagation();
    setIsDragging(true); // Keep indicator active while dragging over
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setUploadStatus(null); // Clear previous status

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUpload(files);
    }
  }, []); // Add dependencies if handleUpload changes based on state/props

  const handleFileSelect = (e) => {
    setUploadStatus(null); // Clear previous status
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUpload(files);
    }
     // Reset file input to allow uploading the same file again
    e.target.value = null;
  };

  // Mock upload function
  const handleUpload = (files) => {
    const file = files[0]; // Handle one file at a time for simplicity
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png', 'image/gif', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setUploadStatus({ type: 'error', message: `Error: File type "${file.type}" not supported. Please upload PDF, DOCX, XLSX, JPG, PNG, or TXT.` });
      return;
    }


    setUploadProgress({ name: file.name, progress: 0 });

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress <= 100) {
        setUploadProgress({ name: file.name, progress });
      } else {
        clearInterval(interval);
        setUploadProgress(null);
        // Simulate success/failure
        const success = Math.random() > 0.1; // 90% chance of success
        if (success) {
          const newDocument = {
            id: Date.now(), // Use timestamp as temp ID
            name: file.name,
            type: file.name.split('.').pop() || 'unknown',
            size: file.size,
            uploadDate: new Date(),
            url: `#simulated-${Date.now()}`
          };
          setDocuments(prevDocs => [newDocument, ...prevDocs]);
          setUploadStatus({ type: 'success', message: `"${file.name}" uploaded successfully!` });
        } else {
          setUploadStatus({ type: 'error', message: `Failed to upload "${file.name}". Please try again.` });
        }
      }
    }, 150); // Simulate progress update interval
  };

  const handleDeleteClick = (docId) => {
    setShowDeleteConfirm(docId);
  };

  const confirmDelete = () => {
     if (showDeleteConfirm === null) return;
     // Simulate API call for deletion
     console.log("Simulating delete for doc ID:", showDeleteConfirm);
     setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== showDeleteConfirm));
     setShowDeleteConfirm(null); // Close confirmation
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };


  const filteredDocuments = useMemo(() => {
    if (!searchTerm) {
      return documents;
    }
    return documents.filter(doc =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [documents, searchTerm]);

  // Add basic sorting (by name A-Z for now)
  const sortedDocuments = useMemo(() => {
      return [...filteredDocuments].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredDocuments]);


  return (
    <div className="page-container document-repository-container">
      <h2 className="page-title">Document Repository</h2>
      <p className="page-subtitle">Upload and manage your important wedding documents.</p>

      {/* --- Upload Area --- */}
      <div
        className={`upload-section ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="upload-content">
           <FaFileUpload className="upload-icon-large" />
           <p>Drag & Drop files here</p>
           <p className="upload-separator">or</p>
           <input
             type="file"
             id="fileUpload"
             style={{ display: 'none' }}
             onChange={handleFileSelect}
             accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt" // Inform browser
           />
           <label htmlFor="fileUpload" className="action-button primary-button">
             Select Files to Upload
           </label>
           <p className="upload-hint">Supports: PDF, DOCX, XLSX, JPG, PNG, TXT</p>
        </div>

        {/* Upload Progress Indicator */}
        {uploadProgress && (
          <div className="upload-progress-indicator">
            <p>Uploading: {uploadProgress.name}</p>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${uploadProgress.progress}%` }}
              ></div>
            </div>
            <span>{uploadProgress.progress}%</span>
          </div>
        )}

        {/* Upload Status Message */}
        {uploadStatus && (
          <div className={`upload-status-message ${uploadStatus.type}`}>
             {uploadStatus.message}
             <button onClick={() => setUploadStatus(null)} className="close-status-btn">
                 <FaTimes />
             </button>
          </div>
        )}
      </div>

      {/* --- Controls & Document List --- */}
      <div className="document-list-section">
        <div className="document-controls">
          <div className="search-bar-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search documents..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
             {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="clear-search-btn">
                    <FaTimes />
                </button>
            )}
          </div>
          {/* Add Sorting/Filtering dropdowns here if needed */}
        </div>

        {isLoading ? (
          <div className="loading-indicator">Loading documents...</div>
        ) : sortedDocuments.length > 0 ? (
          <div className="document-table-container">
            <table className="document-table">
              <thead>
                <tr>
                  <th className="col-icon">Type</th>
                  <th className="col-name">Filename</th>
                  <th className="col-date">Upload Date</th>
                  <th className="col-size">Size</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedDocuments.map(doc => (
                  <tr key={doc.id} className="document-item-row">
                    <td className="col-icon file-type-icon" title={doc.type.toUpperCase()}>{getFileIcon(doc.type)}</td>
                    <td className="col-name">{doc.name}</td>
                    <td className="col-date">{doc.uploadDate.toLocaleDateString()} {doc.uploadDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="col-size">{formatFileSize(doc.size)}</td>
                    <td className="col-actions">
                      <div className="document-actions">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="action-icon download-link" title="View/Download">
                          <FaDownload />
                        </a>
                        <button onClick={() => handleDeleteClick(doc.id)} className="action-icon delete-button" title="Delete">
                          <FaTrashAlt />
                        </button>
                        {/* Add Rename/Categorize buttons here */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state-message">
            <FaFileAlt className="empty-state-icon" />
            <h3>No documents yet!</h3>
            <p>Upload your vendor contracts, invoices, guest lists, and inspiration files to keep everything organized.</p>
            <label htmlFor="fileUpload" className="action-button primary-button">
              Upload First Document
            </label>
          </div>
        )}
      </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm !== null && (
            <div className="confirmation-modal-overlay">
                <div className="confirmation-modal">
                    <h4>Confirm Deletion</h4>
                    <p>Are you sure you want to delete this document? This action cannot be undone.</p>
                    <div className="confirmation-actions">
                        <button onClick={cancelDelete} className="action-button secondary-button">Cancel</button>
                        <button onClick={confirmDelete} className="action-button danger-button">Delete</button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default DocumentRepositoryPage; 