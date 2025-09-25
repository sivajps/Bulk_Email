import React, { useState, useEffect } from 'react';
import { Inbox, Edit3, Settings, X, AlertCircle, Mail, CheckCircle, XCircle, Loader } from 'lucide-react';
import './EmailConfiguration.css';

/**
 * Component for configuring email settings and app passwords
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.onConfigure - Callback function when configuration is successful
 * @returns {JSX.Element} Email configuration form interface
 */

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

export default EmailConfiguration;