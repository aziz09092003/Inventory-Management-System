import React, { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Calendar, TrendingUp, Download, FileSpreadsheet } from 'lucide-react'
import { itemsAPI, salesAPI, customersAPI, udharsAPI, reportsAPI } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'

function Reports() {
  const { t } = useLanguage()
  const [dateRange, setDateRange] = useState('week')
  const [loading, setLoading] = useState(true)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    totalTransactions: 0,
    avgTransaction: 0,
    salesTrendData: [],
    itemFrequencyData: [],
    salesSummary: []
  })

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const handleDownloadReport = async () => {
    try {
      setDownloadLoading(true)
      const response = await reportsAPI.downloadInventoryReport()
      
      // Create blob from response data
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0]
      link.download = `Inventory_Report_${date}.xlsx`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Cleanup
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading report:', error)
      alert('Failed to download report. Please try again.')
    } finally {
      setDownloadLoading(false)
    }
  }

  const getDateRange = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch(dateRange) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 86400000) }
      case 'week':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        return { start: weekStart, end: new Date() }
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        return { start: monthStart, end: new Date() }
      case 'year':
        const yearStart = new Date(today.getFullYear(), 0, 1)
        return { start: yearStart, end: new Date() }
      default:
        return { start: today, end: new Date() }
    }
  }

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const [itemsRes, salesRes] = await Promise.all([
        itemsAPI.getAll(),
        salesAPI.getAll()
      ])

      const items = itemsRes.data
      const allSales = salesRes.data
      const { start, end } = getDateRange()

      // Filter sales by date range
      const filteredSales = allSales.filter(sale => {
        const saleDate = new Date(sale.dat)
        return saleDate >= start && saleDate <= end
      })

      // Calculate total revenue and transactions
      const totalRevenue = filteredSales.reduce((sum, sale) => {
        const item = items.find(i => i.item_id === sale.item_id)
        return sum + (item ? sale.quantity_sold * item.unit_price : 0)
      }, 0)

      const totalTransactions = filteredSales.length
      const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

      // Calculate profit (assuming 20% profit margin)
      const totalProfit = totalRevenue * 0.2

      // Generate sales trend data
      const salesByDate = {}
      filteredSales.forEach(sale => {
        const dateKey = new Date(sale.dat).toLocaleDateString('en-US', { weekday: 'short' })
        if (!salesByDate[dateKey]) {
          salesByDate[dateKey] = 0
        }
        const item = items.find(i => i.item_id === sale.item_id)
        if (item) {
          salesByDate[dateKey] += sale.quantity_sold * item.unit_price
        }
      })

      const salesTrendData = Object.entries(salesByDate).map(([date, sales]) => ({
        date,
        sales: Math.round(sales)
      }))

      // Generate item frequency data
      const itemSalesCount = {}
      filteredSales.forEach(sale => {
        if (!itemSalesCount[sale.item_id]) {
          const item = items.find(i => i.item_id === sale.item_id)
          itemSalesCount[sale.item_id] = {
            name: item?.item_name || 'Unknown',
            count: 0
          }
        }
        itemSalesCount[sale.item_id].count += sale.quantity_sold
      })

      const itemFrequencyData = Object.values(itemSalesCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
        .map(item => ({
          item: item.name,
          count: item.count
        }))

      // Generate sales summary
      const itemSalesSummary = {}
      filteredSales.forEach(sale => {
        if (!itemSalesSummary[sale.item_id]) {
          const item = items.find(i => i.item_id === sale.item_id)
          itemSalesSummary[sale.item_id] = {
            product: item?.item_name || 'Unknown',
            unit: item?.item_unit || '',
            quantity: 0,
            totalSale: 0,
            profit: 0
          }
        }
        const item = items.find(i => i.item_id === sale.item_id)
        if (item) {
          itemSalesSummary[sale.item_id].quantity += sale.quantity_sold
          const revenue = sale.quantity_sold * item.unit_price
          itemSalesSummary[sale.item_id].totalSale += revenue
          itemSalesSummary[sale.item_id].profit += revenue * 0.2
        }
      })

      const salesSummary = Object.values(itemSalesSummary)
        .sort((a, b) => b.totalSale - a.totalSale)
        .map(item => ({
          product: item.product,
          quantity: `${item.quantity} ${item.unit}`,
          totalSale: Math.round(item.totalSale),
          profit: Math.round(item.profit)
        }))

      setReportData({
        totalRevenue: Math.round(totalRevenue),
        totalProfit: Math.round(totalProfit),
        totalTransactions,
        avgTransaction: Math.round(avgTransaction),
        salesTrendData: salesTrendData.length > 0 ? salesTrendData : [{ date: 'No Data', sales: 0 }],
        itemFrequencyData: itemFrequencyData.length > 0 ? itemFrequencyData : [{ item: 'No Sales', count: 0 }],
        salesSummary: salesSummary.length > 0 ? salesSummary : []
      })

    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">{t('reportsAnalytics')}</h1>
        <button
          onClick={fetchReportData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          {t('refresh')}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reports...</p>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('dateRange')}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="today">{t('today')}</option>
                    <option value="week">{t('thisWeek')}</option>
                    <option value="month">{t('thisMonth')}</option>
                    <option value="year">{t('thisYear')}</option>
                  </select>
                </div>
              </div>

              <div className="flex-1">
                <button
                  onClick={handleDownloadReport}
                  disabled={downloadLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloadLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>{t('generating')}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>{t('downloadReport')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
              <p className="text-sm opacity-90 mb-1">{t('totalRevenue')}</p>
              <p className="text-3xl font-bold">₨ {reportData.totalRevenue.toLocaleString()}</p>
              <p className="text-sm mt-2 opacity-90">{dateRange === 'today' ? t('today') : `This ${dateRange}`}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
              <p className="text-sm opacity-90 mb-1">{t('totalProfit')}</p>
              <p className="text-3xl font-bold">₨ {reportData.totalProfit.toLocaleString()}</p>
              <p className="text-sm mt-2 opacity-90">20% margin</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
              <p className="text-sm opacity-90 mb-1">{t('totalTransactions')}</p>
              <p className="text-3xl font-bold">{reportData.totalTransactions}</p>
              <p className="text-sm mt-2 opacity-90">Sales count</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md p-6 text-white">
              <p className="text-sm opacity-90 mb-1">{t('avgTransaction')}</p>
              <p className="text-3xl font-bold">₨ {reportData.avgTransaction.toLocaleString()}</p>
              <p className="text-sm mt-2 opacity-90">Per sale</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Trend Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t('dailySalesTrend')}</h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="date" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff'
                    }} 
                  />
                  <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Item Frequency Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">{t('itemFrequency')}</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.itemFrequencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="item" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff'
                    }} 
                  />
                  <Bar dataKey="count" fill="#10B981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales Summary Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t('salesSummary')}</h2>
            </div>
            {reportData.salesSummary.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="text-left py-4 px-6 text-gray-700 dark:text-gray-300 font-semibold">#</th>
                      <th className="text-left py-4 px-6 text-gray-700 dark:text-gray-300 font-semibold">{t('product')}</th>
                      <th className="text-left py-4 px-6 text-gray-700 dark:text-gray-300 font-semibold">{t('quantity')}</th>
                      <th className="text-left py-4 px-6 text-gray-700 dark:text-gray-300 font-semibold">{t('totalSale')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.salesSummary.map((item, index) => (
                      <tr key={index} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-4 px-6 text-gray-800 dark:text-white">{index + 1}</td>
                        <td className="py-4 px-6 text-gray-800 dark:text-white font-medium">{item.product}</td>
                        <td className="py-4 px-6 text-gray-600 dark:text-gray-400">{item.quantity}</td>
                        <td className="py-4 px-6 text-gray-800 dark:text-white">₨ {item.totalSale.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-700 font-bold">
                    <tr>
                      <td colSpan="3" className="py-4 px-6 text-gray-800 dark:text-white text-right">{t('total').toUpperCase()}:</td>
                      <td className="py-4 px-6 text-gray-800 dark:text-white">
                        ₨ {reportData.salesSummary.reduce((sum, item) => sum + item.totalSale, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">{t('noSalesData')}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Reports
