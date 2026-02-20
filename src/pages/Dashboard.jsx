import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Package, AlertTriangle, Mic, Book, BarChart } from 'lucide-react'
import { itemsAPI, salesAPI, customersAPI, udharsAPI } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'

function Dashboard() {
  const { t } = useLanguage()
  const [stats, setStats] = useState([
    { title: t('todaySales'), value: '₨ 0', change: '+0%', color: 'blue', icon: TrendingUp },
    { title: t('totalItems'), value: '0', change: '+0', color: 'green', icon: Package },
    { title: t('lowStock'), value: '0', change: 'Alert', color: 'red', icon: AlertTriangle },
    { title: t('udharAmount'), value: '₨ 0', change: '0 people', color: 'yellow', icon: Book },
  ])
  
  const [topItems, setTopItems] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all necessary data
      const [itemsRes, salesRes, customersRes, udharsRes] = await Promise.all([
        itemsAPI.getAll(),
        salesAPI.getAll(),
        customersAPI.getAll(),
        udharsAPI.getAll()
      ])

      const items = itemsRes.data
      const sales = salesRes.data
      const customers = customersRes.data
      const udhars = udharsRes.data

      // Calculate Today's Sales
      const today = new Date().toISOString().split('T')[0]
      const todaySales = sales.filter(sale => {
        const saleDate = new Date(sale.dat).toISOString().split('T')[0]
        return saleDate === today
      })
      
      // Calculate revenue from today's sales
      const todayRevenue = todaySales.reduce((sum, sale) => {
        const item = items.find(i => i.item_id === sale.item_id)
        if (item) {
          return sum + (sale.quantity_sold * item.unit_price)
        }
        return sum
      }, 0)

      // Calculate Total Items
      const totalItems = items.length

      // Calculate Low Stock Items (stock <= 20)
      const lowStock = items.filter(item => item.stock_quantity > 0 && item.stock_quantity <= 20)
      const lowStockCount = lowStock.length

      // Calculate Total Udhar Amount and customers with udhar
      const totalUdhar = udhars.reduce((sum, udhar) => {
        const effectiveTotal = (udhar.total_amount || 0) + (udhar.direct_addition || 0) - (udhar.direct_deduction || 0)
        return sum + effectiveTotal
      }, 0)
      const customersWithUdhar = udhars.filter(udhar => {
        const effectiveTotal = (udhar.total_amount || 0) + (udhar.direct_addition || 0) - (udhar.direct_deduction || 0)
        return effectiveTotal > 0
      }).length

      // Update stats
      setStats([
        { 
          title: t('todaySales'), 
          value: `₨ ${todayRevenue.toLocaleString()}`, 
          change: `${todaySales.length} sales`, 
          color: 'blue', 
          icon: TrendingUp 
        },
        { 
          title: t('totalItems'), 
          value: totalItems.toString(), 
          change: `${items.filter(i => i.stock_quantity > 0).length} in stock`, 
          color: 'green', 
          icon: Package 
        },
        { 
          title: t('lowStock'), 
          value: lowStockCount.toString(), 
          change: lowStockCount > 0 ? 'Alert' : 'All Good', 
          color: 'red', 
          icon: AlertTriangle 
        },
        { 
          title: t('udharAmount'), 
          value: `₨ ${totalUdhar.toLocaleString()}`, 
          change: `${customersWithUdhar} people`, 
          color: 'yellow', 
          icon: Book 
        },
      ])

      // Calculate top selling items (by quantity sold)
      const itemSalesMap = {}
      sales.forEach(sale => {
        const item = items.find(i => i.item_id === sale.item_id)
        if (!itemSalesMap[sale.item_id]) {
          itemSalesMap[sale.item_id] = {
            item_id: sale.item_id,
            item_name: item?.item_name || 'Unknown',
            quantity_sold: 0,
            revenue: 0,
            unit: item?.item_unit || ''
          }
        }
        itemSalesMap[sale.item_id].quantity_sold += sale.quantity_sold || 0
        if (item) {
          itemSalesMap[sale.item_id].revenue += (sale.quantity_sold * item.unit_price)
        }
      })

      const topSellingItems = Object.values(itemSalesMap)
        .sort((a, b) => b.quantity_sold - a.quantity_sold)
        .slice(0, 5)
        .map(item => ({
          name: item.item_name,
          sold: item.quantity_sold,
          unit: item.unit,
          revenue: `₨ ${item.revenue.toLocaleString()}`
        }))

      setTopItems(topSellingItems.length > 0 ? topSellingItems : [
        { name: 'No sales yet', sold: 0, unit: '', revenue: '₨ 0' }
      ])

      // Get low stock items with details
      const lowStockDetails = lowStock
        .sort((a, b) => a.stock_quantity - b.stock_quantity)
        .slice(0, 5)
        .map(item => ({
          name: item.item_name,
          stock: item.stock_quantity,
          unit: item.item_unit,
          status: item.stock_quantity < 10 ? 'critical' : 'low'
        }))

      setLowStockItems(lowStockDetails.length > 0 ? lowStockDetails : [])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const shortcuts = [
    { name: t('voiceBilling'), path: '/voice-billing', icon: Mic, color: 'bg-blue-500' },
    { name: t('inventory'), path: '/inventory', icon: Package, color: 'bg-green-500' },
    { name: t('udharKhata'), path: '/udhar', icon: Book, color: 'bg-yellow-500' },
    { name: t('reports'), path: '/reports', icon: BarChart, color: 'bg-purple-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">{t('dashboard')}</h1>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          {t('refresh')}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
              <span className={`text-sm font-medium text-${stat.color}-600`}>{stat.change}</span>
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Shortcuts */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">{t('quickActions')}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {shortcuts.map((shortcut) => (
            <Link
              key={shortcut.path}
              to={shortcut.path}
              className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className={`${shortcut.color} p-4 rounded-full mb-3`}>
                <shortcut.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                {shortcut.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sold Items */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            {t('topSellingItems')}
          </h2>
          <div className="space-y-3">
            {topItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.sold} {item.unit} sold
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-green-600">{item.revenue}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            {t('lowStockAlerts')}
          </h2>
          <div className="space-y-3">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    item.status === 'critical'
                      ? 'bg-red-50 border-red-500 dark:bg-red-900/20'
                      : 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">{item.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Only {item.stock} {item.unit} left
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        item.status === 'critical'
                          ? 'bg-red-200 text-red-800'
                          : 'bg-yellow-200 text-yellow-800'
                      }`}
                    >
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p className="text-gray-600 dark:text-gray-400">All items are well stocked!</p>
              </div>
            )}
            <Link
              to="/inventory"
              className="block text-center py-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              View All Inventory →
            </Link>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  )
}

export default Dashboard
