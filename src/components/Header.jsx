import React, { useState, useEffect, useRef } from 'react'
import { Menu, Sun, Moon, Bell, Search, LogOut, User, Package, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { itemsAPI, customersAPI, salesAPI, billsAPI, udharsAPI } from '../services/api'
import AlertDialog from './AlertDialog'

function Header({ toggleSidebar, toggleTheme, isDarkMode }) {
  const { t } = useLanguage()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showBellMenu, setShowBellMenu] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const menuRef = useRef(null)
  const bellRef = useRef(null)
  const searchRef = useRef(null)

  // Close dropdowns on outside click
  useEffect(() => {
    function handleOutsideClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false)
      }
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowBellMenu(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchResults([])
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    const loadProfilePhoto = () => {
      setProfilePhoto(localStorage.getItem('profilePhoto'))
    }

    loadProfilePhoto()
    window.addEventListener('storage', loadProfilePhoto)
    window.addEventListener('ims_profile_photo_updated', loadProfilePhoto)

    return () => {
      window.removeEventListener('storage', loadProfilePhoto)
      window.removeEventListener('ims_profile_photo_updated', loadProfilePhoto)
    }
  }, [])

  // Fetch stock notifications
  useEffect(() => {
    if (!user) return
    itemsAPI.getAll().then((res) => {
      if (res.data) {
        const alerts = []
        res.data.forEach((item) => {
          const stockQty = Number(item?.stock_quantity ?? item?.stock ?? 0)
          const reorderLevel = Number(item?.reorder_level ?? item?.reorderLevel ?? 20)
          const itemId = item?.item_id ?? item?.id
          const itemName = item?.item_name ?? item?.name ?? t('unnamedItem')

          if (stockQty <= 0) {
            alerts.push({ id: itemId, name: itemName, type: 'out', qty: stockQty })
          } else if (stockQty < 10) {
            alerts.push({ id: itemId, name: itemName, type: 'critical', qty: stockQty })
          } else if (stockQty < 20 || stockQty <= reorderLevel) {
            alerts.push({ id: itemId, name: itemName, type: 'low', qty: stockQty, reorder: reorderLevel })
          }
        })
        setNotifications(alerts)
      }
    }).catch(() => {})
  }, [user])

  useEffect(() => {
    const runGlobalSearch = async () => {
      const q = searchQuery.trim().toLowerCase()
      if (q.length < 2 || !user) {
        setSearchResults([])
        return
      }

      setSearching(true)
      try {
        const [itemsRes, customersRes, salesRes, billsRes, udharsRes] = await Promise.all([
          itemsAPI.getAll(),
          customersAPI.getAll(),
          salesAPI.getAll(),
          billsAPI.getAll(),
          udharsAPI.getAll(),
        ])

        const items = Array.isArray(itemsRes?.data) ? itemsRes.data : []
        const customers = Array.isArray(customersRes?.data) ? customersRes.data : []
        const sales = Array.isArray(salesRes?.data) ? salesRes.data : []
        const bills = Array.isArray(billsRes?.data) ? billsRes.data : []
        const udhars = Array.isArray(udharsRes?.data) ? udharsRes.data : []

        const featureResults = [
          { key: 'feature-dashboard', label: t('dashboard'), route: '/' },
          { key: 'feature-inventory', label: t('inventory'), route: '/inventory' },
          { key: 'feature-bills', label: t('billHistory'), route: '/bill-history' },
          { key: 'feature-purchase', label: t('purchase'), route: '/voice-billing' },
          { key: 'feature-sales', label: t('sales'), route: '/sales' },
          { key: 'feature-reports', label: t('reports'), route: '/reports' },
          { key: 'feature-forecast', label: t('forecasting'), route: '/forecasting' },
          { key: 'feature-udhar', label: t('udharKhata'), route: '/udhar' },
          { key: 'feature-settings', label: t('settings'), route: '/settings' },
        ]
          .filter((f) => f.label.toLowerCase().includes(q))
          .map((f) => ({
            id: f.key,
            title: f.label,
            subtitle: t('featureLabel'),
            route: f.route,
          }))

        const itemResults = items
          .filter((item) => String(item?.item_name || '').toLowerCase().includes(q))
          .slice(0, 4)
          .map((item) => ({
            id: `item-${item.item_id}`,
            title: item.item_name,
            subtitle: `${t('item')} - ${t('inventory')}`,
            route: '/inventory',
          }))

        const customerResults = customers
          .filter((customer) => String(customer?.customer_name || '').toLowerCase().includes(q))
          .slice(0, 3)
          .map((customer) => ({
            id: `customer-${customer.customer_id}`,
            title: customer.customer_name,
            subtitle: `${t('customer')} - ${t('billHistory')}`,
            route: '/bill-history',
          }))

        const salesResults = sales
          .filter((sale) => String(sale?.customer_name || '').toLowerCase().includes(q) || String(sale?.sale_id || '').includes(q))
          .slice(0, 2)
          .map((sale) => ({
            id: `sale-${sale.sale_id}`,
            title: `${t('sales')} #${sale.sale_id}`,
            subtitle: t('sales'),
            route: '/sales',
          }))

        const billResults = bills
          .filter((bill) => String(bill?.bill_id || '').includes(q) || String(bill?.status || '').toLowerCase().includes(q))
          .slice(0, 2)
          .map((bill) => ({
            id: `bill-${bill.bill_id}`,
            title: `${t('billLabel')} #${bill.bill_id}`,
            subtitle: t('billHistory'),
            route: '/bill-history',
          }))

        const udharResults = udhars
          .filter((udhar) => String(udhar?.status || '').toLowerCase().includes(q) || String(udhar?.customer_id || '').includes(q))
          .slice(0, 2)
          .map((udhar) => ({
            id: `udhar-${udhar.udhar_id}`,
            title: `${t('udharKhata')} #${udhar.udhar_id}`,
            subtitle: t('udharKhata'),
            route: '/udhar',
          }))

        const merged = [...featureResults, ...itemResults, ...customerResults, ...salesResults, ...billResults, ...udharResults].slice(0, 10)
        setSearchResults(merged)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }

    runGlobalSearch()
  }, [searchQuery, user])

  const getFirstName = () => {
    if (user?.username) {
      return user.username.split(' ')[0]
    }
    return t('userFallback')
  }

  const handleLogout = () => {
    setShowUserMenu(false)
    setShowLogoutDialog(true)
  }

  const confirmLogout = () => {
    setShowLogoutDialog(false)
    logout()
    navigate('/login')
  }

  const handleSearchSelect = (result) => {
    navigate(result.route)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      e.preventDefault()
      handleSearchSelect(searchResults[0])
    }
  }

  return (
    <>
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
            {t('welcomeUser')} {getFirstName()}!
          </h1>
        </div>

        {/* Right Section - Search, Theme Toggle, Notifications, User Menu */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="hidden md:block relative" ref={searchRef}>
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2.5 w-72">
              <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder={t('search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="ml-2 bg-transparent outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 w-full"
              />
            </div>

            {(searching || searchResults.length > 0) && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
                {searching ? (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{t('searching')}</div>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleSearchSelect(result)}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      >
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{result.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{result.subtitle}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={isDarkMode ? t('switchToLightMode') : t('switchToDarkMode')}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setShowBellMenu(!showBellMenu)}
              className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-0.5">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            {showBellMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <p className="font-semibold text-gray-800 dark:text-white">{t('stockAlerts')}</p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{notifications.length} {notifications.length !== 1 ? t('alertsPlural') : t('alertSingle')}</span>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">{t('allItemsWellStocked')}</div>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        {n.type === 'out' ? (
                          <Package className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${n.type === 'critical' ? 'text-red-500' : 'text-yellow-500'}`} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{n.name}</p>
                          {n.type === 'out' ? (
                            <p className="text-xs text-red-500">{t('outOfStock')}</p>
                          ) : n.type === 'critical' ? (
                            <p className="text-xs text-red-500">{t('criticalStockOnlyLeft')} {n.qty}</p>
                          ) : (
                            <p className="text-xs text-yellow-600 dark:text-yellow-400">{t('lowStockLeft')} {n.qty} ({t('reorderAt')} {n.reorder})</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
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
                  <span className="font-medium">{t('logout')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      </header>

      <AlertDialog
        open={showLogoutDialog}
        type="warning"
        title={t('confirmLogoutTitle')}
        message={t('confirmLogoutGuestModeMessage')}
        confirmText={t('yesLogout')}
        cancelText={t('cancel')}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutDialog(false)}
        showCancel={true}
      />
    </>
  )
}

export default Header
