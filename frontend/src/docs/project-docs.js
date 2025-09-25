/**
 * Bulk Email Sender Application
 * @module BulkEmailSender
 * @description A React-based application for sending bulk emails with campaign management and analytics
 * 
 * @author [Sivabala J]
 * @version 1.0.0
 * @license MIT
 * 
 * @see {@link https://reactjs.org/|React}
 * @see {@link https://lucide.dev/|Lucide Icons}
 * @see {@link https://recharts.org/|Recharts}
 */

/**
 * Application Features:
 * - Bulk email composition and sending
 * - Email campaign management
 * - Performance analytics and dashboard
 * - Email configuration setup
 * - Scheduled email sending
 * - Attachment support
 * 
 * @namespace Components
 * @property {Component} App - Root application component
 * @property {Component} Inbox - Main navigation and content manager
 * @property {Component} EmailComposeWindow - Email composition interface
 * @property {Component} EmailConfiguration - Email setup configuration
 * @property {Component} EmailDashboard - Analytics dashboard
 * @property {Component} InboxContent - Campaign history viewer
 */

/**
 * Data Flow:
 * 1. User configures email credentials via EmailConfiguration
 * 2. User composes emails using EmailComposeWindow
 * 3. Emails are sent via backend API
 * 4. Campaign data is displayed in InboxContent
 * 5. Analytics are shown in EmailDashboard
 * 
 * @typedef {Object} CampaignStats
 * @property {number} totalCampaigns - Total number of campaigns
 * @property {number} totalEmails - Total emails sent
 * @property {number} successRate - Percentage of successful sends
 * @property {number} openRate - Email open rate percentage
 * @property {Array} recentActivity - Recent campaign activities
 * @property {Array} performanceData - Performance metrics data
 */

/**
 * @typedef {Object} BulkEmailData
 * @property {string} id - Campaign unique identifier
 * @property {string} subject - Email subject line
 * @property {string} sender_email - Sender's email address
 * @property {string} sent_time - Timestamp of when email was sent
 * @property {number} success_count - Number of successful sends
 * @property {number} failed_count - Number of failed sends
 * @property {Array} sent_emails - Array of successfully sent emails
 * @property {Array} failed_emails - Array of failed email addresses
 * @property {string} content - Email content (plain text)
 * @property {string} content_html - Email content (HTML format)
 */