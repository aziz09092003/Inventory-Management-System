import React, { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Mic, Package, Book, Receipt, BarChart3, Settings, X, LogOut, ShoppingCart, Layers, TrendingUp, DollarSign } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'

function Sidebar({ isOpen, toggleSidebar, isDarkMode }) {
  const { t } = useLanguage()
  const { user, logout } = useAuth()
  const [profilePhoto, setProfilePhoto] = useState(null)

  useEffect(() => {
    // Load profile photo from localStorage
    const savedPhoto = localStorage.getItem('profilePhoto')
    if (savedPhoto) {
      setProfilePhoto(savedPhoto)
    }
  }, [])

  const handleProfilePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result
        setProfilePhoto(base64String)
        localStorage.setItem('profilePhoto', base64String)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const navItems = [
    { name: t('dashboard'), path: '/', icon: LayoutDashboard },
    { name: t('inventory'), path: '/inventory', icon: Package },
    { name: t('billHistory'), path: '/bill-history', icon: Layers },
    { name: t('purchase'), path: '/voice-billing', icon: ShoppingCart },
    { name: t('sales'), path: '/sales', icon: DollarSign },
    { name: t('reports'), path: '/reports', icon: BarChart3 },
    { name: t('forecasting'), path: '/forecasting', icon: TrendingUp },
    { name: t('udharKhata'), path: '/udhar', icon: Book },
    { name: t('settings'), path: '/settings', icon: Settings },
  ]

  const handleLogout = () => {
    logout()
    toggleSidebar()
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.username) {
      return user.username.substring(0, 2).toUpperCase()
    }
    return 'US'
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        style={{ backgroundColor: isDarkMode ? '#1B3A44' : '#2C5F6F' }}
        className={`fixed left-0 top-0 h-full w-64 shadow-lg transform transition-transform duration-300 z-50 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Close Button Mobile */}
        <div className="flex items-center justify-end p-4 lg:hidden">
          <button onClick={toggleSidebar} className="text-white rounded-lg p-1" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Section */}
        <div className="px-6 py-6 border-b border-white border-opacity-20">
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-xl font-bold overflow-hidden" style={{ color: '#2C5F6F' }}>
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  getUserInitials()
                )}
              </div>
              <label 
                htmlFor="profile-upload" 
                className="absolute bottom-0 right-0 w-5 h-5 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-md"
                style={{ color: '#2C5F6F' }}
                title="Upload photo"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </label>
              <input 
                id="profile-upload" 
                type="file" 
                accept="image/*" 
                className="hidden"
                onChange={handleProfilePhotoUpload}
              />
            </div>
            <h3 className="text-white font-semibold text-base mb-1">{user?.username || 'User'}</h3>
            <p className="text-white text-opacity-70 text-xs">{user?.email || 'user@example.com'}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => window.innerWidth < 1024 && toggleSidebar()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3.5 mx-3 rounded-lg transition-colors ${
                  isActive ? 'font-semibold' : 'text-white hover:bg-white/10'
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'rgba(255,255,255,0.92)' : 'transparent',
                color: isActive ? '#2C5F6F' : 'white',
              })}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-base">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-white border-opacity-20">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-6 py-3 text-white transition-colors w-full rounded-lg"
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
