import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Layout from './components/layout/Layout'

import Dashboard from './pages/Dashboard'
import UpsolveQueue from './pages/UpsolveQueue'
import Contests from './pages/Contests'
import ContestDetail from './pages/ContestDetail'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <>
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#1e293b',
            },
          },
        }} 
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        
        {/* Protected Routes wrapped in Layout */}
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/queue" element={<Layout><UpsolveQueue /></Layout>} />
        <Route path="/contests" element={<Layout><Contests /></Layout>} />
        <Route path="/contests/:id" element={<Layout><ContestDetail /></Layout>} />
        <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
      </Routes>
    </>
  )
}

export default App
