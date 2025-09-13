import React, { useState, useRef } from 'react';
import { Home, Inbox, Edit3, Undo2, Redo2, Bold, Italic, Underline, AlignLeft, List, FileSpreadsheet, ListOrdered, Indent, Outdent, Quote, Link2, Image, Clock, Trash2, Paperclip } from 'lucide-react';
import './dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Home');

  const menuItems = [
    { name: 'Home', icon: Home },
    { name: 'Inbox', icon: Inbox },
    { name: 'Compose', icon: Edit3 }
  ];

  const StatusCard = ({ icon, title, count, colorClass }) => (
    <div className="status-card">
      <div className="status-header">
        <div className={`status-icon ${colorClass}`}>
          {icon}
        </div>
        <span className="status-title">{title}</span>
      </div>
      <div className="status-count">{count}</div>
    </div>
  );

  return (
    <div className="dashboard">
      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <div className="header-content">
            <h2 className="page-title">{activeTab}</h2>
          </div>
        </div>

        {/* Content */}
        <div className={`content ${activeTab === 'Compose' ? 'content-full' : 'content-padded'}`}>
          {activeTab === 'Home' && (
            <div className="status-grid">
              <StatusCard
                icon={<div className="status-dot status-dot-green"></div>}
                title="Sent"
                count="120"
                colorClass="status-icon-green"
              />
              <StatusCard
                icon={<div className="status-dot status-dot-red"></div>}
                title="Failed"
                count="5"
                colorClass="status-icon-red"
              />
              <StatusCard
                icon={<div className="status-dot status-dot-yellow"></div>}
                title="Sending"
                count="2"
                colorClass="status-icon-yellow"
              />
            </div>
          )}

          {activeTab === 'Inbox' && (
            <div className="empty-state">
              <Inbox className="empty-state-icon" />
              <h3 className="empty-state-title">Inbox</h3>
              <p className="empty-state-text">Your messages will appear here.</p>
            </div>
          )}

          {activeTab === 'Compose' && <EmailComposeWindow />}
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

// Email Compose Component
const EmailComposeWindow = () => {
  const [to, setTo] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [fontFamily, setFontFamily] = useState("Sans Serif");
  const [isLoading, setIsLoading] = useState(false);
  const editorRef = useRef(null);

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
      if (email && email.includes("@") && !to.includes(email)) {
        setTo([...to, email]);
      }
      setInputValue("");
    }
  };

  const removeEmail = (email) => {
    setTo(to.filter((e) => e !== email));
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/upload-excel', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        setTo(prevTo => [...new Set([...prevTo, ...result.emails])]);
        alert(`✅ Successfully imported ${result.count} email addresses from Excel file!`);
      } else {
        alert('❌ Error reading Excel file: ' + result.error);
      }
    } catch (error) {
      alert('❌ Upload error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const sendBulkEmail = async () => {
    if (to.length === 0) {
      alert('⚠️ Please add recipients or upload Excel file with email addresses');
      return;
    }

    if (!subject.trim()) {
      alert('⚠️ Please enter email subject');
      return;
    }

    if (!editorRef.current.innerHTML.trim() || editorRef.current.innerHTML === '<div><br></div>') {
      alert('⚠️ Please write email content');
      return;
    }

    try {
      setIsLoading(true);
      
      const emailData = {
        to: to,
        cc: cc || '',
        bcc: bcc || '',
        subject: subject,
        content: editorRef.current.innerHTML
      };

      const response = await fetch('http://localhost:5000/api/send-bulk-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Bulk Email Sent Successfully!\n\n📧 Sent: ${result.sent_count} emails\n❌ Failed: ${result.failed_count} emails\n\nDetails: ${result.message}`);
        
        setTo([]);
        setSubject('');
        setCc('');
        setBcc('');
        setShowCc(false);
        setShowBcc(false);
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
        }
      } else {
        alert('❌ Error sending emails: ' + result.error);
      }
    } catch (error) {
      alert('❌ Network error: ' + error.message);
    } finally {
      setIsLoading(false);
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
      alert('⚠️ Please add recipients first');
      return;
    }
    
    alert("⏰ Email scheduled to be sent in 5 seconds!");
    setTimeout(() => {
      sendBulkEmail();
    }, 5000);
  };

  return (
    <div className="email-compose-container">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          📧 Processing... Please wait
        </div>
      )}

      {/* Email Fields */}
      <div className="compose-fields">
        {/* To Field */}
        <div className="compose-field-row">
          <label className="compose-field-label">To</label>
          <div className="compose-field-container">
            <div className="compose-chips-input">
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
                placeholder="Recipients"
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
            onChange={(e) => setSubject(e.target.value)}
            className="compose-field-input"
            placeholder="Enter subject"
            disabled={isLoading}
          />
        </div>

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
          className="compose-editor"
          contentEditable
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

      {/* Formatting Toolbar */}
      <div className="compose-formatting-toolbar">
        <div className="compose-toolbar-content">
          <button className="compose-toolbar-btn" onClick={() => execCommand("undo")} disabled={isLoading}>
            <Undo2 size={16} />
          </button>
          <button className="compose-toolbar-btn" onClick={() => execCommand("redo")} disabled={isLoading}>
            <Redo2 size={16} />
          </button>

          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="compose-font-selector"
            disabled={isLoading}
          >
            <option>Sans Serif</option>
            <option>Serif</option>
            <option>Arial</option>
            <option>Times</option>
          </select>

          <button className="compose-toolbar-btn" onClick={() => execCommand("bold")} disabled={isLoading}>
            <Bold size={16} />
          </button>
          <button className="compose-toolbar-btn" onClick={() => execCommand("italic")} disabled={isLoading}>
            <Italic size={16} />
          </button>
          <button className="compose-toolbar-btn" onClick={() => execCommand("underline")} disabled={isLoading}>
            <Underline size={16} />
          </button>

          <button className="compose-toolbar-btn" onClick={() => execCommand("justifyLeft")} disabled={isLoading}>
            <AlignLeft size={16} />
          </button>
          <button className="compose-toolbar-btn" onClick={() => execCommand("insertUnorderedList")} disabled={isLoading}>
            <List size={16} />
          </button>
          <button className="compose-toolbar-btn" onClick={() => execCommand("insertOrderedList")} disabled={isLoading}>
            <ListOrdered size={16} />
          </button>
          <button className="compose-toolbar-btn" onClick={() => execCommand("outdent")} disabled={isLoading}>
            <Outdent size={16} />
          </button>
          <button className="compose-toolbar-btn" onClick={() => execCommand("indent")} disabled={isLoading}>
            <Indent size={16} />
          </button>
          <button className="compose-toolbar-btn" onClick={() => execCommand("formatBlock", "blockquote")} disabled={isLoading}>
            <Quote size={16} />
          </button>

          <button className="compose-toolbar-btn" onClick={insertLink} disabled={isLoading}>
            <Link2 size={16} />
          </button>
          <button className="compose-toolbar-btn" onClick={scheduleSend} disabled={isLoading}>
            <Clock size={16} />
          </button>
        </div>
      </div>

      {/* Bottom Toolbar */}
      <div className="compose-bottom-toolbar">
        <div className="compose-toolbar-left">
          <button 
            className="compose-send-button" 
            onClick={sendBulkEmail}
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