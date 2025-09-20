import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FileSpreadsheet, Paperclip, Clock, Send, AlertCircle, Image, Edit3 } from 'lucide-react';
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
  const excelFileInputRef = useRef(null);
  const attachmentInputRef = useRef(null);

  // FIXED: Function to convert HTML to plain text
  const htmlToPlainText = (html) => {
    if (!html || typeof html !== 'string') return '';

    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Remove all HTML tags
    let text = tempDiv.textContent || tempDiv.innerText || '';
    
    // Clean up extra whitespace and line breaks
    text = text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/^\s+|\s+$/g, '') // Trim leading/trailing spaces
      .trim();
    
    return text;
  };

  // FIXED: Initialize contentEditable
  useEffect(() => {
    if (editorRef.current && !isLoading) {
      editorRef.current.focus();
    }
  }, [isLoading]);

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // FIXED: Prevent double upload by stopping event propagation
  const handleExcelUpload = (e) => {
    e.stopPropagation(); // FIXED: Prevent double trigger
    const file = e.target.files[0];
    if (!file) return;

    // Reset the input value to allow same file to be selected again
    e.target.value = '';

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!validExtensions.includes(fileExtension)) {
      setErrors(prev => ({ ...prev, excelFile: 'Please upload a valid Excel file (.xlsx, .xls) or CSV file' }));
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, excelFile: 'File size must be less than 10MB' }));
      return;
    }

    setExcelFile(file);
    setErrors(prev => ({ ...prev, excelFile: undefined }));
  };

  // FIXED: Prevent double click by using useCallback and proper event handling
  const triggerExcelUpload = useCallback((e) => {
    e.preventDefault(); // FIXED: Prevent default label behavior
    e.stopPropagation(); // FIXED: Stop event bubbling
    if (isLoading || !excelFileInputRef.current) return;
    excelFileInputRef.current.click();
  }, [isLoading]);

  // FIXED: Handle attachment upload
  const handleAttachmentUpload = (e) => {
    e.stopPropagation(); // FIXED: Prevent double trigger
    const file = e.target.files[0];
    if (file) {
      // Reset the input value
      e.target.value = '';
      setAttachment(file);
      alert(`📎 File "${file.name}" attached successfully!`);
    }
  };

  const handleSendBulkEmail = async () => {
    if (!validateForm()) {
      return;
    }

    const formData = new FormData();
    formData.append('file', excelFile);
    formData.append('subject', subject);
    
    // FIXED: Convert HTML content to plain text
    let contentHTML = editorRef.current?.innerHTML || '';
    
    // Clean up empty divs and extra line breaks
    contentHTML = contentHTML
      .replace(/<div><br><\/div>/g, '')
      .replace(/<div><\/div>/g, '')
      .replace(/<p><br><\/p>/g, '')
      .replace(/<br><br><br>/g, '<br><br>')
      .trim();
    
    // Convert to plain text
    let contentText = htmlToPlainText(contentHTML);
    
    // Add signature as plain text if it exists
    if (contentText && signature.trim()) {
      contentText += `\n\n---\n${signature}`;
    } else if (signature.trim()) {
      contentText = signature;
    }
    
    formData.append('content', contentText);
    
    if (cc) formData.append('cc', cc);
    if (bcc) formData.append('bcc', bcc);
    if (attachment) formData.append('attachment', attachment);

    const result = await sendBulkEmail(formData, setIsLoading, showConfigPopup, isConfigured);

    if (result.success) {
      alert(result.message);
      // Reset form
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
      alert('❌ ' + result.error);
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

  // FIXED: Improved image insertion
  const insertImage = () => {
    const url = prompt('Enter the image URL:');
    if (url && editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertHTML', false, `<br><img src="${url}" alt="Image" style="max-width: 100%; height: auto; border-radius: 4px; margin: 8px 0; display: block;"><br>`);
    }
  };

  // FIXED: Enhanced formatting function - APPLIES FORMATTING ONLY, NO SAMPLE TEXT
  const applyFormatting = (command) => {
    if (!editorRef.current || isLoading) return;
    
    try {
      // Ensure the editor is focused
      editorRef.current.focus();
      
      // Check if execCommand is available
      if (typeof document.execCommand !== 'function') {
        throw new Error('execCommand not available');
      }
      
      // Small delay to ensure focus is applied
      setTimeout(() => {
        // Get current selection
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) {
          // No selection - create a zero-width span with formatting
          const formattedSpan = document.createElement('span');
          formattedSpan.style.cssText = 
            command === 'bold' ? 'font-weight: bold;' :
            command === 'italic' ? 'font-style: italic;' :
            command === 'underline' ? 'text-decoration: underline;' : '';
          
          // Insert the empty formatted span
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          range.insertNode(formattedSpan);
          range.setStart(formattedSpan, 0);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          
          // Place cursor inside the formatted span
          formattedSpan.focus();
        } else {
          // Apply formatting to selection
          const hasSelection = !selection.getRangeAt(0).collapsed;
          if (hasSelection) {
            document.execCommand(command, false, null);
          } else {
            // No selection but cursor exists - wrap cursor in formatted span
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
        
        // Re-focus the editor
        editorRef.current.focus();
        
      }, 50);
      
    } catch (error) {
      console.error('Formatting error:', error);
      // Fallback: toggle formatting using inline styles
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const hasSelection = !range.collapsed;
        
        if (hasSelection) {
          // Apply formatting to selected text
          range.surroundContents(
            command === 'bold' ? document.createElement('strong') :
            command === 'italic' ? document.createElement('em') :
            command === 'underline' ? document.createElement('u') : document.createElement('span')
          );
        } else {
          // Create empty formatted span at cursor
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
            {/* FIXED: Prevent double upload */}
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
                onClick={(e) => e.stopPropagation()} // FIXED: Prevent double trigger
              />
              <span>{excelFile ? `${excelFile.name}` : 'Upload Excel File'}</span>
              {isLoading && <span className="loading-indicator">⏳</span>}
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
            {/* FIXED: Updated tooltips to reflect new behavior */}
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
          <button
            onClick={insertImage}
            className="toolbar-button"
            title="Insert image"
            disabled={isLoading}
            aria-label="Insert image"
          >
            <Image size={18} />
          </button>
        </div>
      </div>

      <div className="content-area">
        <div
          ref={editorRef}
          className={`content-editable ${errors.content ? 'error' : ''} ${!isLoading ? 'focused' : ''}`}
          contentEditable={!isLoading}
          suppressContentEditableWarning={true}
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
            // FIXED: Ensure proper selection handling
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              if (range.collapsed && e.currentTarget.innerHTML === '') {
                // Place cursor at start if empty
                range.setStart(e.currentTarget, 0);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
              }
            }
          }}
          onBlur={(e) => {
            e.currentTarget.classList.remove('focused');
            // Clean up empty content
            if (e.currentTarget.innerHTML.trim() === '' || e.currentTarget.innerHTML === '<br>' || e.currentTarget.innerHTML === '<p><br></p>') {
              e.currentTarget.innerHTML = '';
            }
          }}
          onKeyDown={(e) => {
            // FIXED: Handle Enter key for proper line breaks
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
              title="Attach file"
              onClick={(e) => e.preventDefault()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  attachmentInputRef.current?.click();
                }
              }}
            >
              <Paperclip size={18} />
              <input
                ref={attachmentInputRef}
                type="file"
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