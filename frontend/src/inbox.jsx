import React, { useState, useEffect } from 'react';
import { Inbox as InboxIcon, Edit3, Settings, X, AlertCircle } from 'lucide-react';
import EmailComposeWindow from './compose';
import InboxContent from './inboxContent';
import EmailConfiguration from './EmailConfiguration';
import './inbox.css';

const Inbox = () => {
  const [activeTab, setActiveTab] = useState('Inbox');
  const [showConfigPopup, setShowConfigPopup] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const menuItems = [
    { name: 'Inbox', icon: InboxIcon },
    { name: 'Compose', icon: Edit3 },
    { name: 'Configure', icon: Settings },
  ];

  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        const response = await fetch('http://localhost:5000/');
        setIsBackendConnected(response.ok);
      } catch {
        setIsBackendConnected(false);
      }
    };
    checkBackendConnection();
  }, []);

  useEffect(() => {
    const configured = localStorage.getItem('emailConfigured');
    setIsConfigured(configured === 'true');
  }, []);

  const handleConfigure = (email, password) => {
    setIsConfigured(true);
    localStorage.setItem('emailConfigured', 'true');
    setShowConfigPopup(false);
  };

  const handleConfigureRedirect = () => setActiveTab('Configure');

  // sendBulkEmail function
  const sendBulkEmail = async (formData) => {
    if (!isConfigured) {
      setShowConfigPopup(true);
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
        throw new Error('Server returned non-JSON response');
      }

      const result = await response.json();

      if (result.success) {
        const results = result.results || {};
        const sentCount = Object.values(results).filter(status => status.includes('sent')).length;
        const failedCount = Object.values(results).filter(status => status.includes('failed')).length;

        return {
          success: true,
          message: `✅ Bulk Email Sent Successfully!\n\n📧 Sent: ${sentCount} emails\n❌ Failed: ${failedCount} emails`,
        };
      } else {
        return { success: false, error: result.message || 'Failed to send emails' };
      }
    } catch (error) {
      if (error.message.includes('Failed to fetch')) {
        return { success: false, error: 'Cannot connect to server.' };
      }
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard">
      {!isBackendConnected && (
        <div className="backend-error">
          <AlertCircle size={20} color="#ef4444" />
          <span>Cannot connect to backend server. Please ensure it is running.</span>
        </div>
      )}

      {showConfigPopup && (
        <ConfigPopup 
          onConfigure={handleConfigureRedirect}
          onClose={() => setShowConfigPopup(false)} 
        />
      )}

      <div className="main-content">
        <h2 className="page-title">{activeTab}</h2>
        <div className="content-wrapper">
          <div className={`content ${activeTab !== 'Inbox' ? 'content-full' : 'content-padded'}`}>
            {activeTab === 'Inbox' && <InboxContent setActiveTab={setActiveTab} />}
            {activeTab === 'Compose' && (
              <EmailComposeWindow
                isConfigured={isConfigured}
                showConfigPopup={() => setShowConfigPopup(true)}
                sendBulkEmail={sendBulkEmail}
                isLoading={isLoading}
              />
            )}
            {activeTab === 'Configure' && <EmailConfiguration onConfigure={handleConfigure} />}
          </div>
        </div>
      </div>

      <footer className="footer-nav">
        <nav className="footer-nav-container">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`footer-nav-item ${isActive ? 'footer-nav-item-active' : ''}`}
              >
                <Icon className="footer-nav-icon" />
                <span className="footer-nav-text">{item.name}</span>
              </button>
            );
          })}
        </nav>
      </footer>
    </div>
  );
};

const ConfigPopup = ({ onConfigure, onClose }) => (
  <div className="config-popup-overlay">
    <div className="config-popup-simple">
      <div className="config-popup-header">
        <h2>Configure Your Email</h2>
        <button className="config-popup-close" onClick={onClose}><X size={20} /></button>
      </div>
      <div className="config-popup-content-simple">
        <p>You need to configure your email before sending messages.</p>
        <button className="config-button-simple" onClick={onConfigure}>
          Go to Configuration
        </button>
      </div>
    </div>
  </div>
);

export default Inbox;
