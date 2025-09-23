import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FileSpreadsheet, Paperclip, Clock, Send, AlertCircle, Edit3, CheckCircle } from 'lucide-react';
import './compose.css';

const EmailComposeWindow = ({ isConfigured, showConfigPopup, sendBulkEmail }) => {
  const [excelFile, setExcelFile] = useState(null);
  const [subject, setSubject] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [signature, setSignature] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const editorRef = useRef(null);
  const excelFileInputRef = useRef(null);
  const attachmentInputRef = useRef(null);

  // Clear success messages after 3 seconds
  useEffect(() => {
    if (errors.successMessage) {
      const timer = setTimeout(() => {
        setErrors(prev => ({ ...prev, successMessage: undefined }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errors.successMessage]);

  // Function to convert HTML to plain text while preserving all whitespace and line breaks
  const htmlToPlainText = (html) => {
    if (!html || typeof html !== 'string') return '';
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    let text = tempDiv.textContent || tempDiv.innerText || '';
    // Preserve line breaks and spaces
    text = text.replace(/(\r\n|\n|\r)/gm, ''); // Remove existing newlines
    text = text.replace(/<(p|div|br)[^>]*>/gi, '\n'); // Add newlines for block tags
    text = text.replace(/<\/(p|div)>/gi, '\n'); // Add newlines for closing block tags
    text = text.replace(/<[^>]+>/g, ''); // Remove remaining HTML tags
    text = text.replace(/\u00A0/g, ' '); // Replace non-breaking spaces with regular spaces
    // Preserve multiple spaces and single newlines
    text = text.replace(/\n\s*\n+/g, '\n'); // Collapse multiple newlines to single
    return text; // Do not trim to preserve leading/trailing spaces
  };

  // Initialize contentEditable
  useEffect(() => {
    if (editorRef.current && !isLoading) {
      editorRef.current.focus();
    }
  }, [isLoading]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!excelFile) {
      newErrors.excelFile = 'Please upload an Excel file with email addresses';
    }

    if (!subject.trim()) {
      newErrors.subject = 'Please enter email subject';
    }

    const contentHTML = editorRef.current?.innerHTML || '';
    const contentText = htmlToPlainText(contentHTML);
    
    if (!contentText || contentHTML === '<div><br></div>' || contentHTML === '<p><br></p>') {
      newErrors.content = 'Please write email content';
    }

    if (attachments.length > 5) {
      newErrors.attachments = 'Cannot attach more than 5 files';
    }

    const maxSize = 10 * 1024 * 1024; // 10MB per file
    attachments.forEach((file, index) => {
      if (file.size > maxSize) {
        newErrors.attachments = newErrors.attachments || [];
        newErrors.attachments.push(`File "${file.name}" exceeds 10MB limit`);
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Excel upload handler
  const handleExcelUpload = (e) => {
    e.stopPropagation();
    const file = e.target.files[0];
    if (!file) return;

    e.target.value = '';
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!validExtensions.includes(fileExtension)) {
      setErrors(prev => ({ ...prev, excelFile: 'Please upload a valid Excel file (.xlsx, .xls) or CSV file' }));
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, excelFile: 'File size must be less than 10MB' }));
      return;
    }

    setExcelFile(file);
    setErrors(prev => ({ ...prev, excelFile: undefined }));
  };

  const triggerExcelUpload = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading || !excelFileInputRef.current) return;
    excelFileInputRef.current.click();
  }, [isLoading]);

  // Attachment upload handler
  const handleAttachmentUpload = (e) => {
    e.stopPropagation();
    const files = Array.from(e.target.files);
    if (!files.length) return;

    e.target.value = '';
    const validExtensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.zip'];
    const maxSize = 10 * 1024 * 1024; // 10MB per file
    const maxFiles = 5; // Max number of attachments

    const newAttachments = [];
    const attachmentErrors = [];

    files.forEach((file) => {
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!validExtensions.includes(fileExtension)) {
        attachmentErrors.push(`File "${file.name}" has an unsupported extension`);
        return;
      }

      if (file.size > maxSize) {
        attachmentErrors.push(`File "${file.name}" exceeds 10MB limit`);
        return;
      }

      if (newAttachments.length + attachments.length >= maxFiles) {
        attachmentErrors.push('Cannot attach more than 5 files');
        return;
      }

      newAttachments.push(file);
    });

    if (attachmentErrors.length > 0) {
      setErrors(prev => ({ ...prev, attachments: attachmentErrors }));
      return;
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    setErrors(prev => ({
      ...prev,
      attachments: undefined,
      successMessage: `Attached ${newAttachments.length} file(s) successfully`,
    }));
  };

  const triggerAttachmentUpload = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading || !attachmentInputRef.current) return;
    attachmentInputRef.current.click();
  }, [isLoading]);

  // Remove specific attachment
  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setErrors(prev => ({
      ...prev,
      attachments: undefined,
      successMessage: 'Attachment removed',
    }));
  };

  // Send bulk email handler
  const handleSendBulkEmail = async () => {
    if (!validateForm()) {
      return;
    }

    const formData = new FormData();
    formData.append('file', excelFile);
    formData.append('subject', subject);
    
    let contentHTML = editorRef.current?.innerHTML || '';
    // Wrap content in <pre> to preserve whitespace in HTML
    contentHTML = `<pre style="white-space: pre-wrap;">${contentHTML}</pre>`;
    contentHTML = contentHTML
      .replace(/<div><br><\/div>/g, '<br>')
      .replace(/<div><\/div>/g, '')
      .replace(/<p><br><\/p>/g, '')
      .replace(/<br><br><br>/g, '<br><br>')
      .trim();
    
    let contentText = htmlToPlainText(contentHTML);
    if (contentText && signature.trim()) {
      contentText += `\n\n---\n${signature}`;
      contentHTML += `<br><br>---<br><pre style="white-space: pre-wrap;">${signature.replace(/\n/g, '<br>')}</pre>`;
    } else if (signature.trim()) {
      contentText = signature;
      contentHTML = `<pre style="white-space: pre-wrap;">${signature.replace(/\n/g, '<br>')}</pre>`;
    }
    
    formData.append('content', contentText);
    formData.append('contentHTML', contentHTML);
    
    if (cc) formData.append('cc', cc);
    if (bcc) formData.append('bcc', bcc);
    attachments.forEach((file, index) => {
      formData.append(`attachment${index}`, file);
    });

    const result = await sendBulkEmail(formData, setIsLoading, showConfigPopup, isConfigured);

    if (result.success) {
      setErrors(prev => ({
        ...prev,
        successMessage: result.message,
      }));
      setExcelFile(null);
      setSubject('');
      setCc('');
      setBcc('');
      setAttachments([]);
      setShowCc(false);
      setShowBcc(false);
      setErrors(prev => ({ ...prev, excelFile: undefined, subject: undefined, content: undefined }));
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    } else {
      setErrors(prev => ({ ...prev, errorMessage: result.error }));
    }
  };

  // Schedule send
  const scheduleSend = () => {
    if (!validateForm()) {
      return;
    }

    setErrors(prev => ({ ...prev, successMessage: 'Email scheduled to be sent in 5 seconds' }));
    setTimeout(() => {
      handleSendBulkEmail();
    }, 5000);
  };

  // Formatting function
  const applyFormatting = (command) => {
    if (!editorRef.current || isLoading) return;
    try {
      editorRef.current.focus();
      if (typeof document.execCommand !== 'function') {
        throw new Error('execCommand not available');
      }
      
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) {
          const formattedSpan = document.createElement('span');
          formattedSpan.style.cssText = 
            command === 'bold' ? 'font-weight: bold;' :
            command === 'italic' ? 'font-style: italic;' :
            command === 'underline' ? 'text-decoration: underline;' : '';
          
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          range.insertNode(formattedSpan);
          range.setStart(formattedSpan, 0);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          
          formattedSpan.focus();
        } else {
          const hasSelection = !selection.getRangeAt(0).collapsed;
          if (hasSelection) {
            document.execCommand(command, false, null);
          } else {
            const range = selection.getRangeAt(0);
            const formattedSpan = document.createElement('span');
            formattedSpan.style.cssText = 
              command === 'bold' ? 'font-weight: bold;' :
              command === 'italic' ? 'font-style: italic;' :
              command === 'underline' ? 'text-decoration: underline;' : '';
            
            range.insertNode(formattedSpan);
            range.setStart(formattedSpan, 0);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
        
        editorRef.current.focus();
      }, 50);
    } catch (error) {
      console.error('Formatting error:', error);
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const hasSelection = !range.collapsed;
        
        if (hasSelection) {
          range.surroundContents(
            command === 'bold' ? document.createElement('strong') :
            command === 'italic' ? document.createElement('em') :
            command === 'underline' ? document.createElement('u') : document.createElement('span')
          );
        } else {
          const formattedSpan = document.createElement(
            command === 'bold' ? 'strong' :
            command === 'italic' ? 'em' :
            command === 'underline' ? 'u' : 'span'
          );
          
          if (command === 'bold') formattedSpan.style.fontWeight = 'bold';
          if (command === 'italic') formattedSpan.style.fontStyle = 'italic';
          if (command === 'underline') formattedSpan.style.textDecoration = 'underline';
          
          range.insertNode(formattedSpan);
          range.setStart(formattedSpan, 0);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
  };

  // Edit signature
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

      {(errors.excelFile || errors.subject || errors.content || errors.attachments || errors.successMessage || errors.errorMessage) && (
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
          {errors.attachments && Array.isArray(errors.attachments) && errors.attachments.map((error, index) => (
            <div key={index} className="compose-error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          ))}
          {errors.attachments && !Array.isArray(errors.attachments) && (
            <div className="compose-error-message">
              <AlertCircle size={16} />
              <span>{errors.attachments}</span>
            </div>
          )}
          {errors.successMessage && (
            <div className="compose-success-message">
              <CheckCircle size={16} />
              <span>{errors.successMessage}</span>
            </div>
          )}
          {errors.errorMessage && (
            <div className="compose-error-message">
              <AlertCircle size={16} />
              <span>{errors.errorMessage}</span>
            </div>
          )}
        </div>
      )}

      <div className="compose-fields">
        <div className="field-row">
          <label className="field-label">Recipients <span className="required">*</span></label>
          <div className="field-input-container">
            <label 
              className={`excel-upload ${isLoading ? 'disabled' : ''}`} 
              title={excelFile ? `Uploaded: ${excelFile.name}` : "Upload Excel with Email Addresses"}
              onClick={triggerExcelUpload}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  triggerExcelUpload(e);
                }
              }}
            >
              <FileSpreadsheet className="excel-icon" size={20} color="#059669" />
              <input
                ref={excelFileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={handleExcelUpload}
                onClick={(e) => e.stopPropagation()}
              />
              <span>{excelFile ? `${excelFile.name}` : 'Upload Excel File'}</span>
              {/* {isLoading && <span className="loading-indicator">⏳</span>} */}
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

        {attachments.length > 0 && (
          <div className="field-row">
            <label className="field-label">Attachments</label>
            <div className="field-input-container attachment-list">
              {attachments.map((file, index) => (
                <div key={index} className="attachment-item">
                  <span className="attachment-name">{file.name}</span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="remove-attachment-button"
                    title="Remove attachment"
                    disabled={isLoading}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="formatting-toolbar">
        <div className="toolbar-content">
          <div className="toolbar-group">
            <button
              onClick={() => applyFormatting('bold')}
              className="toolbar-button"
              title="Bold (select text to format or click to start bold)"
              disabled={isLoading}
              aria-label="Bold text"
            >
              <strong style={{ fontSize: '12px', fontWeight: 'bold' }}>B</strong>
            </button>
            <button
              onClick={() => applyFormatting('italic')}
              className="toolbar-button"
              title="Italic (select text to format or click to start italic)"
              disabled={isLoading}
              aria-label="Italic text"
            >
              <em style={{ fontSize: '12px', fontStyle: 'italic' }}>I</em>
            </button>
            <button
              onClick={() => applyFormatting('underline')}
              className="toolbar-button"
              title="Underline (select text to format or click to start underline)"
              disabled={isLoading}
              aria-label="Underline text"
            >
              <u style={{ fontSize: '12px', textDecoration: 'underline' }}>U</u>
            </button>
          </div>
        </div>
      </div>

      <div className="content-area">
        <div
          ref={editorRef}
          className={`content-editable ${errors.content ? 'error' : ''} ${!isLoading ? 'focused' : ''}`}
          contentEditable={!isLoading}
          suppressContentEditableWarning={true}
          style={{ whiteSpace: 'pre-wrap' }} // Preserve whitespace in editor
          placeholder="Write your email content here..."
          onInput={(e) => {
            const contentHTML = e.currentTarget.innerHTML || '';
            const contentText = htmlToPlainText(contentHTML);
            if (contentText && contentHTML !== '<div><br></div>' && contentHTML !== '<p><br></p>') {
              setErrors(prev => ({ ...prev, content: undefined }));
            }
          }}
          onFocus={(e) => {
            e.currentTarget.classList.add('focused');
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              if (range.collapsed && e.currentTarget.innerHTML === '') {
                range.setStart(e.currentTarget, 0);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
              }
            }
          }}
          onBlur={(e) => {
            e.currentTarget.classList.remove('focused');
            if (e.currentTarget.innerHTML.trim() === '' || e.currentTarget.innerHTML === '<br>' || e.currentTarget.innerHTML === '<p><br></p>') {
              e.currentTarget.innerHTML = '';
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              document.execCommand('insertHTML', false, '<br><br>');
              e.currentTarget.focus();
              return false;
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
            <label 
              className="toolbar-button" 
              title="Attach files"
              onClick={triggerAttachmentUpload}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  triggerAttachmentUpload(e);
                }
              }}
            >
              <Paperclip size={18} />
              <input
                ref={attachmentInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
                style={{ display: 'none' }}
                onChange={handleAttachmentUpload}
                onClick={(e) => e.stopPropagation()}
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
      </div>
    </div>
  );
};

export default EmailComposeWindow;