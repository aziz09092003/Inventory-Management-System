import React, { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Globe, Moon, Sun, User, Users, Mic, MicOff, CheckCircle, Lock } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'

function Settings({ toggleTheme, isDarkMode }) {
  const { language, changeLanguage, t } = useLanguage()
  const { user, registerVoice, hasVoiceRegistered, updateProfile } = useAuth()
  const [voiceStatus, setVoiceStatus] = useState({ has_voice: false, loading: true })
  const [voiceRegistering, setVoiceRegistering] = useState(false)
  const [voiceMessage, setVoiceMessage] = useState('')
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [voiceData, setVoiceData] = useState(null)
  const [editUsername, setEditUsername] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editConfirmPassword, setEditConfirmPassword] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editMessage, setEditMessage] = useState('')
  const paragraph = t('voiceRegistrationParagraph')

  // Check voice status on mount
  useEffect(() => {
    checkVoiceStatus()
  }, [user])

  useEffect(() => {
    if (user) {
      setEditUsername(user.username || '')
      setEditEmail(user.email || '')
    }
  }, [user])

  const checkVoiceStatus = () => {
    if (user) {
      const hasVoice = hasVoiceRegistered()
      setVoiceStatus({ has_voice: hasVoice, loading: false })
    } else {
      setVoiceStatus({ has_voice: false, loading: false })
    }
  }

  const startRecording = () => {
    setIsRecording(true)
    setVoiceMessage('')
    // Simulate voice recording for 5 seconds
    setTimeout(() => {
      const recordedVoice = {
        timestamp: Date.now(),
        data: 'voice_sample_' + Date.now(),
        paragraph: paragraph
      }
      setVoiceData(recordedVoice)
      setIsRecording(false)
    }, 5000)
  }

  const handleVoiceRegister = async () => {
    if (!voiceData) {
      setVoiceMessage(t('pleaseRecordVoiceFirst'))
      return
    }

    setVoiceRegistering(true)
    
    const result = await registerVoice(voiceData)
    
    if (result.success) {
      setVoiceMessage(t('voiceRegisteredSuccessMessage'))
      setVoiceStatus({ has_voice: true, loading: false })
      setShowVoiceRecorder(false)
      setVoiceData(null)
    } else {
      setVoiceMessage(result.message || t('voiceRegistrationFailed'))
    }
    
    setVoiceRegistering(false)
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setEditMessage('')

    if (!editUsername.trim()) {
      setEditMessage(t('usernameRequired'))
      return
    }
    if (!editEmail.trim()) {
      setEditMessage(t('emailRequired'))
      return
    }
    if (editPassword && editPassword.length < 6) {
      setEditMessage(t('passwordMinLength'))
      return
    }
    if (editPassword && editPassword !== editConfirmPassword) {
      setEditMessage(t('passwordsDoNotMatch'))
      return
    }

    setEditLoading(true)
    const payload = {
      username: editUsername.trim(),
      email: editEmail.trim(),
    }
    if (editPassword) {
      payload.password = editPassword
    }

    const result = await updateProfile(payload)
    if (result.success) {
      setEditMessage(t('profileUpdatedSuccessfully'))
      setEditPassword('')
      setEditConfirmPassword('')
    } else {
      setEditMessage(result.message || t('failedToUpdateProfile'))
    }
    setEditLoading(false)
  }

  return (
    <div className="space-y-4 mt-12">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-100 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('settingsTitle')}</h1>
      </div>

      {/* Theme Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
        <div className="flex items-center gap-2 mb-3">
          {isDarkMode ? <Moon className="w-5 h-5" style={{color: '#2C5F6F'}} /> : <Sun className="w-5 h-5 text-yellow-600" />}
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('appearance')}</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('themeMode')}
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => isDarkMode && toggleTheme()}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  !isDarkMode
                    ? 'border-gray-300 dark:border-gray-600'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
                style={!isDarkMode ? {borderColor: '#2C5F6F', backgroundColor: 'rgba(44, 95, 111, 0.1)'} : {}}
              >
                <Sun className="w-6 h-6 mx-auto mb-2" />
                <p className="text-center font-medium">{t('light')}</p>
              </button>
              <button
                onClick={() => !isDarkMode && toggleTheme()}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  isDarkMode
                    ? 'border-gray-300 dark:border-gray-600'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
                style={isDarkMode ? {borderColor: '#2C5F6F', backgroundColor: 'rgba(44, 95, 111, 0.1)'} : {}}
              >
                <Moon className="w-6 h-6 mx-auto mb-2" />
                <p className="text-center font-medium">{t('dark')}</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Language Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-5 h-5" style={{color: '#2C5F6F'}} />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('language')}</h2>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {t('displayLanguage')}
          </label>
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 dark:bg-gray-700 dark:text-white text-sm"
            style={{outlineColor: '#2C5F6F'}}
          >
            <option value="english">English</option>
            <option value="urdu">اردو (Urdu)</option>
          </select>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" style={{color: '#2C5F6F'}} />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('userManagement')}</h2>
          </div>
        </div>

        {user ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: 'rgba(44, 95, 111, 0.1)'}}>
                  <User className="w-5 h-5" style={{color: '#2C5F6F'}} />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white text-sm">{user.username}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{backgroundColor: 'rgba(44, 95, 111, 0.1)', color: '#2C5F6F'}}>
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

      {/* Edit Account Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-5 h-5" style={{color: '#2C5F6F'}} />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('editAccountInfo')}</h2>
        </div>

        {!user ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('pleaseLoginToEditAccount')}</p>
        ) : (
          <form className="space-y-3" onSubmit={handleProfileSave}>
            {editMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                editMessage.toLowerCase().includes('success')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {editMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('username')}</label>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 dark:bg-gray-700 dark:text-white text-sm"
                style={{outlineColor: '#2C5F6F'}}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('email')}</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 dark:bg-gray-700 dark:text-white text-sm"
                style={{outlineColor: '#2C5F6F'}}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('newPassword')}</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder={t('leaveEmptyToKeepCurrent')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 dark:bg-gray-700 dark:text-white text-sm"
                  style={{outlineColor: '#2C5F6F'}}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('confirmPassword')}</label>
                <input
                  type="password"
                  value={editConfirmPassword}
                  onChange={(e) => setEditConfirmPassword(e.target.value)}
                  placeholder={t('reEnterNewPassword')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 dark:bg-gray-700 dark:text-white text-sm"
                  style={{outlineColor: '#2C5F6F'}}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={editLoading}
              className="text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              style={{backgroundColor: '#2C5F6F'}}
            >
              {editLoading ? t('saving') : t('saveChanges')}
            </button>
          </form>
        )}
      </div>

      {/* Voice Authentication Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5" style={{color: '#2C5F6F'}} />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('voiceAuthentication')}</h2>
          </div>
          {voiceStatus.loading ? (
            <span className="text-xs text-gray-500">{t('checking')}</span>
          ) : voiceStatus.has_voice ? (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle className="w-4 h-4" /> {t('registered')}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-gray-500">
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
              className="px-4 py-2 text-white rounded-lg transition-colors"
              style={{backgroundColor: '#2C5F6F'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#234A57'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#2C5F6F'}
            >
              {showVoiceRecorder ? t('cancel') : t('registerVoice')}
            </button>
          </div>
        )}

        {showVoiceRecorder && (
          <div className="mt-6 space-y-4">
            {/* Paragraph to read */}
            <div className="p-4 rounded-lg" style={{backgroundColor: 'rgba(44, 95, 111, 0.1)'}}>
              <h3 className="font-semibold mb-2" style={{color: '#2C5F6F'}}>{t('readThisParagraph')}</h3>
              <p className="text-sm whitespace-pre-line" style={{color: '#2C5F6F'}}>{paragraph}</p>
            </div>

            {voiceRegistering ? (
              <div className="text-center py-8">
                <div className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full mx-auto mb-3" style={{borderColor: '#2C5F6F'}}></div>
                <p className="text-gray-600 dark:text-gray-400">{t('processingVoice')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <button
                    onClick={startRecording}
                    disabled={isRecording}
                    className={`mx-auto flex items-center justify-center w-24 h-24 rounded-full transition-all shadow-lg ${
                      isRecording
                        ? 'bg-red-500 animate-pulse'
                        : 'hover:scale-105'
                    } text-white`}
                    style={!isRecording ? {backgroundColor: '#2C5F6F'} : {}}
                  >
                    <Mic className="w-10 h-10" />
                  </button>
                  <p className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isRecording ? t('recordingDuration') : voiceData ? t('voiceRecorded') : t('tapToRecord')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{t('readParagraphWhileRecording')}</p>
                </div>

                {voiceData && !isRecording && (
                  <div className="flex gap-3">
                    <button
                      onClick={handleVoiceRegister}
                      className="flex-1 px-4 py-3 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                      style={{backgroundColor: '#2C5F6F'}}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#234A57'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#2C5F6F'}
                    >
                      {t('registerThisVoice')}
                    </button>
                    <button
                      onClick={() => {
                        setVoiceData(null)
                        setVoiceMessage('')
                      }}
                      className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      {t('reRecord')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* About Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <SettingsIcon className="w-6 h-6" style={{color: '#2C5F6F'}} />
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
