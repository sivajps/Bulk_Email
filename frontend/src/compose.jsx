import React, { useState, useRef } from 'react';
import { FileSpreadsheet, Paperclip, Clock, Trash2, Send, AlertCircle, Image, Edit3 } from 'lucide-react';
import './compose.css';

const EmailComposeWindow = ({ isConfigured, showConfigPopup, sendBulkEmail }) => {
  const [excelFile, setExcelFile] = useState(null);
  const [subject, setSubject] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [signature, setSignature] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const editorRef = useRef(null);

  const validateForm = () => {
    const newErrors = {};

    if (!excelFile) {
      newErrors.excelFile = 'Please upload an Excel file with email addresses';
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

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!validExtensions.includes(fileExtension)) {
      setErrors(prev => ({ ...prev, excelFile: 'Please upload a valid Excel file (.xlsx, .xls) or CSV file' }));
      return;
    }

    setExcelFile(file);
    setErrors(prev => ({ ...prev, excelFile: undefined }));
  };

  const handleAttachmentUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment(file);
      alert(`File "${file.name}" attached successfully!`);
    }
  };

  const handleSendBulkEmail = async () => {
    if (!validateForm()) {
      return;
    }

    const formData = new FormData();
    formData.append('file', excelFile);
    formData.append('subject', subject);
    const contentWithSignature = `${editorRef.current.innerHTML}<br><br>${signature}`;
    formData.append('content', contentWithSignature);
    if (cc) formData.append('cc', cc);
    if (bcc) formData.append('bcc', bcc);
    if (attachment) formData.append('attachment', attachment);

    const result = await sendBulkEmail(formData, setIsLoading, showConfigPopup, isConfigured);

    if (result.success) {
      alert(result.message);
      setExcelFile(null);
      setSubject('');
      setCc('');
      setBcc('');
      setAttachment(null);
      setShowCc(false);
      setShowBcc(false);
      setErrors({});
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    } else {
      alert('' + result.error);
    }
  };

  const scheduleSend = () => {
    if (!validateForm()) {
      return;
    }

    alert('Email scheduled to be sent in 5 seconds!');
    setTimeout(() => {
      handleSendBulkEmail();
    }, 5000);
  };

  const insertImage = () => {
    const url = prompt('Enter the image URL:');
    if (url) document.execCommand('insertImage', false, url);
  };

  const applyFormatting = (command) => {
    document.execCommand(command, false, null);
    editorRef.current.focus();
  };

  const editSignature = () => {
    const newSignature = prompt('Enter your email signature:', signature);
    if (newSignature !== null) {
      setSignature(newSignature);
    }
  };

  return (
    <div className="email-compose-container">
      {isLoading && (
        <div className="loading-overlay">
          Processing... Please wait
        </div>
      )}

      {(errors.excelFile || errors.subject || errors.content) && (
        <div className="compose-error-container">
          {errors.excelFile && (
            <div className="compose-error-message">
              <AlertCircle size={16} />
              <span>{errors.excelFile}</span>
            </div>
          )}
          {errors.subject && (
            <div className="compose-error-message">
              <AlertCircle size={16} />
              <span>{errors.subject}</span>
            </div>
          )}
          {errors.content && (
            <div className="compose-error-message">
              <AlertCircle size={16} />
              <span>{errors.content}</span>
            </div>
          )}
        </div>
      )}

      <div className="compose-fields">
        <div className="field-row">
          <label className="field-label">Recipients <span className="required">*</span></label>
          <div className="field-input-container">
            <label className="excel-upload" title="Upload Excel with Email Addresses">
              <FileSpreadsheet className="excel-icon" size={20} color="#059669" />
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={handleExcelUpload}
                disabled={isLoading}
              />
              <span>{excelFile ? excelFile.name : 'Upload Excel File'}</span>
            </label>

            <div className="cc-bcc-buttons">
              <button
                onClick={() => setShowCc(!showCc)}
                className={`cc-bcc-button ${showCc ? 'active' : ''}`}
                disabled={isLoading}
              >
                Cc
              </button>
              <button
                onClick={() => setShowBcc(!showBcc)}
                className={`cc-bcc-button ${showBcc ? 'active' : ''}`}
                disabled={isLoading}
              >
                Bcc
              </button>
            </div>
          </div>
        </div>

        {showCc && (
          <div className="field-row">
            <label className="field-label">Cc</label>
            <input
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              className="field-input full-width"
              placeholder="Carbon copy (separate with commas)"
              disabled={isLoading}
            />
          </div>
        )}

        {showBcc && (
          <div className="field-row">
            <label className="field-label">Bcc</label>
            <input
              type="text"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              className="field-input full-width"
              placeholder="Blind carbon copy (separate with commas)"
              disabled={isLoading}
            />
          </div>
        )}

        <div className="field-row subject-row">
          <label className="field-label">Subject <span className="required">*</span></label>
          <input
            type="text"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              if (e.target.value.trim()) {
                setErrors(prev => ({ ...prev, subject: undefined }));
              }
            }}
            className={`field-input full-width ${errors.subject ? 'error' : ''}`}
            placeholder="Enter subject"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="formatting-toolbar">
        <div className="toolbar-content">
          <div className="toolbar-group">
            <button
              onClick={() => applyFormatting('bold')}
              className="toolbar-button"
              title="Bold"
              disabled={isLoading}
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => applyFormatting('italic')}
              className="toolbar-button"
              title="Italic"
              disabled={isLoading}
            >
              <em>I</em>
            </button>
            <button
              onClick={() => applyFormatting('underline')}
              className="toolbar-button"
              title="Underline"
              disabled={isLoading}
            >
              <u>U</u>
            </button>
          </div>
          <button
            onClick={insertImage}
            className="toolbar-button"
            title="Insert image"
            disabled={isLoading}
          >
            <Image size={18} />
          </button>
        </div>
      </div>

      <div className="content-area">
        <div
          ref={editorRef}
          className={`content-editable ${errors.content ? 'error' : ''}`}
          contentEditable
          placeholder="Write your email content here..."
          onInput={() => {
            if (editorRef.current?.innerHTML.trim() && editorRef.current.innerHTML !== '<div><br></div>') {
              setErrors(prev => ({ ...prev, content: undefined }));
            }
          }}
        />
      </div>

      <div className="bottom-toolbar">
        <div className="toolbar-left">
          <button
            onClick={handleSendBulkEmail}
            className="send-button"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
          <button
            onClick={scheduleSend}
            className="send-button"
            disabled={isLoading}
          >
            Schedule Send
          </button>
          <div className="insert-buttons">
            <label className="toolbar-button" title="Attach file">
              <Paperclip size={18} />
              <input
                type="file"
                style={{ display: 'none' }}
                onChange={handleAttachmentUpload}
                disabled={isLoading}
              />
            </label>
            <button
              onClick={editSignature}
              className="toolbar-button"
              title="Edit signature"
              disabled={isLoading}
            >
              <Edit3 size={18} />
            </button>
          </div>
        </div>
        <button
          className="delete-button"
          title="Delete"
          disabled={isLoading}
          onClick={() => {
            setExcelFile(null);
            setSubject('');
            setCc('');
            setBcc('');
            setAttachment(null);
            setErrors({});
            if (editorRef.current) editorRef.current.innerHTML = '';
          }}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default EmailComposeWindow;