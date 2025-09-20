import React, { useState, useEffect } from 'react';
import { Inbox, Edit3, Settings, X, AlertCircle, Mail, CheckCircle, XCircle, Loader } from 'lucide-react';
import EmailComposeWindow from './compose';
import './dashboard.css';

// sendBulkEmail function (unchanged, aligned with backend)
const sendBulkEmail = async (formData, setIsLoading, showConfigPopup, isConfigured) => {
  if (!isConfigured) {
    showConfigPopup();
    return { success: false, error: 'Email not configured' };
  }

  if (!formData.get('file')) {
    return { success: false, error: 'Please upload an Excel file with email addresses' };
  }

  if (!formData.get('subject').trim()) {
    return { success: false, error: 'Please enter email subject' };
  }

  if (!formData.get('content').trim() || formData.get('content') === '<div><br></div>') {
    return { success: false, error: 'Please write email content' };
  }

  try {
    setIsLoading(true);

    const response = await fetch('http://localhost:5000/send_bulk', {
      method: 'POST',
      body: formData,
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response. Please check if the endpoint is working.');
    }

    const result = await response.json();

    if (result.success) {
      const results = result.results || {};
      const sentCount = Object.values(results).filter(status => status.includes('sent')).length;
      const failedCount = Object.values(results).filter(status => status.includes('failed')).length;

      return {
        success: true,
        data: result,
        message: `✅ Bulk Email Sent Successfully!\n\n📧 Sent: ${sentCount} emails\n❌ Failed: ${failedCount} emails\n\nCheck details in Inbox for individual results.`,
      };
    } else {
      return {
        success: false,
        error: result.message || 'Failed to send emails',
      };
    }
  } catch (error) {
    console.error('Email sending error:', error);
    if (error.message.includes('Failed to fetch')) {
      return {
        success: false,
        error: 'Cannot connect to server. Please make sure the backend server is running on http://localhost:5000',
      };
    } else if (error.message.includes('non-JSON')) {
      return {
        success: false,
        error: 'Server endpoint not working properly. Please ensure the backend server is running.',
      };
    } else {
      return {
        success: false,
        error: 'Network error: ' + error.message,
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
    { name: 'Configure', icon: Settings },
  ];

  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        const response = await fetch('http://localhost:5000/');
        setIsBackendConnected(response.ok);
      } catch (error) {
        console.error('Backend not available:', error);
        setIsBackendConnected(false);
      }
    };

    checkBackendConnection();
  }, []);

  useEffect(() => {
    const configured = localStorage.getItem('emailConfigured');
    setIsConfigured(configured === 'true');
  }, []);

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
      {!isBackendConnected && (
        <div className="backend-error">
          <AlertCircle size={20} color="#ef4444" />
          <span>Cannot connect to backend server. Please ensure it is running on http://localhost:5000</span>
        </div>
      )}

      {showConfigPopup && (
        <ConfigPopup 
          onConfigure={handleConfigureRedirect}
          onClose={() => setShowConfigPopup(false)} 
        />
      )}

      <div className="main-content">
        <div className="header">
          <div className="header-content">
            <h2 className="page-title">{activeTab}</h2>
          </div>
        </div>
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
          app_password: appPassword,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.verify) {
        setSuccess(data.message || 'Email configured successfully!');
        localStorage.setItem('emailConfigured', 'true');
        localStorage.setItem('userEmail', email);
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
              <p className="text-sm text-gray-600">Enable 2-Step Verification in your <a href="https://myaccount.google.com/security" target="_blank" className="text-blue-600 hover:underline font-medium">Google Account settings</a></p>
            </li>
            <li>
              <strong>Generate App Password</strong><br />
              <p className="text-sm text-gray-600">Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" className="text-blue-600 hover:underline font-medium">App Passwords</a> and generate a new password</p>
            </li>
            <li>
              <strong>Select App & Device</strong><br />
              Select Apps: Mail and Device: Other (BulkEmail)
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

// Updated InboxContent Component
const InboxContent = () => {
  const [recentBulks, setRecentBulks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBulk, setSelectedBulk] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await fetch("http://localhost:5000/recent_bulk");
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        if (data.success) {
          setRecentBulks(data.data || []);
        } else {
          setError('Failed to load campaigns data');
        }
      } catch (err) {
        console.error("Error fetching recent bulk:", err);
        setError('Cannot connect to server. Please ensure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecent();
  }, []);

  if (loading) {
    return (
      <div className="inbox-container">
        <div className="dashboard-center">
          <Loader className="animate-spin" size={40} />
          <p className="loading-text">Loading recent campaigns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inbox-container">
        <div className="error-state">
          <AlertCircle size={48} className="error-icon" />
          <h3 className="error-title">Failed to load campaigns</h3>
          <p className="error-text">{error}</p>
          <button 
            className="retry-button" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (recentBulks.length === 0) {
    return (
      <div className="inbox-container">
        <div className="empty-state">
          <Inbox className="empty-state-icon" size={64} />
          <h3 className="empty-state-title">No campaigns yet</h3>
          <p className="empty-state-text">
            Start sending bulk emails to see your campaign history here.
          </p>
          <button 
            className="cta-button" 
            onClick={() => {
              // This would need to be passed as a prop or use a navigation context
              window.location.href = '#compose';
            }}
          >
            Start Sending
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="inbox-container">
      <div className="dashboard-container">
        <h2 className="dashboard-title">Recent Email Campaigns</h2>

        <div className="campaign-list">
          {recentBulks.map((bulk) => (
            <div
              key={bulk.id || bulk.timestamp}
              className="campaign-card"
              onClick={() => setSelectedBulk(bulk)}
            >
              <div className="campaign-header">
                <Mail className="campaign-icon" />
                <div className="campaign-info">
                  <h3 className="campaign-subject">{bulk.subject || 'Untitled Campaign'}</h3>
                  <p className="campaign-sender">
                    From: <strong>{bulk.sender_email}</strong>
                  </p>
                </div>
              </div>
              <div className="campaign-meta">
                <span className="campaign-date">
                  {new Date(bulk.sent_time || bulk.timestamp).toLocaleString()}
                </span>
                <span className="campaign-recipient-count">
                  {bulk.total_emails || (bulk.success_count + bulk.failed_count)} recipients
                </span>
              </div>
              <div className="campaign-stats">
                <span className="success stat-item">
                  <CheckCircle size={16} /> {bulk.success_count || 0} Sent
                </span>
                <span className="failed stat-item">
                  <XCircle size={16} /> {bulk.failed_count || 0} Failed
                </span>
                <span className={`delivery-rate ${bulk.success_count === 0 ? 'zero-rate' : ''}`}>
                  {(bulk.success_count / (bulk.success_count + bulk.failed_count) * 100 || 0).toFixed(1)}% Delivery
                </span>
              </div>
            </div>
          ))}
        </div>

        {selectedBulk && (
          <DetailsPopup 
            bulk={selectedBulk} 
            onClose={() => setSelectedBulk(null)} 
          />
        )}
      </div>
    </div>
  );
};

// Details Popup Component
const DetailsPopup = ({ bulk, onClose }) => {
  const totalEmails = (bulk.sent_emails?.length || 0) + (bulk.failed_emails?.length || 0);
  const deliveryRate = totalEmails > 0 ? ((bulk.sent_emails?.length || 0) / totalEmails * 100).toFixed(1) : 0;

  return (
    <div className="details-popup-overlay" onClick={onClose}>
      <div className="details-popup" onClick={(e) => e.stopPropagation()}>
        <div className="details-header">
          <h3>📧 {bulk.subject || 'Untitled Campaign'}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="details-content">
          <div className="details-meta">
            <p><strong>Sender:</strong> {bulk.sender_email}</p>
            <p><strong>Date:</strong> {new Date(bulk.sent_time || bulk.timestamp).toLocaleString()}</p>
            <p><strong>Total Recipients:</strong> {totalEmails}</p>
            <p><strong>Delivery Rate:</strong> <span className={`delivery-rate ${deliveryRate === '0.0' ? 'zero-rate' : ''}`}>{deliveryRate}%</span></p>
          </div>

          <div className="details-section">
            <h4>✅ Successfully Sent ({bulk.sent_emails?.length || 0})</h4>
            {bulk.sent_emails && bulk.sent_emails.length > 0 ? (
              <div className="emails-list">
                {bulk.sent_emails.slice(0, 10).map((email, index) => (
                  <div key={index} className="email-item success">
                    <CheckCircle size={14} /> {email}
                  </div>
                ))}
                {bulk.sent_emails.length > 10 && (
                  <p className="more-emails">+{bulk.sent_emails.length - 10} more emails</p>
                )}
              </div>
            ) : (
              <p className="no-emails">No successful deliveries</p>
            )}
          </div>

          <div className="details-section">
            <h4>❌ Failed Deliveries ({bulk.failed_emails?.length || 0})</h4>
            {bulk.failed_emails && bulk.failed_emails.length > 0 ? (
              <div className="emails-list">
                {bulk.failed_emails.slice(0, 10).map((email, index) => (
                  <div key={index} className="email-item failed">
                    <XCircle size={14} /> {email}
                  </div>
                ))}
                {bulk.failed_emails.length > 10 && (
                  <p className="more-emails">+{bulk.failed_emails.length - 10} more emails</p>
                )}
              </div>
            ) : (
              <p className="no-emails">No failed deliveries</p>
            )}
          </div>

          <div className="details-actions">
            <button className="action-btn secondary" onClick={onClose}>
              Close
            </button>
            {bulk.sent_emails && bulk.sent_emails.length > 0 && (
              <button className="action-btn primary" onClick={() => {
                // Export functionality would go here
                console.log('Exporting campaign data:', bulk);
              }}>
                Export Report
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;