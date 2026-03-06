import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { LanguageProvider } from './contexts/LanguageContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import VoiceBilling from './pages/VoiceBilling'
import Inventory from './pages/Inventory'
import UdharKhata from './pages/UdharKhata'
import BillHistory from './pages/BillHistory'
import Reports from './pages/Reports'
import Forecasting from './pages/Forecasting'
import Sales from './pages/Sales'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Register from './pages/Register'

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }
  
  return user ? children : <Navigate to="/login" replace />
}

// Main App Layout Component
function AppLayout({ children, toggleSidebar, toggleTheme, isDarkMode, isSidebarOpen }) {
  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen" style={{backgroundColor: isDarkMode ? '#1F2937' : '#E8F4F8'}}>
        <Header toggleSidebar={toggleSidebar} toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="lg:ml-64 pt-24 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

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
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout 
                    toggleSidebar={toggleSidebar} 
                    toggleTheme={toggleTheme} 
                    isDarkMode={isDarkMode}
                    isSidebarOpen={isSidebarOpen}
                  >
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/voice-billing"
              element={
                <ProtectedRoute>
                  <AppLayout 
                    toggleSidebar={toggleSidebar} 
                    toggleTheme={toggleTheme} 
                    isDarkMode={isDarkMode}
                    isSidebarOpen={isSidebarOpen}
                  >
                    <VoiceBilling />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <AppLayout 
                    toggleSidebar={toggleSidebar} 
                    toggleTheme={toggleTheme} 
                    isDarkMode={isDarkMode}
                    isSidebarOpen={isSidebarOpen}
                  >
                    <Inventory />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/udhar"
              element={
                <ProtectedRoute>
                  <AppLayout 
                    toggleSidebar={toggleSidebar} 
                    toggleTheme={toggleTheme} 
                    isDarkMode={isDarkMode}
                    isSidebarOpen={isSidebarOpen}
                  >
                    <UdharKhata />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bill-history"
              element={
                <ProtectedRoute>
                  <AppLayout 
                    toggleSidebar={toggleSidebar} 
                    toggleTheme={toggleTheme} 
                    isDarkMode={isDarkMode}
                    isSidebarOpen={isSidebarOpen}
                  >
                    <BillHistory />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <AppLayout 
                    toggleSidebar={toggleSidebar} 
                    toggleTheme={toggleTheme} 
                    isDarkMode={isDarkMode}
                    isSidebarOpen={isSidebarOpen}
                  >
                    <Reports />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/forecasting"
              element={
                <ProtectedRoute>
                  <AppLayout 
                    toggleSidebar={toggleSidebar} 
                    toggleTheme={toggleTheme} 
                    isDarkMode={isDarkMode}
                    isSidebarOpen={isSidebarOpen}
                  >
                    <Forecasting />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales"
              element={
                <ProtectedRoute>
                  <AppLayout 
                    toggleSidebar={toggleSidebar} 
                    toggleTheme={toggleTheme} 
                    isDarkMode={isDarkMode}
                    isSidebarOpen={isSidebarOpen}
                  >
                    <Sales />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout 
                    toggleSidebar={toggleSidebar} 
                    toggleTheme={toggleTheme} 
                    isDarkMode={isDarkMode}
                    isSidebarOpen={isSidebarOpen}
                  >
                    <Settings toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Redirect all other routes to login or home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  )
}

export default App
