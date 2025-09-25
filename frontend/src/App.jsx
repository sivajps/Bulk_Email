/**
 * Main application component that serves as the entry point for the React app
 * @component
 * @returns {JSX.Element} The main App component rendering the Inbox component
 */

import React from 'react';
// import EmailDashboard from './dashboard';
import './App.css';
import Inbox from './inbox.jsx';

function App() {
  return <Inbox />;
}

export default App;