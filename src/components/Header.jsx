import React from 'react'
import { Menu, Sun, Moon } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

function Header({ toggleSidebar, toggleTheme, isDarkMode }) {
  const { t } = useLanguage()

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 shadow-md">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-primary dark:text-blue-400">
            {t('aiVoiceBilling')}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-700" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
