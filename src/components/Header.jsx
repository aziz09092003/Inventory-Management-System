import React, { useState } from 'react'
import { Menu, Sun, Moon, Bell, Search, LogOut, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'

function Header({ toggleSidebar, toggleTheme, isDarkMode }) {
  const { t } = useLanguage()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)

  const getFirstName = () => {
    if (user?.username) {
      return user.username.split(' ')[0]
    }
    return 'User'
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 shadow-md border-b border-gray-100 dark:border-gray-700 lg:ml-64">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section - Menu & Welcome */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            Welcome {getFirstName()}!
          </h1>
        </div>

        {/* Right Section - Search, Theme Toggle, Notifications, User Menu */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2.5 w-72">
            <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ml-2 bg-transparent outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 w-full"
            />
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Notifications */}
          <button className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="font-medium text-gray-800 dark:text-white">{user?.username}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-red-600 dark:text-red-400"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
