import React, { useState, useEffect } from 'react'
import { Plus, Filter, Clock, CheckCircle, XCircle, Trash2, AlertCircle, Search, AlertTriangle } from 'lucide-react'
import { customersAPI, udharsAPI } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'

function UdharKhata() {
  const { t } = useLanguage()
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAddUdharModal, setShowAddUdharModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDeleteWarning, setShowDeleteWarning] = useState(false)
  const [deleteWarningCustomer, setDeleteWarningCustomer] = useState(null)
  const [addUdharCustomer, setAddUdharCustomer] = useState(null)
  const [paymentCustomer, setPaymentCustomer] = useState(null)
  const [customers, setCustomers] = useState([])
  const [udhars, setUdhars] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Add form state
  // Add form state
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newAmount, setNewAmount] = useState(0)
  const [addUdharAmount, setAddUdharAmount] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')

  // Load data from localStorage
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [customersRes, udharsRes] = await Promise.all([
        customersAPI.getAll(),
        udharsAPI.getAll()
      ])
      setCustomers(customersRes.data)
      setUdhars(udharsRes.data)
    } catch (err) {
      setError('Failed to load data. Please try again.')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Merge customers with their udhar data
  const customersWithUdhar = customers.map(customer => {
    const udhar = udhars.find(u => u.customer_id === customer.customer_id)
    return {
      id: customer.customer_id,
      name: customer.customer_name,
      amount: udhar ? udhar.effective_total : 0,
      paid: udhar ? udhar.effective_status === 'paid' : true,
      udhar_id: udhar?.udhar_id,
      paidAmount: udhar ? udhar.direct_deduction : 0
    }
  })

  const filteredCustomers = customersWithUdhar.filter(customer => {
    // Filter by status
    const statusMatch = 
      filter === 'all' ? true :
      filter === 'paid' ? customer.paid :
      filter === 'unpaid' ? !customer.paid :
      true
    
    // Filter by search query
    const searchMatch = searchQuery.trim() === '' || 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    return statusMatch && searchMatch
  })

  const handleAddEntry = async (e) => {
    e.preventDefault()
    try {
      if (!newCustomerName.trim()) {
        alert('Please enter customer name')
        return
      }
      
      // Check for duplicate name (exact match, case-sensitive)
      const existingCustomer = customers.find(
        c => c.customer_name === newCustomerName.trim()
      )
      if (existingCustomer) {
        alert(`Customer with name "${newCustomerName.trim()}" already exists!`)
        return
      }
      
      // Create customer
      const customerData = { customer_name: newCustomerName.trim() }
      const customerRes = await customersAPI.create(customerData)
      
      // If amount is provided, create udhar entry with direct addition
      if (newAmount > 0) {
        await udharsAPI.updateDirectAddition(customerRes.data.customer_id, Number(newAmount))
      }
      
      // Refresh data
      await fetchData()
      setShowAddModal(false)
      setNewCustomerName('')
      setNewAmount(0)
    } catch (err) {
      alert('Failed to add entry: ' + (err.response?.data?.detail || err.message))
      console.error('Add entry error:', err)
    }
  }

  const handleAddUdhar = async (e) => {
    e.preventDefault()
    try {
      if (!addUdharCustomer) return
      
      const amount = Number(addUdharAmount)
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount greater than 0')
        return
      }
      
      // Add udhar amount using direct addition
      await udharsAPI.updateDirectAddition(addUdharCustomer.id, amount)
      
      // Refresh data
      await fetchData()
      setShowAddUdharModal(false)
      setAddUdharCustomer(null)
      setAddUdharAmount('')
    } catch (err) {
      alert('Failed to add udhar: ' + (err.response?.data?.detail || err.message))
      console.error('Add udhar error:', err)
    }
  }

  const handleDelete = async (customer) => {
    // Check if customer has pending udhar
    if (customer.amount > 0) {
      setDeleteWarningCustomer(customer)
      setShowDeleteWarning(true)
      return
    }
    
    // If amount is 0, proceed with deletion
    if (window.confirm(`Are you sure you want to delete ${customer.name}? This will remove all their records.`)) {
      try {
        console.log('Attempting to delete customer:', customer.id)
        const response = await customersAPI.delete(customer.id)
        console.log('Delete response:', response)
        alert('Customer deleted successfully!')
        await fetchData()
      } catch (err) {
        console.error('Delete error:', err)
        console.error('Error response:', err.response)
        const errorMsg = err.response?.data?.detail || err.message || 'Unknown error occurred'
        alert('Failed to delete: ' + errorMsg)
      }
    }
  }

  const handleAddUdharClick = (customer) => {
    setAddUdharCustomer(customer)
    setAddUdharAmount('')
    setShowAddUdharModal(true)
  }

  const handlePayment = async (customer) => {
    setPaymentCustomer(customer)
    setPaymentAmount('')
    setShowPaymentModal(true)
  }

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    
    const amount = Number(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }
    
    if (amount > paymentCustomer.amount) {
      alert('Payment amount cannot exceed the current udhar amount')
      return
    }
    
    try {
      // Deduct the payment amount
      await udharsAPI.updateDirectDeduction(paymentCustomer.id, amount)
      await fetchData()
      setShowPaymentModal(false)
      setPaymentCustomer(null)
      setPaymentAmount('')
    } catch (err) {
      alert('Failed to process payment: ' + (err.response?.data?.detail || err.message))
    }
  }

  const totalUnpaid = customersWithUdhar
    .filter(c => !c.paid)
    .reduce((sum, c) => sum + c.amount, 0)

  const totalPaid = customersWithUdhar
    .reduce((sum, c) => sum + c.paidAmount, 0)

  return (
    <div className="space-y-4 mt-12">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-100 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('udharKhata')}</h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-red-800 font-medium">{error}</p>
            <p className="text-red-600 text-sm">Unable to load data. Please refresh the page.</p>
            <button 
              onClick={fetchData}
              className="mt-2 text-sm bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{borderColor: '#2C5F6F'}}></div>
          <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm">Loading data...</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{t('totalUnpaid')}</p>
              <p className="text-xl font-bold text-red-600">Rs {totalUnpaid.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-4 text-white">
          <p className="text-xs opacity-90 mb-0.5">{t('totalPaid')}</p>
          <p className="text-2xl font-bold">Rs {totalPaid.toLocaleString()}</p>
          <p className="text-xs mt-1.5 opacity-90">{t('completedPayments')}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg" style={{backgroundColor: 'rgba(44, 95, 111, 0.1)'}}>
              <Clock className="w-5 h-5" style={{color: '#2C5F6F'}} />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{t('totalCustomers')}</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">{customersWithUdhar.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 w-full md:max-w-lg">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search') + ' ' + t('customerName').toLowerCase() + '...'}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm"
              style={{outlineColor: '#2C5F6F'}}
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative w-full md:w-48">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 dark:bg-gray-700 dark:text-white appearance-none cursor-pointer"
              style={{outlineColor: '#2C5F6F'}}
            >
              {['all', 'unpaid', 'paid'].map(option => (
                <option key={option} value={option}>
                  {t(option)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Add New Entry Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 justify-center shadow-lg w-full md:w-auto"
            style={{backgroundColor: '#2C5F6F'}}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#234A57'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#2C5F6F'}
          >
            <Plus className="w-5 h-5" />
            {t('addNewEntry')}
          </button>
        </div>
      </div>

      {/* Customers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{borderColor: '#2C5F6F'}}></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">{t('noCustomersFound')}</p>
          </div>
        ) : (
          filteredCustomers.map(customer => {
            return (
              <div
                key={customer.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 ${
                  customer.paid
                    ? 'border-green-500'
                    : 'border-yellow-500'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                      {customer.name}
                    </h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      Rs {customer.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(customer)}
                      className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      customer.paid
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {customer.paid ? t('paid').toUpperCase() : t('pending').toUpperCase()}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddUdharClick(customer)}
                      className="text-sm text-white px-4 py-1 rounded-lg transition-colors"
                      style={{backgroundColor: '#2C5F6F'}}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#234A57'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#2C5F6F'}
                    >
                      {t('addUdhar')}
                    </button>
                    {!customer.paid && customer.amount > 0 && (
                      <button
                        onClick={() => handlePayment(customer)}
                        className="text-sm bg-green-600 text-white px-4 py-1 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        {t('payUdhar')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{t('addNewUdharEntry')}</h2>
            <form className="space-y-4" onSubmit={handleAddEntry}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('customerName')}
                </label>
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Ahmed Ali"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('amount')} (₨)
                </label>
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 text-white px-4 py-2 rounded-lg transition-colors"
                  style={{backgroundColor: '#2C5F6F'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#234A57'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#2C5F6F'}
                >
                  {t('addEntry')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Udhar Modal */}
      {showAddUdharModal && addUdharCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{t('addUdharAmount')}</h2>
            <form className="space-y-4" onSubmit={handleAddUdhar}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('customerName')}
                </label>
                <input
                  type="text"
                  value={addUdharCustomer.name}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('currentUdhar')}
                </label>
                <input
                  type="text"
                  value={`Rs ${addUdharCustomer.amount.toLocaleString()}`}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white cursor-not-allowed font-semibold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('amountToAdd')} (Rs)
                </label>
                <input
                  type="number"
                  value={addUdharAmount}
                  onChange={(e) => setAddUdharAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder={t('enterAmountToAdd')}
                  min="1"
                  step="1"
                  autoFocus
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('newTotalWillBe')}: Rs {(addUdharCustomer.amount + (Number(addUdharAmount) || 0)).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUdharModal(false)
                    setAddUdharCustomer(null)
                    setAddUdharAmount('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
                  style={{backgroundColor: '#2C5F6F'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#234A57'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#2C5F6F'}
                >
                  {t('addUdhar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Warning Modal */}
      {showDeleteWarning && deleteWarningCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('cannotDeleteCustomer')}</h2>
            </div>
            
            <div className="space-y-3 mb-6">
              <p className="text-gray-600 dark:text-gray-300">
                <strong>{deleteWarningCustomer.name}</strong> {t('stillHasPending')}:
              </p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                Rs {deleteWarningCustomer.amount.toLocaleString()}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t('collectRemaining')}
              </p>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteWarning(false)
                  setDeleteWarningCustomer(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                {t('close')}
              </button>
              <button
                onClick={() => {
                  setShowDeleteWarning(false)
                  setPaymentCustomer(deleteWarningCustomer)
                  setDeleteWarningCustomer(null)
                  setPaymentAmount('')
                  setShowPaymentModal(true)
                }}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                {t('payUdharNow')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && paymentCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{t('payUdhar')}</h2>
            <form className="space-y-4" onSubmit={handlePaymentSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('customerName')}
                </label>
                <input
                  type="text"
                  value={paymentCustomer.name}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('currentAmount')}
                </label>
                <input
                  type="text"
                  value={`Rs ${paymentCustomer.amount.toLocaleString()}`}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white cursor-not-allowed font-semibold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('paymentAmount')} (Rs)
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder={t('enterAmountToPay')}
                  min="0"
                  max={paymentCustomer.amount}
                  step="0.01"
                  autoFocus
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('maximum')}: Rs {paymentCustomer.amount.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false)
                    setPaymentCustomer(null)
                    setPaymentAmount('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  {t('processPayment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UdharKhata
