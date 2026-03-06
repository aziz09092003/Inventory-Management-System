import React, { useState, useEffect } from 'react'
import { Receipt, Search, Calendar, Filter, Eye, Trash2, DollarSign, TrendingUp, FileText } from 'lucide-react'
import { billsAPI } from '../services/api'
import ReceiptComponent from '../components/Receipt'
import { useLanguage } from '../contexts/LanguageContext'

function BillHistory() {
  const { t } = useLanguage()
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all', 'cash', 'udhar'
  const [selectedBill, setSelectedBill] = useState(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [todaySummary, setTodaySummary] = useState(null)

  useEffect(() => {
    fetchBills()
    fetchTodaySummary()
  }, [filterType])

  const fetchBills = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filterType !== 'all') params.payment_type = filterType
      
      const response = await billsAPI.getAll(params)
      setBills(response.data)
    } catch (error) {
      console.error('Error fetching bills:', error)
      alert('Failed to load bills: ' + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
    }
  }

  const fetchTodaySummary = async () => {
    try {
      const response = await billsAPI.getTodaySummary()
      setTodaySummary(response.data)
    } catch (error) {
      console.error('Error fetching summary:', error)
    }
  }

  const handleViewBill = (bill) => {
    setSelectedBill(bill)
    setShowReceiptModal(true)
  }

  const handleDeleteBill = async (billId) => {
    if (!confirm(t('deleteBillConfirm'))) return
    
    try {
      await billsAPI.delete(billId)
      alert(t('billDeleted'))
      fetchBills()
      fetchTodaySummary()
    } catch (error) {
      console.error('Error deleting bill:', error)
      alert(t('failedToDeleteBill') + ': ' + (error.response?.data?.detail || error.message))
    }
  }

  const filteredBills = bills.filter(bill => {
    const matchesSearch = searchTerm === '' || 
      bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bill.customer_name && bill.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    return `₨ ${Number(amount).toLocaleString()}`
  }

  return (
    <div className="space-y-4 mt-12">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-6 h-6" style={{color: '#2C5F6F'}} />
              {t('billHistoryTitle')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">{t('viewAndManageBills')}</p>
          </div>
        </div>
      </div>

      {/* Today's Summary Cards */}
      {todaySummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl p-4 text-white shadow-md" style={{background: 'linear-gradient(135deg, #2C5F6F 0%, #3D7A8A 100%)'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white opacity-80 text-xs">Today's Bills</p>
                <p className="text-2xl font-bold mt-0.5">{todaySummary.total_bills}</p>
              </div>
              <FileText className="w-8 h-8 text-white opacity-70" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs">{t('todayTotal')}</p>
                <p className="text-2xl font-bold mt-0.5">{formatCurrency(todaySummary.total_amount)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs">{t('cashSales')}</p>
                <p className="text-2xl font-bold mt-0.5">{formatCurrency(todaySummary.cash_amount)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs">{t('udharSales')}</p>
                <p className="text-2xl font-bold mt-0.5">{formatCurrency(todaySummary.udhar_amount)}</p>
              </div>
              <Receipt className="w-8 h-8 text-orange-200" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('searchBillOrCustomer')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>

          {/* Payment Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white appearance-none text-sm"
            >
              <option value="all">{t('allBills')}</option>
              <option value="cash">{t('cashOnly')}</option>
              <option value="udhar">{t('creditOnly')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">{t('noBillsFound')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t('billNumber')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t('customer')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t('dateTime')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t('type')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t('amount')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t('items')}
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredBills.map((bill) => (
                  <tr key={bill.bill_id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        {bill.bill_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {bill.customer_name || t('walkInCustomer')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(bill.created_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        bill.payment_type === 'cash' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
                      }`}>
                        {bill.payment_type === 'cash' ? t('cash') : t('credit')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatCurrency(bill.total_amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {bill.items?.length || 0} {t('items')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewBill(bill)}
                          className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                          style={{color: '#2C5F6F'}}
                          title="View Bill"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBill(bill.bill_id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete Bill"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Bill Details</h3>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ReceiptComponent
                items={selectedBill.items.map(item => ({
                  name: item.item_name,
                  quantity: item.quantity,
                  unit: item.unit,
                  unitPrice: item.unit_price,
                  totalPrice: item.total_price
                }))}
                total={selectedBill.total_amount}
                embedded={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BillHistory
