import React from 'react'
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

const iconMap = {
  warning: { icon: AlertTriangle, bg: 'bg-yellow-100 dark:bg-yellow-900', color: 'text-yellow-600 dark:text-yellow-400' },
  success: { icon: CheckCircle, bg: 'bg-green-100 dark:bg-green-900', color: 'text-green-600 dark:text-green-400' },
  error: { icon: XCircle, bg: 'bg-red-100 dark:bg-red-900', color: 'text-red-600 dark:text-red-400' },
  info: { icon: Info, bg: 'bg-blue-100 dark:bg-blue-900', color: 'text-blue-600 dark:text-blue-400' },
}

function AlertDialog({ open, type = 'info', title, message, confirmText, cancelText, onConfirm, onCancel, showCancel = false }) {
  const { t } = useLanguage()
  if (!open) return null

  const { icon: Icon, bg, color } = iconMap[type] || iconMap.info

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-in">
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 ${bg} rounded-full`}>
            <Icon className={`w-8 h-8 ${color}`} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
        </div>

        {message && (
          <div className="mb-6 ml-1">
            <p className="text-gray-600 dark:text-gray-300">{message}</p>
          </div>
        )}

        <div className="flex gap-4">
          {showCancel && (
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 font-semibold"
            >
              {cancelText || t('cancel')}
            </button>
          )}
          <button
            onClick={onConfirm || onCancel}
            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-colors text-white ${
              type === 'error' ? 'bg-red-600 hover:bg-red-700' :
              type === 'success' ? 'bg-green-600 hover:bg-green-700' :
              type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
              'bg-blue-600 hover:bg-blue-700'
            }`}
            style={type === 'info' ? { backgroundColor: '#2C5F6F' } : undefined}
          >
            {confirmText || t('ok')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AlertDialog
