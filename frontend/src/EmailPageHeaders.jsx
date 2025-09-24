import React from 'react';
import { Mail, Settings, Target, BarChart3, Users, Send, CheckCircle } from 'lucide-react';

// Header component for Email Configuration page
const ConfigurationHeader = () => {
  return (
    <div className="page-header configuration-header">
      <div className="header-content">
        <div className="header-icon-title">
          <Settings className="header-icon" />
          <div className="header-text">
            <h1 className="header-title">Email Configuration</h1>
            <p className="header-subtitle">Set up your email account for bulk sending</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Header component for Compose Email page
const ComposeHeader = () => {
  return (
    <div className="page-header compose-header">
      <div className="header-content">
        <div className="header-icon-title">
          <Mail className="header-icon" />
          <div className="header-text">
            <h1 className="header-title">Compose Email</h1>
            <p className="header-subtitle">Create and send your email campaigns</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Header component for Campaign Management page
const CampaignHeader = () => {
  return (
    <div className="page-header campaign-header">
      <div className="header-content">
        <div className="header-icon-title">
          <Target className="header-icon" />
          <div className="header-text">
            <h1 className="header-title">Campaign Management</h1>
            <p className="header-subtitle">Track and manage your email campaigns</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export individual components for use in other files
export { ConfigurationHeader, ComposeHeader, CampaignHeader };

// Export the demo component as default
export default { ConfigurationHeader, ComposeHeader, CampaignHeader };