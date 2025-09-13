import { useState } from 'react'
import EmailComposeWindow from "./compose"
import Dashboard from "./dashboard"
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    // <EmailComposeWindow />
    <Dashboard />
  )
}

export default App
