import React, { useState, useEffect } from 'react';
import { Inbox as InboxIcon, Edit3, Settings, X, AlertCircle, BarChart3, TrendingUp, Users, Send, MailOpen, Clock, ArrowUp, ArrowDown, PieChart, Calendar, Target, Zap } from 'lucide-react';
import EmailComposeWindow from './compose';
import EmailPageHeaders, { ConfigurationHeader, ComposeHeader, CampaignHeader } from './EmailPageHeaders';
import InboxContent from './inboxContent';
import EmailConfiguration from './EmailConfiguration';
import './inbox.css';

/**
 * Main inbox component managing the email application's navigation and content
 * @component
 * @returns {JSX.Element} Main application interface with navigation and content areas
 */

const Inbox = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [showConfigPopup, setShowConfigPopup] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalCampaigns: 0,
    totalEmails: 0,
    successRate: 0,
    openRate: 0,
    recentActivity: [],
    performanceData: []
  });

  const menuItems = [
    { name: 'Dashboard', icon: BarChart3 },
    { name: 'Campaigns', icon: InboxIcon },
    { name: 'Compose', icon: Edit3 },
    { name: 'Configure', icon: Settings },
  ];

  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        const response = await fetch('http://localhost:5000/');
        setIsBackendConnected(response.ok);
        if (response.ok) {
          fetchDashboardStats();
        }
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

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/recent_bulk');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          calculateStats(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const calculateStats = (bulkData) => {
    const totalCampaigns = bulkData.length;
    let totalEmails = 0;
    let totalSuccess = 0;
    let totalFailed = 0;

    bulkData.forEach(campaign => {
      totalEmails += (campaign.success_count || 0) + (campaign.failed_count || 0);
      totalSuccess += campaign.success_count || 0;
      totalFailed += campaign.failed_count || 0;
    });

    const successRate = totalEmails > 0 ? ((totalSuccess / totalEmails) * 100) : 0;
    const openRate = 65.2; // Simulated open rate data

    // Generate performance data for charts
    const performanceData = bulkData.slice(0, 5).map(campaign => ({
      name: campaign.subject?.substring(0, 12) + '...',
      sent: campaign.success_count || 0,
      failed: campaign.failed_count || 0,
      successRate: campaign.success_count && campaign.failed_count ? 
        Math.round((campaign.success_count / (campaign.success_count + campaign.failed_count)) * 100) : 0
    }));

    setDashboardStats({
      totalCampaigns,
      totalEmails,
      successRate: Math.round(successRate),
      openRate,
      recentActivity: bulkData.slice(0, 4),
      performanceData
    });
  };

  const handleConfigure = (email, password) => {
    setIsConfigured(true);
    localStorage.setItem('emailConfigured', 'true');
    setShowConfigPopup(false);
  };

  const handleConfigureRedirect = () => setActiveTab('Configure');

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

        // Refresh stats after sending
        fetchDashboardStats();

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
        {/* Dashboard Tab - Has its own header */}
        {activeTab === 'Dashboard' && (
          <DashboardView 
            stats={dashboardStats}
            onCompose={() => setActiveTab('Compose')}
            onViewCampaigns={() => setActiveTab('Campaigns')}
          />
        )}
        
        {/* Campaigns Tab */}
        {activeTab === 'Campaigns' && (
          <div className="content content-full">
            <CampaignHeader />
            <InboxContent setActiveTab={setActiveTab} />
          </div>
        )}
        
        {/* Compose Tab */}
        {activeTab === 'Compose' && (
          <div className="content content-full">
            <ComposeHeader />
            <EmailComposeWindow
              isConfigured={isConfigured}
              showConfigPopup={() => setShowConfigPopup(true)}
              sendBulkEmail={sendBulkEmail}
              isLoading={isLoading}
            />
          </div>
        )}
        
        {/* Configure Tab */}
        {activeTab === 'Configure' && (
          <div className="content content-full">
            <ConfigurationHeader />
            <EmailConfiguration onConfigure={handleConfigure} />
          </div>
        )}
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

