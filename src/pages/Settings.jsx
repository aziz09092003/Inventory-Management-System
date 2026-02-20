import React, { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Globe, Moon, Sun, User, Users, Mic, MicOff, CheckCircle } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { voiceAuthAPI } from '../services/api'
import VoiceRecorder from '../components/VoiceRecorder'

function Settings({ toggleTheme, isDarkMode }) {
  const { language, changeLanguage, t } = useLanguage()
  const { user } = useAuth()
  const [voiceStatus, setVoiceStatus] = useState({ has_voice: false, loading: true })
  const [voiceRegistering, setVoiceRegistering] = useState(false)
  const [voiceMessage, setVoiceMessage] = useState('')
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [paragraph, setParagraph] = useState('')

  // Check voice status on mount
  useEffect(() => {
    checkVoiceStatus()
    fetchParagraph()
  }, [])

  const checkVoiceStatus = async () => {
    try {
      const { data } = await voiceAuthAPI.getStatus()
      setVoiceStatus({ has_voice: data.has_voice, loading: false })
    } catch (err) {
      setVoiceStatus({ has_voice: false, loading: false })
    }
  }

  const fetchParagraph = async () => {
    try {
      const { data } = await voiceAuthAPI.getParagraph()
      setParagraph(data.paragraph)
    } catch (err) {
      setParagraph('Please read: "The quick brown fox jumps over the lazy dog. My voice is my password."')
    }
  }

  const handleVoiceRegister = async (audioBlob) => {
    setVoiceRegistering(true)
    setVoiceMessage('')
    
    try {
      const { data } = await voiceAuthAPI.registerVoice(audioBlob)
      setVoiceMessage(data.message)
      setVoiceStatus({ has_voice: true, loading: false })
      setShowVoiceRecorder(false)
    } catch (err) {
      const detail = err?.response?.data?.detail
      setVoiceMessage(typeof detail === 'string' ? detail : 'Voice registration failed')
    } finally {
      setVoiceRegistering(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">{t('settingsTitle')}</h1>

      {/* Theme Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          {isDarkMode ? <Moon className="w-6 h-6 text-blue-600" /> : <Sun className="w-6 h-6 text-yellow-600" />}
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t('appearance')}</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('themeMode')}
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => !isDarkMode && toggleTheme()}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  !isDarkMode
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                }`}
              >
                <Sun className="w-6 h-6 mx-auto mb-2" />
                <p className="text-center font-medium">{t('light')}</p>
              </button>
              <button
                onClick={() => isDarkMode && toggleTheme()}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  isDarkMode
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                }`}
              >
                <Moon className="w-6 h-6 mx-auto mb-2" />
                <p className="text-center font-medium">{t('dark')}</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Language Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t('language')}</h2>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('displayLanguage')}
          </label>
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="english">English</option>
            <option value="urdu">اردو (Urdu)</option>
          </select>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t('userManagement')}</h2>
          </div>
        </div>

        {user ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">{user.username}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  {t('owner')}
                </span>
                <span
                  className="w-3 h-3 rounded-full bg-green-500"
                  title={t('active')}
                ></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>{t('noUserLoggedIn')}</p>
          </div>
        )}
      </div>

      {/* Voice Authentication Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Mic className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t('voiceAuthentication')}</h2>
          </div>
          {voiceStatus.loading ? (
            <span className="text-sm text-gray-500">{t('checking')}</span>
          ) : voiceStatus.has_voice ? (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" /> {t('registered')}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <MicOff className="w-4 h-4" /> {t('notRegistered')}
            </span>
          )}
        </div>

        {voiceMessage && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            voiceMessage.includes('success') 
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {voiceMessage}
          </div>
        )}

        {voiceStatus.has_voice ? (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('voiceRegisteredDesc')}
            </p>
            <button
              onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              {showVoiceRecorder ? t('cancel') : t('reRegisterVoice')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('registerVoiceDesc')}
            </p>
            <button
              onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showVoiceRecorder ? t('cancel') : t('registerVoice')}
            </button>
          </div>
        )}

        {showVoiceRecorder && (
          <div className="mt-6 space-y-4">
            {/* Paragraph to read */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">{t('readThisParagraph')}</h3>
              <p className="text-blue-700 dark:text-blue-400 text-sm whitespace-pre-line">{paragraph}</p>
            </div>

            {voiceRegistering ? (
              <div className="text-center py-8">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-gray-600 dark:text-gray-400">{t('processingVoice')}</p>
              </div>
            ) : (
              <VoiceRecorder 
                onRecordingComplete={handleVoiceRegister}
                minDuration={5}
                maxDuration={15}
              />
            )}
          </div>
        )}
      </div>

      {/* About Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <SettingsIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t('about')}</h2>
        </div>
        <div className="space-y-2 text-gray-600 dark:text-gray-400">
          <p><strong className="text-gray-800 dark:text-white">{t('version')}:</strong> 1.0.0</p>
          <p><strong className="text-gray-800 dark:text-white">{t('builtWith')}:</strong> React + Tailwind CSS</p>
          <p><strong className="text-gray-800 dark:text-white">{t('purpose')}:</strong> AI Voice Billing & Inventory Management</p>
        </div>
      </div>
    </div>
  )
}

export default Settings
