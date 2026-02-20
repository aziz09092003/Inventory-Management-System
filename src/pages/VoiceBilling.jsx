import React, { useState, useEffect } from 'react'
import { Mic, MicOff, Plus, Trash2, ShoppingCart, Search, CheckCircle, X, BookOpen, FileText, User } from 'lucide-react'
import Receipt from '../components/Receipt'
import { itemsAPI, customersAPI, salesAPI, udharsAPI, billsAPI } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'

function VoiceBilling() {
  const { t } = useLanguage()
  const [billingMode, setBillingMode] = useState('voice') // 'voice' or 'manual'
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [parsedItem, setParsedItem] = useState(null)
  const [billItems, setBillItems] = useState([])
  const [showReceipt, setShowReceipt] = useState(false)
  
  // Manual Billing State
  const [items, setItems] = useState([])
  const [customers, setCustomers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [successModal, setSuccessModal] = useState({ show: false, message: '' })
  
  // Bill Option Modal State
  const [showBillOptionModal, setShowBillOptionModal] = useState(false)
  const [showUdharModal, setShowUdharModal] = useState(false)
  const [udharCustomerName, setUdharCustomerName] = useState('')
  const [udharSearchResults, setUdharSearchResults] = useState([])
  const [udharLoading, setUdharLoading] = useState(false)
  const [allUdhars, setAllUdhars] = useState([])

  // Load items and customers for manual billing
  useEffect(() => {
    if (billingMode === 'manual') {
      fetchItems()
    }
  }, [billingMode])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const itemsRes = await itemsAPI.getAll()
      console.log('Loaded items:', itemsRes.data)
      // Log first item to see structure
      if (itemsRes.data.length > 0) {
        console.log('First item structure:', itemsRes.data[0])
      }
      setItems(itemsRes.data)
    } catch (error) {
      console.error('Error fetching items:', error)
      alert('Failed to load items: ' + (error.message || 'Please try again'))
    } finally {
      setLoading(false)
    }
  }

  const mockVoiceCommands = [
    '2 kilo cheeni',
    '5 packet chai',
    '1 liter oil',
    '3 kilo atta',
  ]

  const handleVoiceInput = () => {
    if (!isListening) {
      setIsListening(true)
      // Simulate voice recognition with random command
      setTimeout(() => {
        const randomCommand = mockVoiceCommands[Math.floor(Math.random() * mockVoiceCommands.length)]
        setTranscript(randomCommand)
        parseCommand(randomCommand)
        setIsListening(false)
      }, 2000)
    }
  }

  const parseCommand = (command) => {
    // Simple parsing logic for demo
    const match = command.match(/(\d+)\s*(kilo|kg|packet|liter|litre|piece)\s*(.+)/)
    if (match) {
      const quantity = match[1]
      const unit = match[2]
      const itemName = match[3]
      
      const priceMap = {
        'cheeni': 100,
        'chai': 150,
        'oil': 400,
        'atta': 100,
        'sugar': 100,
        'tea': 150,
        'milk': 120,
      }

      const price = priceMap[itemName.toLowerCase()] || 50

      setParsedItem({
        name: itemName.charAt(0).toUpperCase() + itemName.slice(1),
        quantity: quantity,
        unit: unit,
        price: price,
        total: quantity * price
      })
    }
  }

  const addToBill = () => {
    if (parsedItem) {
      const item = { ...parsedItem, id: Date.now() }
      setBillItems([...billItems, item])
      setParsedItem(null)
      setTranscript('')
    }
  }

  const addManualItem = (item) => {
    const quantity = prompt(`Enter quantity for ${item.item_name}:`)
    if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
      return
    }

    const qty = Number(quantity)
    
    // Check if item has enough stock
    if (qty > item.stock) {
      alert(`Insufficient stock! Available: ${item.stock} ${item.unit}`)
      return
    }

    const billItem = {
      id: Date.now(),
      item_id: item.item_id,
      name: item.item_name,
      quantity: qty,
      unit: item.unit,
      price: item.sale_price,
      total: qty * item.sale_price,
      availableStock: item.stock
    }
    
    setBillItems([...billItems, billItem])
  }

  const removeFromBill = (id) => {
    setBillItems(billItems.filter(item => item.id !== id))
  }

  const calculateTotal = () => {
    return billItems.reduce((sum, item) => sum + item.total, 0)
  }

  // Step 1: Click Generate Bill -> Show option modal (Udhar or Receipt)
  const generateBill = async () => {
    if (billItems.length === 0) {
      alert('No items in bill!')
      return
    }
    
    // Show the option modal to choose between Udhar or View Receipt
    setShowBillOptionModal(true)
  }

  // Step 2a: User chooses "Add to Udhar"
  const handleAddToUdhar = async () => {
    setShowBillOptionModal(false)
    setShowUdharModal(true)
    setUdharCustomerName('')
    setUdharSearchResults([])
    
    // Fetch all customers and udhar entries to search
    try {
      setUdharLoading(true)
      const [customersRes, udharsRes] = await Promise.all([
        customersAPI.getAll(),
        udharsAPI.getAll()
      ])
      
      // Merge customers with their udhar data (similar to UdharKhata page)
      const customersWithUdhar = customersRes.data.map(customer => {
        const udhar = udharsRes.data.find(u => u.customer_id === customer.customer_id)
        return {
          customer_id: customer.customer_id,
          customer_name: customer.customer_name,
          total_amount: udhar?.total_amount || 0,
          direct_addition: udhar?.direct_addition || 0,
          direct_deduction: udhar?.direct_deduction || 0,
          effective_total: udhar?.effective_total || 0
        }
      })
      
      console.log('Customers with udhar:', customersWithUdhar)
      setAllUdhars(customersWithUdhar)
    } catch (error) {
      console.error('Error fetching udhars:', error)
    } finally {
      setUdharLoading(false)
    }
  }

  // Search for customer in udhar entries
  const searchUdharCustomer = async (searchName) => {
    setUdharCustomerName(searchName)
    if (searchName.trim() === '') {
      setUdharSearchResults([])
      return
    }
    
    // Fetch fresh data each time to ensure we have latest
    try {
      setUdharLoading(true)
      const [customersRes, udharsRes] = await Promise.all([
        customersAPI.getAll(),
        udharsAPI.getAll()
      ])
      
      // Merge customers with their udhar data
      const customersWithUdhar = customersRes.data.map(customer => {
        const udhar = udharsRes.data.find(u => u.customer_id === customer.customer_id)
        return {
          customer_id: customer.customer_id,
          customer_name: customer.customer_name,
          total_amount: udhar?.total_amount || 0,
          direct_addition: udhar?.direct_addition || 0,
          direct_deduction: udhar?.direct_deduction || 0,
          effective_total: udhar?.effective_total || 0
        }
      })
      
      setAllUdhars(customersWithUdhar)
      
      const results = customersWithUdhar.filter(customer => 
        customer.customer_name && customer.customer_name.toLowerCase().includes(searchName.toLowerCase())
      )
      console.log('Search results for "' + searchName + '":', results)
      setUdharSearchResults(results)
    } catch (error) {
      console.error('Error searching customers:', error)
      setUdharSearchResults([])
    } finally {
      setUdharLoading(false)
    }
  }

  // Add bill amount to selected customer's udhar
  const addBillToUdhar = async (customer) => {
    try {
      setUdharLoading(true)
      const billTotal = calculateTotal()
      
      // First, update inventory and create sales records
      const itemsRes = await itemsAPI.getAll()
      const currentItems = itemsRes.data

      // Verify stock availability
      for (const billItem of billItems) {
        const currentItem = currentItems.find(i => i.item_id === billItem.item_id)
        if (!currentItem) {
          alert(`Item ${billItem.name} not found in inventory!`)
          setUdharLoading(false)
          return
        }
        if (billItem.quantity > currentItem.stock_quantity) {
          alert(`Insufficient stock for ${billItem.name}! Available: ${currentItem.stock_quantity} ${currentItem.item_unit}`)
          setUdharLoading(false)
          return
        }
      }

      // Update inventory and create sales records
      for (const billItem of billItems) {
        const currentItem = currentItems.find(i => i.item_id === billItem.item_id)
        const newStock = currentItem.stock_quantity - billItem.quantity
        
        await itemsAPI.update(billItem.item_id, {
          stock_quantity: newStock
        })

        await salesAPI.create({
          item_id: billItem.item_id,
          quantity_sold: billItem.quantity,
          customer_id: customer.customer_id
        })
      }

      // Add bill total to customer's udhar using direct addition
      await udharsAPI.updateDirectAddition(customer.customer_id, billTotal)
      
      // Save bill to history
      await billsAPI.create({
        customer_name: customer.customer_name,
        customer_id: customer.customer_id,
        payment_type: 'udhar',
        total_amount: billTotal,
        items: billItems.map(item => ({
          item_id: item.item_id,
          item_name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.price,
          total_price: item.total
        }))
      })
      
      setUdharLoading(false)
      setShowUdharModal(false)
      setSuccessModal({ 
        show: true, 
        message: `₨ ${billTotal.toLocaleString()} ${t('addedToUdhar')} ${customer.customer_name}${t('udharAccount')} ${t('inventoryUpdated')}` 
      })
    } catch (error) {
      console.error('Error adding to udhar:', error)
      alert('Failed to add to udhar: ' + (error.response?.data?.detail || error.message))
      setUdharLoading(false)
    }
  }

  // Step 2b: User chooses "View Receipt" - process bill and show receipt
  const handleViewReceipt = async () => {
    setShowBillOptionModal(false)
    
    // For manual billing, update inventory and create sales records
    if (billingMode === 'manual') {
      try {
        setLoading(true)
        const itemsRes = await itemsAPI.getAll()
        const currentItems = itemsRes.data

        // Verify stock availability for all items
        for (const billItem of billItems) {
          const currentItem = currentItems.find(i => i.item_id === billItem.item_id)
          if (!currentItem) {
            alert(`Item ${billItem.name} not found in inventory!`)
            setLoading(false)
            return
          }
          if (billItem.quantity > currentItem.stock_quantity) {
            alert(`Insufficient stock for ${billItem.name}! Available: ${currentItem.stock_quantity} ${currentItem.item_unit}`)
            setLoading(false)
            return
          }
        }

        // Update inventory and create sales records for each item
        for (const billItem of billItems) {
          const currentItem = currentItems.find(i => i.item_id === billItem.item_id)
          const newStock = currentItem.stock_quantity - billItem.quantity
          
          // Update inventory
          await itemsAPI.update(billItem.item_id, {
            stock_quantity: newStock
          })

          // Create sales record
          await salesAPI.create({
            item_id: billItem.item_id,
            quantity_sold: billItem.quantity,
            customer_id: null  // No customer for cash payment
          })
        }

        // Save bill to history
        await billsAPI.create({
          customer_name: null,
          customer_id: null,
          payment_type: 'cash',
          total_amount: calculateTotal(),
          items: billItems.map(item => ({
            item_id: item.item_id,
            item_name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.price,
            total_price: item.total
          }))
        })

        setSuccessModal({ 
          show: true, 
          message: t('billGeneratedSuccess')
        })
        setLoading(false)
        return
      } catch (error) {
        console.error('Error updating inventory:', error)
        alert('Failed to update inventory: ' + (error.response?.data?.detail || error.message))
        setLoading(false)
        return
      }
    }

    setShowReceipt(true)
  }

  const handleSuccessOk = () => {
    setSuccessModal({ show: false, message: '' })
    setShowReceipt(true)
  }

  const handleCloseReceipt = () => {
    setShowReceipt(false)
    setBillItems([])
    setSelectedCustomer(null)
    // Refresh items to get updated stock quantities
    if (billingMode === 'manual') {
      fetchItems()
    }
  }

  // Filtered items for manual billing
  const filteredItems = items.filter(item =>
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.keywords?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filtered customers
  const filteredCustomers = customers.filter(customer =>
    customer.customer_name.toLowerCase().includes(customerSearchTerm.toLowerCase())
  )

  // persist bill items
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('ims_bill')
      if (raw) setBillItems(JSON.parse(raw))
    } catch (e) {}
  }, [])

  React.useEffect(() => {
    try { localStorage.setItem('ims_bill', JSON.stringify(billItems)) } catch (e) {}
  }, [billItems])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Billing System</h1>
      
      {/* Mode Toggle */}
      <div className="flex justify-end">
        <div className="flex gap-2 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
          <button
            onClick={() => setBillingMode('voice')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              billingMode === 'voice'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('voiceInputBilling')}
          </button>
          <button
            onClick={() => setBillingMode('manual')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              billingMode === 'manual'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('manualBilling')}
          </button>
        </div>
      </div>

      {/* Voice Billing Mode */}
      {billingMode === 'voice' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
        <div className="flex flex-col items-center">
          <button
            onClick={handleVoiceInput}
            disabled={isListening}
            className={`mb-6 w-32 h-32 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? 'bg-red-500 animate-pulse'
                : 'bg-blue-500 hover:bg-blue-600'
            } shadow-lg`}
          >
            {isListening ? (
              <MicOff className="w-16 h-16 text-white" />
            ) : (
              <Mic className="w-16 h-16 text-white" />
            )}
          </button>

          <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
            {isListening ? t('processing') : t('clickMicrophoneToSpeak')}
          </p>

          {/* Transcribed Text */}
          {transcript && (
            <div className="w-full max-w-2xl bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transcribed:</p>
              <p className="text-lg font-medium text-gray-800 dark:text-white">{transcript}</p>
            </div>
          )}

          {/* Parsed Output */}
          {parsedItem && (
            <div className="w-full max-w-2xl bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Parsed Item:</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Item Name:</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">{parsedItem.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Quantity:</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">
                    {parsedItem.quantity} {parsedItem.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Unit Price:</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">₨ {parsedItem.price}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total:</p>
                  <p className="text-lg font-semibold text-green-600">₨ {parsedItem.total}</p>
                </div>
              </div>
              <button
                onClick={addToBill}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add to Bill
              </button>
            </div>
          )}
        </div>
        </div>
      )}

      {/* Manual Billing Mode */}
      {billingMode === 'manual' && (
        <>
          {/* Items Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t('availableItems')}</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('searchItems')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading items...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredItems.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                    <p className="text-gray-500 dark:text-gray-400">No items found</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Try adding items in Inventory page first</p>
                  </div>
                ) : (
                  filteredItems.map(item => (
                    <div
                      key={item.item_id}
                      className={`bg-gradient-to-br rounded-xl p-5 shadow-sm hover:shadow-md transition-all ${
                        item.stock_quantity > 0
                          ? 'from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-600'
                          : 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-2 border-red-300 dark:border-red-600 opacity-70'
                      }`}
                    >
                      {/* Out of Stock Badge */}
                      {item.stock_quantity <= 0 && (
                        <div className="mb-2">
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            OUT OF STOCK
                          </span>
                        </div>
                      )}

                      {/* Item Name */}
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 truncate">
                        {item.item_name}
                      </h3>

                      {/* Price */}
                      <div className="mb-3">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          ₨ {item.unit_price}
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/ {item.item_unit}</span>
                        </p>
                      </div>

                      {/* Stock Info */}
                      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-600">
                        <p className={`text-sm ${item.stock_quantity <= 0 ? 'text-red-600 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                          Available: <span className="font-semibold">{item.stock_quantity} {item.item_unit}</span>
                        </p>
                      </div>

                      {/* Quantity Selector */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('quantity')}
                        </label>
                        <input
                          type="number"
                          min="0.1"
                          max={item.stock_quantity}
                          step="0.1"
                          defaultValue="1"
                          disabled={item.stock_quantity <= 0}
                          id={`qty-${item.item_id}`}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        onClick={() => {
                          const qtyInput = document.getElementById(`qty-${item.item_id}`)
                          const qty = parseFloat(qtyInput.value)
                          
                          if (isNaN(qty) || qty <= 0) {
                            alert('Please enter a valid quantity')
                            return
                          }
                          
                          if (qty > item.stock_quantity) {
                            alert(`Only ${item.stock_quantity} ${item.item_unit} available!`)
                            return
                          }

                          const billItem = {
                            id: Date.now(),
                            item_id: item.item_id,
                            name: item.item_name,
                            quantity: qty,
                            unit: item.item_unit,
                            price: item.unit_price,
                            total: qty * item.unit_price,
                            availableStock: item.stock_quantity
                          }
                          
                          setBillItems([...billItems, billItem])
                          
                          // Update the local items state to reflect reduced stock
                          setItems(prevItems => 
                            prevItems.map(i => 
                              i.item_id === item.item_id 
                                ? { ...i, stock_quantity: i.stock_quantity - qty }
                                : i
                            )
                          )
                          
                          qtyInput.value = '1'
                        }}
                        disabled={item.stock_quantity <= 0}
                        className={`w-full font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md ${
                          item.stock_quantity > 0
                            ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
                            : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingCart className="w-5 h-5" />
                        {t('addToCart')}
                      </button>
                    </div>
                    ))
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Current Bill */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6" />
          {showReceipt ? t('viewReceipt') : t('currentBill')}
        </h2>

        {/* Show Receipt inside Current Bill section */}
        {showReceipt ? (
          <Receipt 
            billItems={billItems} 
            total={calculateTotal()}
            onClose={handleCloseReceipt}
            embedded={true}
            inline={true}
          />
        ) : billItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>{t('noItemsAdded')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">{t('item')}</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">{t('qty')}</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">{t('price')}</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">{t('total')}</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">{t('action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {billItems.map((item) => (
                    <tr key={item.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 px-4 text-gray-800 dark:text-white">{item.name}</td>
                      <td className="py-3 px-4 text-gray-800 dark:text-white">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-gray-800 dark:text-white">₨ {item.price}</td>
                      <td className="py-3 px-4 text-gray-800 dark:text-white font-semibold">₨ {item.total}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => removeFromBill(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex items-center justify-between border-t dark:border-gray-700 pt-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('totalItems')}: {billItems.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('grandTotal')}:</p>
                <p className="text-3xl font-bold text-green-600">₨ {calculateTotal()}</p>
              </div>
            </div>

            <button
              onClick={generateBill}
              disabled={loading}
              className={`w-full mt-6 py-3 rounded-lg font-semibold transition-colors ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {loading ? t('processing') : t('generateBill')}
            </button>
          </>
        )}
      </div>

      {/* Success Modal */}
      {successModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Success!</h3>
                </div>
                <button
                  onClick={handleSuccessOk}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                  {successModal.message}
                </p>
                <button
                  onClick={handleSuccessOk}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  View Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bill Option Modal - Choose Udhar or Receipt */}
      {showBillOptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{t('completeBill')}</h3>
                </div>
                <button
                  onClick={() => setShowBillOptionModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <p className="text-center text-gray-700 dark:text-gray-300 mb-6">
                {t('totalAmount')}: <span className="font-bold text-2xl text-green-600">₨ {calculateTotal().toLocaleString()}</span>
              </p>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                {t('howToProceed')}
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Add to Udhar Button */}
                <button
                  onClick={handleAddToUdhar}
                  className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <BookOpen className="w-10 h-10" />
                  <span className="font-semibold">{t('addToUdhar')}</span>
                  <span className="text-xs opacity-80">{t('creditSale')}</span>
                </button>
                
                {/* View Receipt Button */}
                <button
                  onClick={handleViewReceipt}
                  className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <FileText className="w-10 h-10" />
                  <span className="font-semibold">{t('cashPayment')}</span>
                  <span className="text-xs opacity-80">{t('viewReceipt')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Udhar Customer Search Modal */}
      {showUdharModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{t('selectCustomer')}</h3>
                </div>
                <button
                  onClick={() => setShowUdharModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
                {t('searchForCustomer')} <span className="font-bold text-green-600">₨ {calculateTotal().toLocaleString()}</span> {t('toTheirUdhar')}
              </p>
              
              {/* Search Input */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('searchCustomerName')}
                  value={udharCustomerName}
                  onChange={(e) => searchUdharCustomer(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  autoFocus
                />
              </div>

              {/* Loading State */}
              {udharLoading && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">Processing...</p>
                </div>
              )}

              {/* Search Results */}
              {!udharLoading && udharSearchResults.length > 0 && (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {udharSearchResults.map((customer) => {
                    const currentUdhar = customer.effective_total || 0
                    return (
                      <button
                        key={customer.customer_id}
                        onClick={() => addBillToUdhar(customer)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors border-2 border-transparent hover:border-orange-500"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-orange-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-gray-800 dark:text-white">{customer.customer_name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {t('currentUdhar')}: ₨ {currentUdhar.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 dark:text-gray-400">{t('newTotal')}:</p>
                          <p className="font-bold text-orange-600">₨ {(currentUdhar + calculateTotal()).toLocaleString()}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* No Results */}
              {!udharLoading && udharCustomerName && udharSearchResults.length === 0 && (
                <div className="text-center py-8">
                  <User className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">{t('noCustomerFound')} "{udharCustomerName}"</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    {t('addCustomerFirst')}
                  </p>
                </div>
              )}

              {/* Initial State */}
              {!udharLoading && !udharCustomerName && (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">Type customer name to search</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VoiceBilling
