import React, { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Filter, AlertCircle } from 'lucide-react'
import { itemsAPI } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'

function Inventory() {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const statusOptions = ['all', 'Critical', 'Low', 'Good']

  // Supported Urdu units
  const urduUnits = ['کلو', 'گرام', 'پاؤ', 'چھٹانک', 'لیٹر', 'ملی لیٹر', 'عدد', 'درجن', 'پیکٹ', 'ڈبہ', 'بوتل', 'بوری']

  // New item form state
  const [newName, setNewName] = useState('')
  const [newStock, setNewStock] = useState(0)
  const [newUnit, setNewUnit] = useState('کلو')
  const [newPrice, setNewPrice] = useState(0)

  // Load items from localStorage
  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await itemsAPI.getAll()
      setItems(response.data)
    } catch (err) {
      if (err?.response?.status === 401) {
        setError('Please log in to view items (unauthorized).')
      } else {
        setError('Failed to load items. Please try again.')
      }
      console.error('Error fetching items:', err)
      console.error('Error details:', err.response?.data || err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'text-red-600 bg-red-100' }
    if (stock < 10) return { text: 'Critical', color: 'text-red-600 bg-red-100' }
    if (stock < 20) return { text: 'Low', color: 'text-yellow-600 bg-yellow-100' }
    return { text: 'Good', color: 'text-green-600 bg-green-100' }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.item_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const status = getStockStatus(item.stock_quantity)
    const matchesStatus = selectedStatus === 'all' || status.text === selectedStatus
    return matchesSearch && matchesStatus
  })

  const handleDelete = async (id) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await itemsAPI.delete(id)
        setItems(items.filter(item => item.item_id !== id))
      } catch (err) {
        alert(t('failedToDelete') + ': ' + (err.response?.data?.detail || err.message))
      }
    }
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    try {
      const itemData = {
        item_name: newName || 'Unnamed Item',
        item_unit: newUnit || 'کلو',
        unit_price: Number(newPrice) || 0,
        stock_quantity: Number(newStock) || 0,
      }
      const response = await itemsAPI.create(itemData)
      setItems([response.data, ...items])
      setShowAddModal(false)
      // reset form
      setNewName('')
      setNewStock(0)
      setNewUnit('کلو')
      setNewPrice(0)
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message
      // If it's a validation error array, format it
      if (Array.isArray(errorMsg)) {
        const errors = errorMsg.map(e => e.msg).join(', ')
        alert('Failed to add item: ' + errors)
      } else {
        alert('Failed to add item: ' + errorMsg)
      }
      console.error('Add item error:', err.response?.data)
    }
  }

  const handleEditClick = (item) => {
    setEditingItem(item)
    setNewName(item.item_name)
    setNewStock(item.stock_quantity)
    setNewUnit(item.item_unit)
    setNewPrice(item.unit_price)
    setShowEditModal(true)
  }

  const handleEditItem = async (e) => {
    e.preventDefault()
    try {
      const updateData = {
        item_name: newName || 'Unnamed Item',
        item_unit: newUnit || 'کلو',
        unit_price: Number(newPrice) || 0,
        stock_quantity: Number(newStock) || 0,
      }
      const response = await itemsAPI.update(editingItem.item_id, updateData)
      const updatedItems = items.map(item => 
        item.item_id === editingItem.item_id ? response.data : item
      )
      setItems(updatedItems)
      setShowEditModal(false)
      setEditingItem(null)
      // reset form
      setNewName('')
      setNewStock(0)
      setNewUnit('کلو')
      setNewPrice(0)
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message
      // If it's a validation error array, format it
      if (Array.isArray(errorMsg)) {
        const errors = errorMsg.map(e => e.msg).join(', ')
        alert('Failed to update item: ' + errors)
      } else {
        alert('Failed to update item: ' + errorMsg)
      }
      console.error('Update item error:', err.response?.data)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">{t('inventory')}</h1>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-red-800 font-medium">{error}</p>
            <p className="text-red-600 text-sm">Unable to load items. Please refresh the page.</p>
            <button 
              onClick={fetchItems}
              className="mt-2 text-sm bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading items...</p>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('searchItems')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div className="relative md:w-48">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none cursor-pointer"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? t('allStatus') : status}
                </option>
              ))}
            </select>
          </div>

          {/* Add Item Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 justify-center shadow-lg md:w-auto"
          >
            <Plus className="w-5 h-5" />
            {t('addNewItem')}
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left py-4 px-6 text-gray-700 dark:text-gray-300 font-semibold">#</th>
                <th className="text-left py-4 px-6 text-gray-700 dark:text-gray-300 font-semibold">{t('itemName')}</th>
                <th className="text-left py-4 px-6 text-gray-700 dark:text-gray-300 font-semibold">{t('stock')}</th>
                <th className="text-left py-4 px-6 text-gray-700 dark:text-gray-300 font-semibold">{t('price')}</th>
                <th className="text-left py-4 px-6 text-gray-700 dark:text-gray-300 font-semibold">{t('status')}</th>
                <th className="text-left py-4 px-6 text-gray-700 dark:text-gray-300 font-semibold">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-500 dark:text-gray-400">
                    {error ? 'Failed to load items' : t('noItemsFound')}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => {
                  const status = getStockStatus(item.stock_quantity)
                  return (
                    <tr key={item.item_id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-4 px-6 text-gray-800 dark:text-white">{index + 1}</td>
                      <td className="py-4 px-6 text-gray-800 dark:text-white font-medium">{item.item_name}</td>
                      <td className="py-4 px-6 text-gray-800 dark:text-white">
                        {item.stock_quantity} {item.item_unit}
                      </td>
                      <td className="py-4 px-6 text-gray-800 dark:text-white">₨ {item.unit_price}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEditClick(item)}
                            className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.item_id)}
                            className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{t('addNewItem')}</h2>
            <form className="space-y-4" onSubmit={handleAddItem}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('itemName')}
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder={t('egSugar')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unit
                  </label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    {urduUnits.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('unitPrice')} (₨)
                </label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
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
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  // onSubmit={}
                  
                >
                  {t('addItem')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{t('editItem')}</h2>
            <form className="space-y-4" onSubmit={handleEditItem}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('itemName')}
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder={t('egSugar')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unit
                  </label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    {urduUnits.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('unitPrice')} (₨)
                </label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingItem(null)
                    setNewName('')
                    setNewStock(0)
                    setNewUnit('کلو')
                    setNewPrice(0)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  {t('updateItem')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button (visible on mobile/when scrolled) */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all hover:scale-110 z-30 lg:hidden"
        title="Add New Item"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}

export default Inventory
