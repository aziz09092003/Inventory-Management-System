import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, Package, Calendar, BarChart3, AlertCircle, CheckCircle, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useLanguage } from '../contexts/LanguageContext'
import { itemsAPI, salesAPI } from '../services/api'

function Forecasting() {
  const { t } = useLanguage()
  const [items, setItems] = useState([])
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [forecastData, setForecastData] = useState([])
  const [demandAnalysis, setDemandAnalysis] = useState({
    highDemand: [],
    lowDemand: [],
    critical: []
  })
  const [stockoutRisk, setStockoutRisk] = useState([])
  const [reorderSuggestions, setReorderSuggestions] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('30') // days

  useEffect(() => {
    loadData()
  }, [selectedPeriod])

  const loadData = async () => {
    setLoading(true)
    try {
      const itemsData = await itemsAPI.getAll()
      const salesData = await salesAPI.getAll()
      setItems(itemsData)
      setSales(salesData)
      
      // Process forecasting data
      analyzeData(itemsData, salesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeData = (itemsData, salesData) => {
    const daysToAnalyze = parseInt(selectedPeriod)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToAnalyze)

    // Calculate sales velocity for each item
    const itemSalesStats = itemsData.map(item => {
      const itemSales = salesData.filter(sale => 
        sale.items?.some(saleItem => saleItem.item_id === item.item_id) &&
        new Date(sale.date) >= cutoffDate
      )

      const totalQuantitySold = itemSales.reduce((sum, sale) => {
        const saleItem = sale.items.find(si => si.item_id === item.item_id)
        return sum + (saleItem?.quantity || 0)
      }, 0)

      const avgDailySales = totalQuantitySold / daysToAnalyze
      const daysUntilStockout = avgDailySales > 0 ? item.stock_quantity / avgDailySales : Infinity
      const reorderPoint = avgDailySales * 7 // 7 days lead time
      const optimalStock = avgDailySales * 30 // 30 days inventory

      return {
        ...item,
        totalSold: totalQuantitySold,
        avgDailySales: avgDailySales,
        daysUntilStockout: daysUntilStockout,
        reorderPoint: reorderPoint,
        optimalStock: optimalStock,
        demandTrend: totalQuantitySold > 0 ? (avgDailySales > 1 ? 'high' : avgDailySales > 0.3 ? 'medium' : 'low') : 'none',
        stockStatus: item.stock_quantity <= reorderPoint ? 'critical' : item.stock_quantity <= optimalStock * 0.5 ? 'low' : 'good'
      }
    })

    // Classify items by demand
    const highDemand = itemSalesStats
      .filter(item => item.demandTrend === 'high')
      .sort((a, b) => b.avgDailySales - a.avgDailySales)
      .slice(0, 10)

    const lowDemand = itemSalesStats
      .filter(item => item.totalSold === 0 || item.demandTrend === 'low')
      .sort((a, b) => a.avgDailySales - b.avgDailySales)
      .slice(0, 10)

    const critical = itemSalesStats
      .filter(item => item.stockStatus === 'critical' && item.avgDailySales > 0)
      .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout)

    // Items at risk of stockout
    const atRisk = itemSalesStats
      .filter(item => item.daysUntilStockout < 14 && item.daysUntilStockout > 0 && item.avgDailySales > 0)
      .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout)

    // Reorder suggestions
    const needsReorder = itemSalesStats
      .filter(item => item.stock_quantity <= item.reorderPoint && item.avgDailySales > 0)
      .sort((a, b) => (a.stock_quantity / a.avgDailySales) - (b.stock_quantity / b.avgDailySales))

    setDemandAnalysis({ highDemand, lowDemand, critical })
    setStockoutRisk(atRisk)
    setReorderSuggestions(needsReorder)

    // Prepare forecast chart data
    const forecast = itemSalesStats
      .filter(item => item.avgDailySales > 0)
      .slice(0, 10)
      .map(item => ({
        name: item.item_name.length > 15 ? item.item_name.substring(0, 15) + '...' : item.item_name,
        current: item.stock_quantity,
        predicted: Math.round(item.avgDailySales * 30),
        reorderPoint: Math.round(item.reorderPoint)
      }))

    setForecastData(forecast)
  }

  const getPriorityColor = (days) => {
    if (days < 7) return 'text-red-600 bg-red-50 dark:bg-red-900/20'
    if (days < 14) return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20'
    return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
  }

  const getDemandBadge = (trend) => {
    const badges = {
      high: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', text: 'High Demand' },
      medium: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', text: 'Medium' },
      low: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', text: 'Low Demand' },
      none: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300', text: 'No Sales' }
    }
    return badges[trend] || badges.none
  }

  const COLORS = ['#2C5F6F', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

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
              <BarChart3 className="w-6 h-6" style={{color: '#2C5F6F'}} />
              Demand Forecasting & Analysis
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Predictive insights to optimize inventory levels and prevent stockouts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Analysis Period:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
              style={{outlineColor: '#2C5F6F'}}
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="60">Last 60 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border-l-4" style={{borderColor: '#2C5F6F'}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Critical Items</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{demandAnalysis.critical.length}</p>
              <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Needs immediate attention
              </p>
            </div>
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Stockout Risk</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stockoutRisk.length}</p>
              <p className="text-xs text-orange-600 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Within 14 days
              </p>
            </div>
            <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/20">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">High Demand Items</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{demandAnalysis.highDemand.length}</p>
              <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Strong sales velocity
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Reorder Required</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{reorderSuggestions.length}</p>
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <Package className="w-3 h-3" />
                Below reorder point
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-6 h-6" style={{color: '#2C5F6F'}} />
          Stock Level Forecast (Next 30 Days)
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="current" fill="#2C5F6F" name="Current Stock" />
            <Bar dataKey="predicted" fill="#10b981" name="Predicted Demand (30d)" />
            <Bar dataKey="reorderPoint" fill="#f59e0b" name="Reorder Point" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Items Alert */}
        {demandAnalysis.critical.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-600" />
              Critical Stock Alerts
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {demandAnalysis.critical.map((item, index) => (
                <div key={index} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-white">{item.item_name}</h3>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="text-gray-600 dark:text-gray-400">
                          Current Stock: <span className="font-semibold text-red-600">{item.stock_quantity}</span>
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          Avg Daily Sales: <span className="font-semibold">{item.avgDailySales.toFixed(2)}</span>
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          Days Until Stockout: <span className="font-semibold text-red-600">
                            {item.daysUntilStockout < Infinity ? Math.floor(item.daysUntilStockout) + ' days' : 'N/A'}
                          </span>
                        </p>
                      </div>
                    </div>
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reorder Recommendations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Package className="w-6 h-6" style={{color: '#2C5F6F'}} />
            Reorder Recommendations
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {reorderSuggestions.length > 0 ? (
              reorderSuggestions.map((item, index) => (
                <div key={index} className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-white">{item.item_name}</h3>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="text-gray-600 dark:text-gray-400">
                          Current: <span className="font-semibold">{item.stock_quantity}</span> | 
                          Reorder Point: <span className="font-semibold">{Math.round(item.reorderPoint)}</span>
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          Suggested Order: <span className="font-semibold text-orange-600">
                            {Math.round(item.optimalStock - item.stock_quantity)} units
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                      Reorder Now
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">All items are well-stocked!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Demand Items */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            High Demand Items
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {demandAnalysis.highDemand.length > 0 ? (
              demandAnalysis.highDemand.map((item, index) => (
                <div key={index} className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-800 dark:text-white">{item.item_name}</h3>
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>Sold: <strong>{item.totalSold}</strong></span>
                        <span>Daily Avg: <strong>{item.avgDailySales.toFixed(2)}</strong></span>
                        <span>Stock: <strong>{item.stock_quantity}</strong></span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No high demand items in this period</p>
            )}
          </div>
        </div>

        {/* Low Demand / Slow Moving Items */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-blue-600" />
            Low Demand / Slow Moving Items
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {demandAnalysis.lowDemand.length > 0 ? (
              demandAnalysis.lowDemand.map((item, index) => (
                <div key={index} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-800 dark:text-white">{item.item_name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDemandBadge(item.demandTrend).color}`}>
                          {getDemandBadge(item.demandTrend).text}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>Sold: <strong>{item.totalSold}</strong></span>
                        <span>Stock: <strong>{item.stock_quantity}</strong></span>
                      </div>
                      {item.totalSold === 0 && (
                        <p className="text-xs text-orange-600 mt-1">Consider promotion or clearance</p>
                      )}
                    </div>
                    <ArrowDownRight className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">All items have good sales velocity</p>
            )}
          </div>
        </div>
      </div>

      {/* Stockout Risk Timeline */}
      {stockoutRisk.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-orange-600" />
            Stockout Risk Timeline (Next 14 Days)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stockoutRisk.map((item, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(item.daysUntilStockout)}`}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{item.item_name}</h3>
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="space-y-1 text-xs">
                  <p>
                    <strong className="text-red-600">
                      ~{Math.floor(item.daysUntilStockout)} days
                    </strong> until stockout
                  </p>
                  <p>Current: <strong>{item.stock_quantity}</strong> units</p>
                  <p>Daily Rate: <strong>{item.avgDailySales.toFixed(2)}</strong> units/day</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Forecasting
