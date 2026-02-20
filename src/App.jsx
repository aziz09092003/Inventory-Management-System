import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { LanguageProvider } from './contexts/LanguageContext'
import { AuthProvider } from './contexts/AuthContext'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import VoiceBilling from './pages/VoiceBilling'
import Inventory from './pages/Inventory'
import UdharKhata from './pages/UdharKhata'
import BillHistory from './pages/BillHistory'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try { return localStorage.getItem('ims_theme') === 'dark' } catch (e) { return false }
  })

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const toggleTheme = () => setIsDarkMode(!isDarkMode)

  React.useEffect(() => {
    try { localStorage.setItem('ims_theme', isDarkMode ? 'dark' : 'light') } catch (e) {}
  }, [isDarkMode])

  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <div className={isDarkMode ? 'dark' : ''}>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
              <Header toggleSidebar={toggleSidebar} toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
              <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            <main className="lg:ml-64 pt-20 p-4 md:p-6">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/voice-billing" element={<VoiceBilling />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/udhar" element={<UdharKhata />} />
                <Route path="/bill-history" element={<BillHistory />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings toggleTheme={toggleTheme} isDarkMode={isDarkMode} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
      </LanguageProvider>
    </AuthProvider>
  )
}

export default App
