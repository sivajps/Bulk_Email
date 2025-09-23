import React, { useState, useEffect } from 'react';
import { Inbox, Edit3, Settings, X, AlertCircle, Mail, CheckCircle, XCircle, Loader } from 'lucide-react';
import './inboxContent.css';

const InboxContent = ({ setActiveTab }) => {
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
            onClick={() => setActiveTab('Compose')}
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

    const DetailsPopup = ({ bulk, onClose }) => {
    const totalEmails = (bulk.sent_emails?.length || 0) + (bulk.failed_emails?.length || 0);

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
            </div>

            <div className="details-section">
                <h4>Email Content</h4>
                {bulk.content_html ? (
                <div
                    className="email-content-preview"
                    style={{
                    border: '1px solid #e5e7eb',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    backgroundColor: '#f9fafb',
                    maxHeight: '300px',
                    overflowY: 'auto'
                    }}
                    dangerouslySetInnerHTML={{ __html: bulk.content_html }}
                />
                ) : bulk.content ? (
                <pre
                    className="email-content-preview"
                    style={{
                    border: '1px solid #e5e7eb',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    backgroundColor: '#f9fafb',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '300px',
                    overflowY: 'auto'
                    }}
                >
                    {bulk.content}
                </pre>
                ) : (
                <p className="no-content">No content available</p>
                )}
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
            </div>
            </div>
        </div>
        </div>
    );
    };


export default InboxContent;