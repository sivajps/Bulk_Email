import React, { useState, useRef, useEffect } from 'react';
import { Home, Inbox, Edit3, Undo2, Redo2, Bold, Italic, Underline, AlignLeft, List, FileSpreadsheet, ListOrdered, Indent, Outdent, Quote, Link2, Image, Clock, Trash2, Paperclip, CheckCircle, XCircle, Clock as ClockIcon, Send, Settings, X, AlertCircle } from 'lucide-react';
import './dashboard.css';

// Extracted sendBulkEmail function
const sendBulkEmail = async (emailData, setIsLoading, showConfigPopup, isConfigured) => {
  if (!isConfigured) {
    showConfigPopup();
    return { success: false, error: 'Email not configured' };
  }

  if (emailData.to.length === 0) {
    return { success: false, error: 'Please add recipients or upload Excel file with email addresses' };
  }

  if (!emailData.subject.trim()) {
    return { success: false, error: 'Please enter email subject' };
  }

  if (!emailData.content.trim() || emailData.content === '<div><br></div>') {
    return { success: false, error: 'Please write email content' };
  }

  try {
    setIsLoading(true);
    
    const response = await fetch('http://localhost:5000/send_bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check if the endpoint is working.');
    }

    const result = await response.json();
    
    if (result.success) {
      // Calculate sent and failed counts from results
      const results = result.results || {};
      const sentCount = Object.values(results).filter(status => status.includes('sent')).length;
      const failedCount = Object.values(results).filter(status => status.includes('failed')).length;
      
      return {
        success: true,
        data: result,
        message: `✅ Bulk Email Sent Successfully!\n\n📧 Sent: ${sentCount} emails\n❌ Failed: ${failedCount} emails\n\nCheck details for individual results.`
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to send emails'
      };
    }
  } catch (error) {
    console.error('Email sending error:', error);
    
    // Provide more specific error messages
    if (error.message.includes('Failed to fetch')) {
      return {
        success: false,
        error: 'Cannot connect to server. Please make sure the backend server is running on http://localhost:5000'
      };
    } else if (error.message.includes('non-JSON')) {
      return {
        success: false,
        error: 'Server endpoint not working properly. Please ensure the backend server is running.'
      };
    } else {
      return {
        success: false,
        error: 'Network error: ' + error.message
      };
    }
  } finally {
    setIsLoading(false);
  }
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Inbox');
  const [showConfigPopup, setShowConfigPopup] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const menuItems = [
    { name: 'Inbox', icon: Inbox },
    { name: 'Compose', icon: Edit3 },
    { name: 'Configure', icon: Settings }
  ];

    useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        const response = await fetch('http://localhost:5000/');
        if (response.ok) {
          setIsBackendConnected(true);
        } else {
          setIsBackendConnected(false);
        }
      } catch (error) {
        console.error('Backend not available:', error);
        setIsBackendConnected(false);
      }
    };
    
    checkBackendConnection();
  }, []);

  // Check if email is configured
  useEffect(() => {
    const configured = localStorage.getItem('emailConfigured');
    setIsConfigured(configured === 'true');
  }, []);

  // Close popup when navigating to Configure tab
  useEffect(() => {
    if (activeTab === 'Configure') {
      setShowConfigPopup(false);
    }
  }, [activeTab]);

  const handleConfigure = (email, password) => {
    console.log("Configuring email:", email);
    setIsConfigured(true);
    localStorage.setItem('emailConfigured', 'true');
    setShowConfigPopup(false);
  };

  const handleConfigureRedirect = () => {
    setActiveTab('Configure');
  };

  return (
    <div className="dashboard">
      {/* Configuration Popup */}
      {showConfigPopup && (
        <ConfigPopup 
          onConfigure={handleConfigureRedirect}
          onClose={() => setShowConfigPopup(false)} 
        />
      )}

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <div className="header-content">
            <h2 className="page-title">{activeTab}</h2>
          </div>
        </div>
        {/* Content */}
        <div className={`content ${activeTab === 'Compose' || activeTab === 'Configure' ? 'content-full' : 'content-padded'}`}>
          {activeTab === 'Inbox' && <InboxContent />}
          {activeTab === 'Compose' && (
            <EmailComposeWindow 
              isConfigured={isConfigured} 
              showConfigPopup={() => setShowConfigPopup(true)}
              sendBulkEmail={sendBulkEmail}
            />
          )}
          {activeTab === 'Configure' && <EmailConfiguration onConfigure={handleConfigure} />}
        </div>
      </div>
      {/* Footer Navigation */}
      <div className="footer-nav">
        <nav className="footer-nav-container">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`footer-nav-item ${isActive ? 'footer-nav-item-active' : ''}`}
              >
                <IconComponent className="footer-nav-icon" />
                <span className="footer-nav-text">{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

// Configuration Popup Component
const ConfigPopup = ({ onConfigure, onClose }) => {
  return (
    <div className="config-popup-overlay">
      <div className="config-popup-simple">
        <div className="config-popup-header">
          <h2>Configure Your Email</h2>
          <button className="config-popup-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="config-popup-content-simple">
          <p className="config-popup-message">
            You need to configure your email before sending messages.
          </p>
          <button 
            className="config-button-simple"
            onClick={onConfigure}
          >
            Go to Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

const EmailConfiguration = ({ onConfigure }) => {
  const [email, setEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !appPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('http://localhost:5000/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          app_password: appPassword
        })
      });
      
      const data = await response.json();
      
      if (data.verify) {
        setSuccess(data.message || 'Email configured successfully!');
        // Store configuration in localStorage
        localStorage.setItem('emailConfigured', 'true');
        localStorage.setItem('userEmail', email);
        // Call parent callback if needed
        if (onConfigure) onConfigure(email, appPassword);
      } else {
        setError(data.message || 'Failed to verify email configuration');
      }
    } catch (err) {
      setError('Network error: Could not connect to server');
      console.error('Configuration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="configuration-container">
      <div className="configuration-card">
        <h2 className="configuration-title">Configure Your Email for bulk email</h2>
        <p className="configuration-subtitle">Send emails efficiently with your email account</p>

        <div className="configuration-instructions">
          <h3 className="instructions-title">Before you continue</h3>
          <ol className="instructions-list">
            <li>
              <strong>Turn on 2-Step Verification</strong><br />
              <p class="text-sm text-gray-600">Enable 2-Step Verification in your <a href="https://myaccount.google.com/security" target="_blank" class="text-blue-600 hover:underline font-medium">Google Account settings</a></p>
            </li>
            <li>
              <strong>Generate App Password</strong><br />
              <p class="text-sm text-gray-600">Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" class="text-blue-600 hover:underline font-medium">App Passwords</a> and generate a new password</p>
            </li>
            <li>
              <strong>Select App & Device</strong><br />
              Select Apps Mail and Device Other (BulkEmail)
            </li>
            <li>
              <strong>Copy & Paste Password</strong><br />
              Copy the 16-character app password and paste it in the field below
            </li>
          </ol>
        </div>

        <hr className="configuration-divider" />

        <form onSubmit={handleSubmit} className="configuration-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <div className="configuration-field">
            <label className="configuration-label">Your Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="configuration-input"
              placeholder="your.email@gmail.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="configuration-field">
            <label className="configuration-label">App Password</label>
            <input
              type="password"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              className="configuration-input"
              placeholder="16-character app password"
              required
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className="configuration-button"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Configure'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Inbox Content Component
const InboxContent = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [emailHistory, setEmailHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch email history from API
  useEffect(() => {
    const fetchEmailHistory = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:5000/api/email-history');
        
        if (!response.ok) {
          throw new Error('Failed to fetch email history');
        }
        
        const data = await response.json();
        setEmailHistory(data.emails || []);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching email history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmailHistory();
  }, []);

  const filteredEmails = selectedFilter === 'all' 
    ? emailHistory 
    : emailHistory.filter(email => email.status === selectedFilter);

  // Always show status indicators even when no emails
  const statusCounts = {
    sent: emailHistory.filter(email => email.status === 'sent').length,
    failed: emailHistory.filter(email => email.status === 'failed').length,
    sending: emailHistory.filter(email => email.status === 'sending').length,
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'sent': return <CheckCircle size={16} color="#10b981" />;
      case 'failed': return <XCircle size={16} color="#ef4444" />;
      case 'sending': return <ClockIcon size={16} color="#f59e0b" />;
      default: return null;
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'sent': return 'Sent';
      case 'failed': return 'Failed';
      case 'sending': return 'Sending';
      default: return '';
    }
  };

  if (isLoading) {
    return (
      <div className="inbox-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading email history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inbox-container">
      {/* Status Cards */}
      <div className="status-grid">
        <div className="status-card">
          <div className="status-header">
            <div className="status-icon status-icon-green">
              <Send size={20} color="#10b981" />
            </div>
            <span className="status-title">Sent</span>
          </div>
          <div className="status-count">{statusCounts.sent}</div>
        </div>
        <div className="status-card">
          <div className="status-header">
            <div className="status-icon status-icon-red">
              <XCircle size={20} color="#ef4444" />
            </div>
            <span className="status-title">Failed</span>
          </div>
          <div className="status-count">{statusCounts.failed}</div>
        </div>
        <div className="status-card">
          <div className="status-header">
            <div className="status-icon status-icon-yellow">
              <ClockIcon size={20} color="#f59e0b" />
            </div>
            <span className="status-title">Sending</span>
          </div>
          <div className="status-count">{statusCounts.sending}</div>
        </div>
      </div>

      {/* Email History */}
      <div className="email-history">
        <div className="email-history-header">
          <h3 className="email-history-title">Email History</h3>
          <div className="email-history-filters">
            <button 
              className={`filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${selectedFilter === 'sent' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('sent')}
            >
              Sent
            </button>
            <button 
              className={`filter-btn ${selectedFilter === 'failed' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('failed')}
            >
              Failed
            </button>
            <button 
              className={`filter-btn ${selectedFilter === 'sending' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('sending')}
            >
              Sending
            </button>
          </div>
        </div>

        {emailHistory.length === 0 ? (
          <div className="empty-state">
            <Inbox className="empty-state-icon" />
            <h3 className="empty-state-title">No Emails yet</h3>
            <p className="empty-state-text">
              You haven't sent any emails yet. Compose your first email to get started!
            </p>
          </div>
        ) : filteredEmails.length > 0 ? (
          <div className="email-list">
            {filteredEmails.map(email => (
              <div key={email.id} className="email-item">
                <div className="email-item-main">
                  <h4 className="email-subject">{email.subject}</h4>
                  <div className="email-details">
                    <span className="email-recipients">{email.recipients} recipients</span>
                    <span className="email-date">{new Date(email.date).toLocaleString()}</span>
                  </div>
                </div>
                <div className="email-status">
                  {getStatusIcon(email.status)}
                  <span className="status-text">{getStatusText(email.status)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Inbox className="empty-state-icon" />
            <h3 className="empty-state-title">No emails found</h3>
            <p className="empty-state-text">
              No {selectedFilter} emails found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Email Compose Component
const EmailComposeWindow = ({ isConfigured, showConfigPopup, sendBulkEmail }) => {
  const [to, setTo] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [fontFamily, setFontFamily] = useState("Sans Serif");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const editorRef = useRef(null);

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (to.length === 0) {
      newErrors.recipients = 'Please add recipients or upload Excel file with email addresses';
    }

    // Validate each email in the to list
    const invalidEmails = to.filter(email => !isValidEmail(email));
    if (invalidEmails.length > 0) {
      newErrors.invalidEmails = `Invalid email format: ${invalidEmails.join(', ')}`;
    }

    if (!subject.trim()) {
      newErrors.subject = 'Please enter email subject';
    }

    if (!editorRef.current?.innerHTML.trim() || editorRef.current.innerHTML === '<div><br></div>') {
      newErrors.content = 'Please write email content';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add a useEffect to automatically clear the recipients error when emails are added:
  useEffect(() => {
    if (to.length > 0 && errors.recipients) {
      setErrors(prev => ({ ...prev, recipients: undefined }));
    }
  }, [to, errors.recipients]);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
  };

  const insertLink = () => {
    const url = prompt("Enter the link URL:");
    if (url) execCommand("createLink", url);
  };

  const insertImage = () => {
    const url = prompt("Enter the image URL:");
    if (url) execCommand("insertImage", url);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      const email = inputValue.trim().replace(/[,\s]+$/, "");
      if (email && !to.includes(email)) {
        if (isValidEmail(email)) {
          setTo([...to, email]);
          // Clear both recipient errors when a valid email is added
          setErrors(prev => ({ 
            ...prev, 
            recipients: undefined, 
            invalidEmails: undefined 
          }));
        } else {
          setErrors(prev => ({ 
            ...prev, 
            invalidEmails: `Invalid email format: ${email}` 
          }));
        }
      }
      setInputValue("");
    }
  };

  const removeEmail = (email) => {
    const newTo = to.filter((e) => e !== email);
    setTo(newTo);
    
    // If removing the last email, show the recipients error
    if (newTo.length === 0) {
      setErrors(prev => ({ 
        ...prev, 
        recipients: 'Please add recipients or upload Excel file with email addresses' 
      }));
    } else {
      // If there are still emails, clear the recipients error but keep other errors
      setErrors(prev => ({ 
        ...prev, 
        recipients: undefined 
      }));
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      alert('❌ Please upload a valid Excel file (.xlsx, .xls) or CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/upload-excel', {
        method: 'POST',
        body: formData
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response. Please check if the endpoint is working.');
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const validEmails = result.emails.filter(email => isValidEmail(email));
        const invalidEmails = result.emails.filter(email => !isValidEmail(email));
        
        setTo(prevTo => [...new Set([...prevTo, ...validEmails])]);
        
        if (validEmails.length > 0) {
          setErrors(prev => ({ ...prev, recipients: undefined }));
        }
        
        if (invalidEmails.length > 0) {
          setErrors(prev => ({ 
            ...prev, 
            invalidEmails: `Found ${invalidEmails.length} invalid email format(s) in the file` 
          }));
        }
        
        alert(`✅ Successfully imported ${validEmails.length} valid email addresses from Excel file!`);
        
        if (invalidEmails.length > 0) {
          alert(`⚠️ ${invalidEmails.length} invalid emails were skipped.`);
        }
      } else {
        alert('❌ Error reading Excel file: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      if (error.message.includes('non-JSON response')) {
        alert('❌ Server endpoint not working properly. Please ensure the backend server is running and the /api/upload-excel endpoint exists.');
      } else if (error.message.includes('Failed to fetch')) {
        alert('❌ Cannot connect to server. Please make sure the backend server is running on http://localhost:5000');
      } else {
        alert('❌ Upload error: ' + error.message);
      }
    } finally {
      setIsLoading(false);
      // Clear the file input
      e.target.value = '';
    }
  };

  const handleSendBulkEmail = async () => {
    if (!validateForm()) {
      return;
    }

    const emailData = {
      to: to,
      cc: cc || '',
      bcc: bcc || '',
      subject: subject,
      content: editorRef.current.innerHTML
    };

    const result = await sendBulkEmail(emailData, setIsLoading, showConfigPopup, isConfigured);
    
    if (result.success) {
      alert(result.message);
      
      // Reset form
      setTo([]);
      setSubject('');
      setCc('');
      setBcc('');
      setShowCc(false);
      setShowBcc(false);
      setErrors({});
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    } else {
      alert('❌ ' + result.error);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      alert(`📎 File "${file.name}" attached successfully!`);
    }
  };

  const scheduleSend = () => {
    if (to.length === 0) {
      setErrors({ recipients: 'Please add recipients first' });
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    alert("⏰ Email scheduled to be sent in 5 seconds!");
    setTimeout(() => {
      handleSendBulkEmail();
    }, 5000);
  };

  return (
    <div className="email-compose-container">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          Processing... Please wait
        </div>
      )}

      {(errors.recipients || errors.invalidEmails) && (
        <div className="compose-error-container">
          {errors.recipients && (
            <div className="compose-error-message">
              <AlertCircle size={16} />
              <span>{errors.recipients}</span>
            </div>
          )}
          {errors.invalidEmails && !errors.recipients && (
            <div className="compose-error-message">
              <AlertCircle size={16} />
              <span>{errors.invalidEmails}</span>
            </div>
          )}
        </div>
      )}

      {/* Email Fields */}
      <div className="compose-fields">
        {/* To Field */}
        <div className="compose-field-row">
          <label className="compose-field-label">To</label>
          <div className="compose-field-container">
            <div className={`compose-chips-input ${errors.recipients ? 'error' : ''}`}>
              {to.map((email, i) => (
                <span key={i} className="compose-email-chip">
                  {email}
                  <button
                    type="button"
                    className="compose-remove-chip"
                    onClick={() => removeEmail(email)}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="compose-chip-input"
                placeholder="Recipients (type email and press Enter)"
                disabled={isLoading}
              />
            </div>

            <label className="compose-excel-upload" title="Upload Excel with Email Addresses">
              <FileSpreadsheet size={20} color="#059669" />
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                onChange={handleExcelUpload}
                disabled={isLoading}
              />
            </label>

            <div className="compose-cc-buttons">
              <button 
                onClick={() => setShowCc(!showCc)} 
                className={`compose-cc-btn ${showCc ? 'active' : ''}`} 
                disabled={isLoading}
              >
                Cc
              </button>
              <button 
                onClick={() => setShowBcc(!showBcc)} 
                className={`compose-cc-btn ${showBcc ? 'active' : ''}`} 
                disabled={isLoading}
              >
                Bcc
              </button>
            </div>
          </div>
        </div>

        {/* Error messages */}
        {errors.recipients && (
          <div className="compose-error-message">
            <AlertCircle size={16} />
            <span>{errors.recipients}</span>
          </div>
        )}
        
        {errors.invalidEmails && (
          <div className="compose-error-message">
            <AlertCircle size={16} />
            <span>{errors.invalidEmails}</span>
          </div>
        )}

        {/* Cc Field */}
        {showCc && (
          <div className="compose-field-row">
            <label className="compose-field-label">Cc</label>
            <input
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              className="compose-field-input"
              placeholder="Carbon copy (separate with commas)"
              disabled={isLoading}
            />
          </div>
        )}

        {/* Bcc Field */}
        {showBcc && (
          <div className="compose-field-row">
            <label className="compose-field-label">Bcc</label>
            <input
              type="text"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              className="compose-field-input"
              placeholder="Blind carbon copy (separate with commas)"
              disabled={isLoading}
            />
          </div>
        )}

        {/* Subject Field */}
        <div className="compose-field-row">
          <label className="compose-field-label">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              if (e.target.value.trim()) {
                setErrors(prev => ({ ...prev, subject: undefined }));
              }
            }}
            className={`compose-field-input ${errors.subject ? 'error' : ''}`}
            placeholder="Enter subject"
            disabled={isLoading}
          />
        </div>

        {errors.subject && (
          <div className="compose-error-message">
            <AlertCircle size={16} />
            <span>{errors.subject}</span>
          </div>
        )}

        {/* Recipients Count Display */}
        {to.length > 0 && (
          <div className="compose-field-row">
            <div className="recipients-count">
              📊 Total Recipients: <strong>{to.length}</strong> email addresses
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="compose-content-area">
        <div
          ref={editorRef}
          className={`compose-editor ${errors.content ? 'error' : ''}`}
          contentEditable
          onInput={() => {
            if (editorRef.current?.innerHTML.trim() && editorRef.current.innerHTML !== '<div><br></div>') {
              setErrors(prev => ({ ...prev, content: undefined }));
            }
          }}
          style={{
            fontFamily:
              fontFamily === "Serif"
                ? "Georgia, serif"
                : fontFamily === "Arial"
                ? "Arial, sans-serif"
                : fontFamily === "Times"
                ? "'Times New Roman', serif"
                : "system-ui, sans-serif",
          }}
        />
      </div>

      {errors.content && (
        <div className="compose-error-message">
          <AlertCircle size={16} />
          <span>{errors.content}</span>
        </div>
      )}

      {/* Formatting Toolbar */}
      <div className="compose-formatting-toolbar">
        <div className="compose-toolbar-content">
          {/* ... (toolbar buttons remain the same) ... */}
        </div>
      </div>

      {/* Bottom Toolbar */}
      <div className="compose-bottom-toolbar">
        <div className="compose-toolbar-left">
          <button 
            className="compose-send-button" 
            onClick={handleSendBulkEmail}
            disabled={isLoading}
          >
            {isLoading ? '⏳ Sending...' : 'Send'}
          </button>

          <div className="compose-attachment-buttons">
            <label className="compose-attachment-btn" title="Attach file">
              <Paperclip size={18} />
              <input 
                type="file" 
                style={{ display: "none" }} 
                onChange={handleFileUpload} 
                multiple 
                disabled={isLoading}
              />
            </label>
            <button className="compose-attachment-btn" title="Insert image" onClick={insertImage} disabled={isLoading}>
              <Image size={18} />
            </button>
            <button className="compose-attachment-btn" title="Edit signature" disabled={isLoading}>
              <Edit3 size={18} />
            </button>
          </div>
        </div>

        <button className="compose-delete-btn" title="Delete" disabled={isLoading}>
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;