/**
 * Dashboard view component displaying analytics and statistics
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.stats - Dashboard statistics data
 * @param {Function} props.onCompose - Function to navigate to compose tab
 * @param {Function} props.onViewCampaigns - Function to navigate to campaigns tab
 * @returns {JSX.Element} Dashboard view with charts and metrics
 */
const DashboardView = ({ stats, onCompose, onViewCampaigns }) => {
  return (
    <div className="dashboard-wrapper">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1 className="dashboard-title">
              <BarChart3 className="title-icon" />
              Email Analytics Dashboard
            </h1>
            <p className="dashboard-subtitle">Monitor your email campaign performance</p>
          </div>
          <div className="header-stats">
            <div className="header-stat">
              <span className="stat-label">Active Campaigns</span>
              <span className="stat-value success">{stats.recentActivity.length}</span>
            </div>
            <div className="header-stat">
              <span className="stat-label">Success Rate</span>
              <span className="stat-value success">{stats.successRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          type="primary"
          icon={<Send className="stat-icon" />}
          title="Total Campaigns"
          value={stats.totalCampaigns}
          trend={{ value: 12, positive: true }}
        />
        <StatCard
          type="success"
          icon={<Users className="stat-icon" />}
          title="Emails Sent"
          value={stats.totalEmails.toLocaleString()}
          trend={{ value: 8, positive: true }}
        />
        <StatCard
          type="warning"
          icon={<Target className="stat-icon" />}
          title="Success Rate"
          value={`${stats.successRate}%`}
          trend={{ value: 5, positive: true }}
        />
        <StatCard
          type="info"
          icon={<MailOpen className="stat-icon" />}
          title="Avg. Open Rate"
          value={`${stats.openRate}%`}
          trend={{ value: 3, positive: false }}
        />
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-card large">
          <div className="chart-header">
            <h3 className="chart-title">
              <TrendingUp className="chart-title-icon" />
              Campaign Performance
            </h3>
          </div>
          <PerformanceChart data={stats.performanceData} />
        </div>
        
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <PieChart className="chart-title-icon" />
              Delivery Stats
            </h3>
          </div>
          <DeliveryPieChart stats={stats} />
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="action-activity-section">
        <div className="quick-actions-card">
          <div className="section-header">
            <h3 className="section-title">
              <Zap className="section-icon" />
              Quick Actions
            </h3>
          </div>
          <div className="action-buttons-grid">
            <button className="action-btn primary" onClick={onCompose}>
              <Edit3 size={20} />
              New Campaign
            </button>
            <button className="action-btn secondary" onClick={onViewCampaigns}>
              <InboxIcon size={20} />
              View Campaigns
            </button>
            <button className="action-btn secondary">
              <BarChart3 size={20} />
              Generate Report
            </button>
            <button className="action-btn secondary">
              <Calendar size={20} />
              Schedule Send
            </button>
          </div>
        </div>

        <div className="recent-activity-card">
          <div className="section-header">
            <h3 className="section-title">
              <Clock className="section-icon" />
              Recent Activity
            </h3>
          </div>
          <RecentActivityList activities={stats.recentActivity} />
        </div>
      </div>
    </div>
  );
};

/**
 * Stat card component for displaying individual metrics
 * @component
 * @param {Object} props - Component props
 * @param {string} props.type - Card type (primary, success, warning, info)
 * @param {JSX.Element} props.icon - Icon element
 * @param {string} props.title - Card title
 * @param {string|number} props.value - Stat value
 * @param {Object} props.trend - Trend data with value and direction
 * @returns {JSX.Element} Individual statistic card
 */
const StatCard = ({ type, icon, title, value, trend }) => (
  <div className={`stat-card ${type}`}>
    <div className="stat-card-content">
      <div className="stat-info">
        <h3 className="stat-number">{value}</h3>
        <span className="stat-label">{title}</span>
        <div className={`stat-trend ${trend.positive ? 'positive' : 'negative'}`}>
          {trend.positive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          {trend.value}% from last month
        </div>
      </div>
      <div className={`stat-icon-wrapper ${type}-bg`}>
        {icon}
      </div>
    </div>
  </div>
);

/**
 * Performance chart component displaying campaign performance data
 * @component
 * @param {Object} props - Component props
 * @param {Array} props.data - Performance data array
 * @returns {JSX.Element} Bar chart visualization
 */
const PerformanceChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="empty-chart">
        <BarChart3 size={48} color="#9ca3af" />
        <p>No campaign data available</p>
        <p className="empty-chart-subtitle">Start sending campaigns to see analytics</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.sent + d.failed));

  return (
    <div className="chart-container">
      <div className="bar-chart-vertical">
        {data.map((item, index) => {
          const total = item.sent + item.failed;
          const heightPercentage = maxValue > 0 ? (total / maxValue) * 100 : 0;
          
          return (
            <div key={index} className="bar-chart-item">
              <div className="bar-labels">
                <span className="bar-label">{item.name}</span>
                <span className="bar-value">{total} emails</span>
              </div>
              <div className="bar-track-vertical">
                <div 
                  className="bar-fill-vertical success"
                  style={{ height: `${(item.sent / maxValue) * 100}%` }}
                ></div>
                <div 
                  className="bar-fill-vertical failed"
                  style={{ height: `${(item.failed / maxValue) * 100}%` }}
                ></div>
              </div>
              <div className="bar-stats">
                <span className="success-stat">{item.sent}✓</span>
                <span className="failed-stat">{item.failed}✗</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Delivery pie chart component showing success/failure rates
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.stats - Statistics data for pie chart
 * @returns {JSX.Element} Pie chart visualization
 */
const DeliveryPieChart = ({ stats }) => {
  const total = stats.totalEmails;
  const success = Math.round((stats.successRate / 100) * total);
  const failed = total - success;

  if (total === 0) {
    return (
      <div className="empty-chart">
        <PieChart size={48} color="#9ca3af" />
        <p>No delivery data</p>
      </div>
    );
  }

  const successPercentage = Math.round((success / total) * 100);
  const failedPercentage = 100 - successPercentage;

  return (
    <div className="pie-chart-container">
      <div className="pie-chart-visual">
        <div 
          className="pie-chart" 
          style={{
            background: `conic-gradient(
              #10b981 0% ${successPercentage}%,
              #ef4444 ${successPercentage}% 100%
            )`
          }}
        ></div>
      </div>
      <div className="pie-legend">
        <div className="legend-item">
          <div className="legend-color success"></div>
          <span className="legend-label">Successful</span>
          <span className="legend-value">{successPercentage}%</span>
        </div>
        <div className="legend-item">
          <div className="legend-color failed"></div>
          <span className="legend-label">Failed</span>
          <span className="legend-value">{failedPercentage}%</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Recent activity list component
 * @component
 * @param {Object} props - Component props
 * @param {Array} props.activities - Array of recent activities
 * @returns {JSX.Element} List of recent activities
 */
const RecentActivityList = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="empty-activity">
        <InboxIcon size={32} color="#9ca3af" />
        <p>No recent activity</p>
        <p className="empty-activity-subtitle">Your campaigns will appear here</p>
      </div>
    );
  }

  return (
    <div className="activity-list">
      {activities.map((activity, index) => (
        <div key={index} className="activity-item">
          <div className="activity-icon-wrapper">
            <Send size={16} />
          </div>
          <div className="activity-content">
            <div className="activity-title">{activity.subject || 'Untitled Campaign'}</div>
            <div className="activity-meta">
              <span className="activity-date">
                {new Date(activity.sent_time || activity.timestamp).toLocaleDateString()}
              </span>
              <span className="activity-stats">
                {activity.success_count || 0} sent • {activity.failed_count || 0} failed
              </span>
            </div>
          </div>
          <div className={`activity-status ${(activity.success_count || 0) > (activity.failed_count || 0) ? 'success' : 'warning'}`}>
            {(activity.success_count || 0) > (activity.failed_count || 0) ? '✓' : '⚠'}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Configuration popup component
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.onConfigure - Function to handle configuration
 * @param {Function} props.onClose - Function to close popup
 * @returns {JSX.Element} Configuration prompt popup
 */
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