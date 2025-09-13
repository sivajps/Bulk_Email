import React, { useState, useRef } from "react";
import {
  Minus,
  Maximize2,
  X,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  List,
  FileSpreadsheet,
  ListOrdered,
  Indent,
  Outdent,
  Quote,
  Link2,
  Image,
  Clock,
  Edit3,
  Trash2,
  Paperclip,
} from "lucide-react";
import * as XLSX from "xlsx";
import "./compose.css";

const EmailComposeWindow = () => {
  const [to, setTo] = useState([]); // store as array
  const [inputValue, setInputValue] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [fontSize, setFontSize] = useState("Sans Serif");
  const editorRef = useRef(null);

  // Execute commands for formatting
  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
  };

  // Insert link
  const insertLink = () => {
    const url = prompt("Enter the link URL:");
    if (url) execCommand("createLink", url);
  };

  // Schedule send
  const scheduleSend = () => {
    alert("Email scheduled to be sent in 5 seconds!");
    setTimeout(() => {
      alert("Email sent!");
    }, 5000);
  };

  // Handle adding emails manually
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const email = inputValue.trim().replace(/,$/, "");
      if (email && email.includes("@") && !to.includes(email)) {
        setTo([...to, email]);
      }
      setInputValue("");
    }
  };

  // Remove email chip
  const removeEmail = (email) => {
    setTo(to.filter((e) => e !== email));
  };

  // Handle Excel upload
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const emails = XLSX.utils
        .sheet_to_json(sheet, { header: 1 })
        .flat()
        .filter((cell) => typeof cell === "string" && cell.includes("@"));

      if (emails.length > 0) {
        setTo((prev) => [...new Set([...prev, ...emails])]); // merge without duplicates
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="email-compose-window">
      {/* Header */}
      <div className="header">
        <h3 className="header-title">New Message</h3>
        <div className="header-controls">
          <button className="control-button">
            <Minus size={16} />
          </button>
          <button className="control-button">
            <Maximize2 size={16} />
          </button>
          <button className="control-button">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Email Fields */}
      <div className="email-fields">
        {/* To Field */}
        <div className="field-row">
          <label className="field-label">To</label>
          <div className="field-input-container">
            <div className="chips-input">
              {to.map((email, i) => (
                <span key={i} className="email-chip">
                  {email}
                  <button
                    type="button"
                    className="remove-chip"
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
                className="field-input chip-input"
                placeholder="Recipients"
              />
            </div>

            {/* Upload Excel button */}
            <label className="cc-bcc-button excel-upload" title="Upload Excel">
              <FileSpreadsheet size={20} color="green" />
              <input
                type="file"
                accept=".xlsx,.xls"
                style={{ display: "none" }}
                onChange={handleExcelUpload}
              />
            </label>

            <div className="cc-bcc-buttons">
              <button onClick={() => setShowCc(!showCc)} className="cc-bcc-button">
                Cc
              </button>
              <button onClick={() => setShowBcc(!showBcc)} className="cc-bcc-button">
                Bcc
              </button>
            </div>
          </div>
        </div>

        {/* Cc Field */}
        {showCc && (
          <div className="field-row">
            <label className="field-label">Cc</label>
            <input
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              className="field-input full-width"
              placeholder="Carbon copy"
            />
          </div>
        )}

        {/* Bcc Field */}
        {showBcc && (
          <div className="field-row">
            <label className="field-label">Bcc</label>
            <input
              type="text"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              className="field-input full-width"
              placeholder="Blind carbon copy"
            />
          </div>
        )}

        {/* Subject Field */}
        <div className="field-row subject-row">
          <label className="field-label">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="field-input full-width"
            placeholder="Enter subject"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="content-area">
        <div
          ref={editorRef}
          className="content-editable"
          contentEditable
          placeholder="Compose your message..."
          style={{
            fontFamily:
              fontSize === "Serif"
                ? "serif"
                : fontSize === "Arial"
                ? "Arial, sans-serif"
                : fontSize === "Times"
                ? "Times, serif"
                : "system-ui, sans-serif",
          }}
        ></div>
      </div>

      {/* Formatting Toolbar */}
      <div className="formatting-toolbar">
        <div className="toolbar-content">
          {/* Undo/Redo */}
          <button className="toolbar-button" onClick={() => execCommand("undo")}>
            <Undo2 size={16} />
          </button>
          <button className="toolbar-button" onClick={() => execCommand("redo")}>
            <Redo2 size={16} />
          </button>

          {/* Font Selector */}
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="font-selector"
          >
            <option>Sans Serif</option>
            <option>Serif</option>
            <option>Arial</option>
            <option>Times</option>
          </select>

          {/* Text Formatting */}
          <button className="toolbar-button" onClick={() => execCommand("bold")}>
            <Bold size={16} />
          </button>
          <button className="toolbar-button" onClick={() => execCommand("italic")}>
            <Italic size={16} />
          </button>
          <button className="toolbar-button" onClick={() => execCommand("underline")}>
            <Underline size={16} />
          </button>

          {/* Alignment */}
          <button className="toolbar-button" onClick={() => execCommand("justifyLeft")}>
            <AlignLeft size={16} />
          </button>
          <button className="toolbar-button" onClick={() => execCommand("insertUnorderedList")}>
            <List size={16} />
          </button>
          <button className="toolbar-button" onClick={() => execCommand("insertOrderedList")}>
            <ListOrdered size={16} />
          </button>
          <button className="toolbar-button" onClick={() => execCommand("outdent")}>
            <Outdent size={16} />
          </button>
          <button className="toolbar-button" onClick={() => execCommand("indent")}>
            <Indent size={16} />
          </button>
          <button className="toolbar-button" onClick={() => execCommand("formatBlock", "blockquote")}>
            <Quote size={16} />
          </button>

          {/* Insert */}
          <button className="toolbar-button" onClick={insertLink}>
            <Link2 size={16} />
          </button>
          <button className="toolbar-button" onClick={scheduleSend}>
            <Clock size={16} />
          </button>
        </div>
      </div>

      {/* Bottom Toolbar */}
      <div className="bottom-toolbar">
        <div className="toolbar-left">
          <button className="send-button">Send</button>

          <div className="insert-buttons">
            <label className="toolbar-button" title="Attach file">
              <Paperclip size={16} />
              <input type="file" style={{ display: "none" }} />
            </label>
            <button className="toolbar-button" title="Insert image">
              <Image size={16} />
            </button>
            <button className="toolbar-button" title="Edit signature">
              <Edit3 size={16} />
            </button>
          </div>
        </div>

        <button className="toolbar-button delete-button" title="Delete">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default EmailComposeWindow;
