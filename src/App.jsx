import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
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
  const { user } = useAuth()
  const isGuest = !!user?.isGuest

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen" style={{backgroundColor: isDarkMode ? '#1F2937' : '#E8F4F8'}}>
        <style>{`@keyframes guestMarquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }`}</style>
        <Header toggleSidebar={toggleSidebar} toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} isDarkMode={isDarkMode} />

        {isGuest && (
          <div className="fixed top-20 left-0 right-0 lg:left-64 z-30 border-y border-amber-300 bg-amber-100 dark:bg-amber-900/30 dark:border-amber-700 overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="flex-1 min-w-0 overflow-hidden">
                <div
                  className="text-xs md:text-sm font-semibold text-amber-800 dark:text-amber-200 whitespace-nowrap"
                  style={{ animation: 'guestMarquee 14s linear infinite' }}
                >
                  You are in Guest Mode. Data is demo-only and resets after session. Login or Register to use your personal dashboard and save your real shop data.
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link to="/login" className="px-3 py-1 rounded-md text-xs md:text-sm text-white" style={{ backgroundColor: '#2C5F6F' }}>
                  Login
                </Link>
                <Link to="/register" className="px-3 py-1 rounded-md border text-xs md:text-sm border-amber-600 text-amber-800 dark:text-amber-200">
                  Register
                </Link>
              </div>
            </div>
          </div>
        )}

        <main className={`lg:ml-64 px-6 md:px-8 pb-6 md:pb-8 ${isGuest ? 'pt-36' : 'pt-24'}`}>
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
