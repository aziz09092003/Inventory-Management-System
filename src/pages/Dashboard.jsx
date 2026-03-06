import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Package, AlertTriangle, Mic, Book, BarChart, Layers, ShoppingBag } from 'lucide-react'
import { itemsAPI, salesAPI, customersAPI, udharsAPI } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'

function Dashboard() {
  const { t } = useLanguage()
  const [stats, setStats] = useState([
    { title: 'Total Products', value: '0', change: '+0', bgColor: 'bg-emerald-50', iconColor: 'text-emerald-600', icon: Package },
    { title: 'Orders', value: '0', change: '+0', bgColor: 'rgba(44, 95, 111, 0.1)', iconColor: '#2C5F6F', icon: Layers },
    { title: 'Total Stock', value: '0', change: '+0', bgColor: 'rgba(44, 95, 111, 0.1)', iconColor: '#2C5F6F', icon: TrendingUp },
    { title: 'Out of Stock', value: '0', change: 'Alert', bgColor: 'bg-orange-50', iconColor: 'text-orange-600', icon: ShoppingBag },
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
          title: 'Total Products', 
          value: totalItems.toString(), 
          change: `${items.filter(i => i.stock_quantity > 0).length} in stock`, 
          bgColor: 'bg-emerald-50',
          iconColor: 'text-emerald-600',
          icon: Package 
        },
        { 
          title: 'Orders', 
          value: sales.length.toString(), 
          change: `${todaySales.length} today`, 
          bgColor: 'rgba(44, 95, 111, 0.1)',
          iconColor: '#2C5F6F',
          icon: Layers 
        },
        { 
          title: 'Total Stock',
          value: items.reduce((sum, item) => sum + item.stock_quantity, 0).toString(),
          change: `${totalItems} items`,
          bgColor: 'rgba(44, 95, 111, 0.1)',
          iconColor: '#2C5F6F',
          icon: TrendingUp
        },
        { 
          title: 'Out of Stock', 
          value: items.filter(i => i.stock_quantity === 0).length.toString(), 
          change: lowStockCount > 0 ? `${lowStockCount} low` : 'All Good', 
          bgColor: 'bg-orange-50',
          iconColor: 'text-orange-600',
          icon: ShoppingBag 
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
    { name: t('voiceBilling'), path: '/voice-billing', icon: Mic, color: '#2C5F6F' },
    { name: t('inventory'), path: '/inventory', icon: Package, color: 'bg-green-500' },
    { name: t('udharKhata'), path: '/udhar', icon: Book, color: 'bg-yellow-500' },
    { name: t('reports'), path: '/reports', icon: BarChart, color: 'bg-purple-500' },
  ]

  return (
    <div className="space-y-4 mt-12">
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{borderColor: '#2C5F6F'}}></div>
          <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Over View Section Container */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Over View</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <div
                  key={stat.title}
                  className="bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div 
                      className={`p-3 rounded-xl ${stat.bgColor.startsWith('bg-') ? stat.bgColor : ''} dark:bg-gray-700`}
                      style={!stat.bgColor.startsWith('bg-') ? {backgroundColor: stat.bgColor} : {}}
                    >
                      <stat.icon 
                        className={`w-6 h-6 ${stat.iconColor.startsWith('text-') ? stat.iconColor : ''} dark:text-gray-300`}
                        style={!stat.iconColor.startsWith('text-') ? {color: stat.iconColor} : {}}
                      />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-3xl font-bold text-gray-800 dark:text-white mb-0.5">{stat.value}</p>
                      <h3 className="text-gray-500 dark:text-gray-400 text-xs">{stat.title}</h3>
                    </div>
                    {index === 3 && (
                      <div className="text-gray-300 dark:text-gray-600">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* No of users */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">No of users</h2>
                <div className="text-gray-300 dark:text-gray-600">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                  </svg>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                  <svg className="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mb-1">583 K</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Total Customers</p>
            </div>

            {/* Inventory Values - Pie Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Inventory Values</h2>
              <div className="flex flex-col items-center">
                <div className="relative w-40 h-40 mb-4">
                  {/* Donut Chart */}
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle cx="50" cy="50" r="35" fill="none" stroke="#5D9CAD" strokeWidth="15" strokeDasharray="140 220" />
                    <circle cx="50" cy="50" r="35" fill="none" stroke="#B8D8E3" strokeWidth="15" strokeDasharray="70 220" strokeDashoffset="-140" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-2xl font-bold text-gray-800 dark:text-white">68%</span>
                  </div>
                </div>
                <div className="space-y-2 w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{backgroundColor: '#5D9CAD'}}></div>
                    <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">Sold units</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{backgroundColor: '#B8D8E3'}}></div>
                    <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">Total units</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top 10 Stores by sales */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Top 10 Stores by sales</h2>
              <div className="space-y-3">
                {topItems.length > 0 && topItems[0].name !== 'No sales yet' ? topItems.slice(0, 10).map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400 text-xs truncate flex-1">{item.name}</span>
                      <span className="text-gray-800 dark:text-white font-semibold text-xs ml-2">{item.sold}{item.unit ? ` ${item.unit}` : ''}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min((item.sold / (topItems[0]?.sold || 1)) * 100, 100)}%`,
                          backgroundColor: '#5D9CAD'
                        }}
                      ></div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-xs">No sales yet</p>
                  </div>  
                )}
              </div>
            </div>
          </div>

          {/* Expense vs Profit Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Expense vs Profit</h2>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Last 6 months</span>
            </div>
            <div className="h-52 flex items-center justify-center text-gray-400 dark:text-gray-500">
              <div className="text-center">
                <BarChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Chart visualization</p>
                <p className="text-xs text-gray-400 mt-1">(Line chart showing expense vs profit trends)</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard
