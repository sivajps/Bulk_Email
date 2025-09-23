import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import './dashboard.css';

const EmailDashboard = () => {
  const [stats, setStats] = useState({
    sent: 12866,
    failed: 123,
    sending: 38,
    performance: 79,
    trend: 5
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        sending: prev.sending + Math.floor(Math.random() * 3) - 1,
        sent: prev.sent + Math.floor(Math.random() * 10),
        performance: Math.min(100, Math.max(0, prev.performance + Math.floor(Math.random() * 3) - 1))
      }));
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const total = stats.sent + stats.failed + stats.sending;

  // Simulated trend data for the line chart (30 days, wavy pattern)
  const trendData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    value: total + 500 * Math.sin(i * 0.3) // Adjusted to match total scale
  }));

  return (
    <div className="email-dashboard">
      <header className="dashboard-header">
        <h1>Email Performance Dashboard</h1>
        <div className="time-filter">
          <select defaultValue="30">
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
      </header>
      
      <div className="dashboard-content">
        <div className="performance-card">
          <div className="card-header">
            <h2>Email Performance</h2>
            <div className="trend-indicator">
              <i className="fas fa-arrow-up"></i>
              <span>+{stats.trend}%</span>
            </div>
          </div>
          <div className="performance-circle">
            <div className="circle-progress">
              <div 
                className="progress-bar" 
                style={{ '--progress': `${stats.performance}%` }}
              ></div>
              <div className="progress-text">
                <span className="percentage">{stats.performance}%</span>
                <span className="label">Success Rate</span>
              </div>
            </div>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{stats.sent.toLocaleString()}</div>
              <div className="stat-label">
                <span className="dot sent"></span>
                Sent
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.failed}</div>
              <div className="stat-label">
                <span className="dot failed"></span>
                Failed
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.sending}</div>
              <div className="stat-label">
                <span className="dot sending"></span>
                Sending
              </div>
            </div>
          </div>
          <div className="trend-footer">
            Last 30 Days <span className="trend-up">↑+{stats.trend}%</span>
          </div>
        </div>

        <div className="delivery-card">
          <div className="card-header">
            <h2>Delivery Status</h2>
          </div>
          <div className="total-deliveries">
            <span className="total-number">{total.toLocaleString()}</span>
            <span className="total-label">Total</span>
          </div>
          <div className="delivery-breakdown">
            <div className="delivery-item">
              <div className="delivery-info">
                <span className="dot sent"></span>
                <span className="delivery-label">Sent</span>
              </div>
              <div className="delivery-count">{stats.sent.toLocaleString()}</div>
            </div>
            <div className="delivery-item">
              <div className="delivery-info">
                <span className="dot failed"></span>
                <span className="delivery-label">Failed</span>
              </div>
              <div className="delivery-count">{stats.failed}</div>
            </div>
            <div className="delivery-item">
              <div className="delivery-info">
                <span className="dot sending"></span>
                <span className="delivery-label">Sending</span>
              </div>
              <div className="delivery-count">{stats.sending}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="trend-chart-card">
        <div className="card-header">
          <h2>Email Performance Trend</h2>
          <span>Last 30 Days</span>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
            <XAxis dataKey="day" hide={true} />
            <YAxis hide={true} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#6a5acd" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EmailDashboard;