import React, { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, Package, RefreshCw, ArrowLeft, CheckCircle, XCircle, Calendar, Clock, PieChart, BarChart3, Target, Award, Filter, Search, Eye, Printer } from 'lucide-react'
import { PieChart as RechartsPie, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { billsAPI, itemsAPI, salesAPI } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'

function Sales() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('analytics') // 'analytics' or 'returns'
  const [loading, setLoading] = useState(true)
  const [bills, setBills] = useState([])
  const [items, setItems] = useState([])
  const [sales, setSales] = useState([])
  
  // Returns State
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [selectedBill, setSelectedBill] = useState(null)
  const [returnItems, setReturnItems] = useState([])
  const [returnReason, setReturnReason] = useState('')
  const [returnType, setReturnType] = useState('full') // 'full' or 'partial'
  const [returns, setReturns] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  
  // Analytics State
  const [dateRange, setDateRange] = useState('today')
  const [analyticsData, setAnalyticsData] = useState({
    hourlyBreakdown: [],
    categoryBreakdown: [],
    paymentMethodBreakdown: [],
    topSellingItems: [],
    profitByItem: [],
    salesTargets: { target: 100000, achieved: 0, percentage: 0 }
  })

  useEffect(() => {
    loadData()
  }, [dateRange])

  const loadData = async () => {
    setLoading(true)
    try {
      const [billsRes, itemsRes, salesRes, returnsData] = await Promise.all([
        billsAPI.getAll(),
        itemsAPI.getAll(),
        salesAPI.getAll(),
        loadReturns()
      ])
      
      setBills(billsRes.data || [])
      setItems(itemsRes.data || [])
      setSales(salesRes.data || [])
      setReturns(returnsData)
      
      calculateAnalytics(billsRes.data, itemsRes.data, salesRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadReturns = () => {
    try {
      const returnsData = localStorage.getItem('ims_returns')
      return returnsData ? JSON.parse(returnsData) : []
    } catch (e) {
      return []
    }
  }

  const saveReturns = (returnsData) => {
    try {
      localStorage.setItem('ims_returns', JSON.stringify(returnsData))
    } catch (e) {
      console.error('Failed to save returns:', e)
    }
  }

  const calculateAnalytics = (billsData, itemsData, salesData) => {
    const { start, end } = getDateRange()
    const filteredBills = billsData.filter(bill => {
      const billDate = new Date(bill.created_at)
      return billDate >= start && billDate <= end
    })

    // Hourly Breakdown
    const hourlyData = {}
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { hour: `${i}:00`, sales: 0, count: 0 }
    }
    
    filteredBills.forEach(bill => {
      const hour = new Date(bill.created_at).getHours()
      hourlyData[hour].sales += bill.total_amount
      hourlyData[hour].count += 1
    })
    
    const hourlyBreakdown = Object.values(hourlyData).filter(h => h.sales > 0)

    // Category Breakdown (mock categories based on items)
    const categoryData = {}
    filteredBills.forEach(bill => {
      bill.items?.forEach(item => {
        const category = getCategoryFromItem(item.item_name)
        if (!categoryData[category]) {
          categoryData[category] = { name: category, value: 0, count: 0 }
        }
        categoryData[category].value += item.total_price || (item.quantity * item.unit_price)
        categoryData[category].count += item.quantity
      })
    })
    const categoryBreakdown = Object.values(categoryData)

    // Payment Method Breakdown
    const paymentData = {}
    filteredBills.forEach(bill => {
      const method = bill.payment_type || 'cash'
      if (!paymentData[method]) {
        paymentData[method] = { name: method, value: 0, count: 0 }
      }
      paymentData[method].value += bill.total_amount
      paymentData[method].count += 1
    })
    const paymentMethodBreakdown = Object.values(paymentData)

    // Top Selling Items
    const itemSales = {}
    filteredBills.forEach(bill => {
      bill.items?.forEach(item => {
        if (!itemSales[item.item_id]) {
          itemSales[item.item_id] = {
            name: item.item_name,
            quantity: 0,
            revenue: 0
          }
        }
        itemSales[item.item_id].quantity += item.quantity
        itemSales[item.item_id].revenue += item.total_price || (item.quantity * item.unit_price)
      })
    })
    const topSellingItems = Object.values(itemSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)

    // Profit by Item (assuming 30% profit margin)
    const profitByItem = Object.values(itemSales)
      .map(item => ({
        name: item.name,
        revenue: item.revenue,
        profit: item.revenue * 0.3,
        margin: 30
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10)

    // Sales Targets
    const totalRevenue = filteredBills.reduce((sum, bill) => sum + bill.total_amount, 0)
    const salesTarget = dateRange === 'today' ? 10000 : dateRange === 'week' ? 50000 : dateRange === 'month' ? 200000 : 1000000
    
    setAnalyticsData({
      hourlyBreakdown,
      categoryBreakdown,
      paymentMethodBreakdown,
      topSellingItems,
      profitByItem,
      salesTargets: {
        target: salesTarget,
        achieved: totalRevenue,
        percentage: (totalRevenue / salesTarget * 100).toFixed(1)
      }
    })
  }

  const getDateRange = () => {
    const now = new Date()
    const today = new Date(now.setHours(0, 0, 0, 0))
    
    switch(dateRange) {
      case 'today':
        return { start: today, end: new Date() }
      case 'week':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - 7)
        return { start: weekStart, end: new Date() }
      case 'month':
        const monthStart = new Date(today)
        monthStart.setDate(today.getDate() - 30)
        return { start: monthStart, end: new Date() }
      case 'year':
        const yearStart = new Date(today)
        yearStart.setFullYear(today.getFullYear() - 1)
        return { start: yearStart, end: new Date() }
      default:
        return { start: today, end: new Date() }
    }
  }

  const getCategoryFromItem = (itemName) => {
    const name = itemName.toLowerCase()
    if (name.includes('rice') || name.includes('چاول') || name.includes('flour') || name.includes('آٹا')) return 'Grains'
    if (name.includes('sugar') || name.includes('چینی') || name.includes('salt')) return 'Seasonings'
    if (name.includes('oil') || name.includes('تیل') || name.includes('ghee')) return 'Cooking Oil'
    if (name.includes('milk') || name.includes('دودھ') || name.includes('butter')) return 'Dairy'
    if (name.includes('tea') || name.includes('چائے') || name.includes('coffee')) return 'Beverages'
    return 'Others'
  }

  const handleInitiateReturn = (bill) => {
    setSelectedBill(bill)
    setReturnItems(bill.items.map(item => ({ ...item, returnQty: 0, selected: false })))
    setReturnReason('')
    setReturnType('full')
    setShowReturnModal(true)
  }

  const toggleReturnItem = (itemId) => {
    setReturnItems(prev => prev.map(item => 
      item.item_id === itemId ? { ...item, selected: !item.selected, returnQty: !item.selected ? item.quantity : 0 } : item
    ))
  }

  const updateReturnQty = (itemId, qty) => {
    setReturnItems(prev => prev.map(item => 
      item.item_id === itemId ? { ...item, returnQty: Math.min(Math.max(0, qty), item.quantity) } : item
    ))
  }

  const processReturn = async () => {
    if (!selectedBill) return
    
    const itemsToReturn = returnType === 'full' 
      ? returnItems 
      : returnItems.filter(item => item.selected && item.returnQty > 0)

    if (itemsToReturn.length === 0) {
      alert('Please select items to return')
      return
    }

    if (!returnReason.trim()) {
      alert('Please provide a return reason')
      return
    }

    try {
      // Calculate refund amount
      const refundAmount = itemsToReturn.reduce((sum, item) => {
        const qty = returnType === 'full' ? item.quantity : item.returnQty
        return sum + (qty * item.unit_price)
      }, 0)

      // Update inventory - add stock back
      for (const item of itemsToReturn) {
        const qty = returnType === 'full' ? item.quantity : item.returnQty
        const currentItem = items.find(i => i.item_id === item.item_id)
        if (currentItem) {
          await itemsAPI.update(item.item_id, {
            stock_quantity: currentItem.stock_quantity + qty
          })
        }
      }

      // Create return record
      const returnRecord = {
        return_id: Date.now(),
        bill_id: selectedBill.bill_id,
        bill_number: selectedBill.bill_number,
        customer_name: selectedBill.customer_name,
        return_type: returnType,
        items: itemsToReturn.map(item => ({
          ...item,
          returned_qty: returnType === 'full' ? item.quantity : item.returnQty
        })),
        refund_amount: refundAmount,
        reason: returnReason,
        status: 'processed',
        created_at: new Date().toISOString()
      }

      const updatedReturns = [...returns, returnRecord]
      setReturns(updatedReturns)
      saveReturns(updatedReturns)

      // Update bill status
      // In a real system, you'd update the bill to mark it as returned
      
      alert(`Return processed successfully!\nRefund Amount: ₨${refundAmount.toFixed(2)}`)
      setShowReturnModal(false)
      loadData()
    } catch (error) {
      console.error('Error processing return:', error)
      alert('Failed to process return. Please try again.')
    }
  }

  const formatCurrency = (amount) => `₨${Number(amount).toLocaleString()}`
  const formatDate = (date) => new Date(date).toLocaleString()

  const COLORS = ['#2C5F6F', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

  const filteredBills = bills.filter(bill => 
    bill.bill_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{borderColor: '#2C5F6F'}}></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 mt-12">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6" style={{color: '#2C5F6F'}} />
              Sales Management & Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Advanced sales analytics, returns processing, and performance tracking
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
              style={{outlineColor: '#2C5F6F'}}
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors text-sm ${
            activeTab === 'analytics' ? 'text-white' : 'text-gray-700 dark:text-gray-300'
          }`}
          style={activeTab === 'analytics' ? {backgroundColor: '#2C5F6F'} : {}}
        >
          <BarChart3 className="w-5 h-5 inline mr-2" />
          Sales Analytics
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors text-sm ${
            activeTab === 'returns' ? 'text-white' : 'text-gray-700 dark:text-gray-300'
          }`}
          style={activeTab === 'returns' ? {backgroundColor: '#2C5F6F'} : {}}
        >
          <RefreshCw className="w-5 h-5 inline mr-2" />
          Returns & Refunds
        </button>
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          {/* Sales Target Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5" style={{color: '#2C5F6F'}} />
                Sales Target Progress
              </h2>
              <div className="text-right">
                <p className="text-xs text-gray-600 dark:text-gray-400">Target: {formatCurrency(analyticsData.salesTargets.target)}</p>
                <p className="text-xl font-bold" style={{color: '#2C5F6F'}}>
                  {analyticsData.salesTargets.percentage}%
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6">
              <div
                className="h-6 rounded-full flex items-center justify-end pr-3 text-white font-semibold text-xs transition-all duration-500"
                style={{
                  width: `${Math.min(analyticsData.salesTargets.percentage, 100)}%`,
                  backgroundColor: '#2C5F6F'
                }}
              >
                {analyticsData.salesTargets.percentage > 10 && `${formatCurrency(analyticsData.salesTargets.achieved)}`}
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white mt-1">
                    {formatCurrency(analyticsData.salesTargets.achieved)}
                  </p>
                </div>
                <div className="p-2 rounded-full" style={{backgroundColor: 'rgba(44, 95, 111, 0.1)'}}>
                  <DollarSign className="w-6 h-6" style={{color: '#2C5F6F'}} />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Profit</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white mt-1">
                    {formatCurrency(analyticsData.salesTargets.achieved * 0.3)}
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">30% margin</p>
                </div>
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Items Sold</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white mt-1">
                    {analyticsData.topSellingItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Returns Processed</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white mt-1">
                    {returns.length}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    {formatCurrency(returns.reduce((sum, r) => sum + r.refund_amount, 0))} refunded
                  </p>
                </div>
                <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/20">
                  <RefreshCw className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Hourly Sales Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6" style={{color: '#2C5F6F'}} />
              Hourly Sales Breakdown
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.hourlyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#2C5F6F" strokeWidth={2} name="Sales (₨)" />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} name="Transactions" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <PieChart className="w-6 h-6" style={{color: '#2C5F6F'}} />
                Sales by Category
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={analyticsData.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={entry => `${entry.name}: ${entry.count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            </div>

            {/* Payment Method Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-6 h-6" style={{color: '#2C5F6F'}} />
                Sales by Payment Method
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.paymentMethodBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#2C5F6F" name="Amount (₨)" />
                  <Bar dataKey="count" fill="#10b981" name="Transactions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Award className="w-6 h-6" style={{color: '#2C5F6F'}} />
              Best Selling Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">#</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Item Name</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Quantity Sold</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.topSellingItems.map((item, index) => (
                    <tr key={index} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 px-4">
                        <span className="font-bold text-lg" style={{color: index < 3 ? '#2C5F6F' : 'inherit'}}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-800 dark:text-white font-medium">{item.name}</td>
                      <td className="py-3 px-4 text-gray-800 dark:text-white">{item.quantity}</td>
                      <td className="py-3 px-4 text-gray-800 dark:text-white font-semibold">
                        {formatCurrency(item.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Profit Margin by Item */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
              Profit Margin by Item
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analyticsData.profitByItem}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#2C5F6F" name="Revenue (₨)" />
                <Bar dataKey="profit" fill="#10b981" name="Profit (₨)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Returns & Refunds Tab */}
      {activeTab === 'returns' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by bill number or customer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  style={{outlineColor: '#2C5F6F'}}
                />
              </div>
            </div>
          </div>

          {/* Returns Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-orange-500">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Returns</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{returns.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-red-500">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Refunded</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                {formatCurrency(returns.reduce((sum, r) => sum + r.refund_amount, 0))}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-green-500">
              <p className="text-sm text-gray-600 dark:text-gray-400">Return Rate</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                {bills.length > 0 ? ((returns.length / bills.length) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>

          {/* Available Bills for Return */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Select Bill for Return</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Bill #</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Customer</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Date</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Amount</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Items</th>
                    <th className="text-center py-3 px-4 text-gray-700 dark:text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.slice(0, 10).map(bill => (
                    <tr key={bill.bill_id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 px-4 font-mono text-sm" style={{color: '#2C5F6F'}}>{bill.bill_number}</td>
                      <td className="py-3 px-4 text-gray-800 dark:text-white">{bill.customer_name || 'Walk-in'}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                        {new Date(bill.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-gray-800 dark:text-white font-semibold">
                        {formatCurrency(bill.total_amount)}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{bill.items?.length || 0} items</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleInitiateReturn(bill)}
                          className="px-4 py-2 text-white rounded-lg transition-colors"
                          style={{backgroundColor: '#2C5F6F'}}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#234A57'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#2C5F6F'}
                        >
                          Process Return
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Return History */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Return History</h2>
            {returns.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No returns processed yet</p>
            ) : (
              <div className="space-y-4">
                {returns.map(returnRecord => (
                  <div key={returnRecord.return_id} className="border dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          Bill: {returnRecord.bill_number}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Customer: {returnRecord.customer_name || 'Walk-in'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(returnRecord.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          returnRecord.return_type === 'full' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {returnRecord.return_type} Return
                        </span>
                        <p className="text-lg font-bold mt-2" style={{color: '#2C5F6F'}}>
                          {formatCurrency(returnRecord.refund_amount)}
                        </p>
                      </div>
                    </div>
                    <div className="border-t dark:border-gray-700 pt-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        <strong>Reason:</strong> {returnRecord.reason}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Items:</strong> {returnRecord.items.map(item => 
                          `${item.item_name} (${item.returned_qty})`
                        ).join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Process Return</h3>
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Bill Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Bill Number</p>
                    <p className="font-semibold text-gray-800 dark:text-white">{selectedBill.bill_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Customer</p>
                    <p className="font-semibold text-gray-800 dark:text-white">{selectedBill.customer_name || 'Walk-in'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                    <p className="font-semibold text-gray-800 dark:text-white">{formatCurrency(selectedBill.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {new Date(selectedBill.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Return Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Return Type
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setReturnType('full')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                      returnType === 'full'
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <p className="font-semibold">Full Return</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Return all items</p>
                  </button>
                  <button
                    onClick={() => setReturnType('partial')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                      returnType === 'partial'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <p className="font-semibold">Partial Return</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Select specific items</p>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Items to Return
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {returnItems.map(item => (
                    <div
                      key={item.item_id}
                      className={`p-3 border rounded-lg ${
                        returnType === 'full' || item.selected
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {returnType === 'partial' && (
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={() => toggleReturnItem(item.item_id)}
                              className="w-5 h-5"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 dark:text-white">{item.item_name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Qty: {item.quantity} | Price: {formatCurrency(item.unit_price)}
                            </p>
                          </div>
                        </div>
                        {returnType === 'partial' && item.selected && (
                          <div className="flex items-center gap-2">
                            <label className="text-sm">Return Qty:</label>
                            <input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={item.returnQty}
                              onChange={(e) => updateReturnQty(item.item_id, parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border rounded dark:bg-gray-700"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Return Reason */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Return Reason *
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a reason...</option>
                  <option value="Defective Product">Defective Product</option>
                  <option value="Wrong Item Delivered">Wrong Item Delivered</option>
                  <option value="Customer Changed Mind">Customer Changed Mind</option>
                  <option value="Expired Product">Expired Product</option>
                  <option value="Quality Issues">Quality Issues</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Refund Calculation */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <p className="text-gray-700 dark:text-gray-300">Refund Amount:</p>
                  <p className="text-2xl font-bold" style={{color: '#2C5F6F'}}>
                    {formatCurrency(
                      returnType === 'full'
                        ? selectedBill.total_amount
                        : returnItems
                            .filter(item => item.selected)
                            .reduce((sum, item) => sum + (item.returnQty * item.unit_price), 0)
                    )}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={processReturn}
                  className="flex-1 px-6 py-3 text-white rounded-lg font-semibold transition-colors"
                  style={{backgroundColor: '#2C5F6F'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#234A57'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#2C5F6F'}
                >
                  Process Return & Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sales
