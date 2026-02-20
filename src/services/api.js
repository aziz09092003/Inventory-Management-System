// LocalStorage-based API (No backend required)
// All data is stored in browser localStorage

// Helper function to get data from localStorage
const getStorageData = (key, defaultValue = []) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  } catch (e) {
    return defaultValue
  }
}

// Helper function to set data in localStorage
const setStorageData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save to localStorage:', e)
  }
}

// Initialize demo data if not exists
const initializeDemoData = () => {
  if (!localStorage.getItem('ims_items')) {
    const demoItems = [
      { item_id: 1, item_name: 'چاول (Rice)', item_unit: 'کلو', unit_price: 150, stock_quantity: 50, created_at: new Date().toISOString() },
      { item_id: 2, item_name: 'آٹا (Flour)', item_unit: 'کلو', unit_price: 80, stock_quantity: 100, created_at: new Date().toISOString() },
      { item_id: 3, item_name: 'چینی (Sugar)', item_unit: 'کلو', unit_price: 120, stock_quantity: 15, created_at: new Date().toISOString() },
      { item_id: 4, item_name: 'تیل (Oil)', item_unit: 'لیٹر', unit_price: 400, stock_quantity: 25, created_at: new Date().toISOString() },
      { item_id: 5, item_name: 'دودھ (Milk)', item_unit: 'لیٹر', unit_price: 180, stock_quantity: 8, created_at: new Date().toISOString() },
    ]
    setStorageData('ims_items', demoItems)
  }
  
  if (!localStorage.getItem('ims_customers')) {
    const demoCustomers = [
      { customer_id: 1, customer_name: 'احمد علی', phone_number: '03001234567', created_at: new Date().toISOString() },
      { customer_id: 2, customer_name: 'فاطمہ بی بی', phone_number: '03007654321', created_at: new Date().toISOString() },
    ]
    setStorageData('ims_customers', demoCustomers)
  }

  if (!localStorage.getItem('ims_sales')) {
    setStorageData('ims_sales', [])
  }

  if (!localStorage.getItem('ims_bills')) {
    setStorageData('ims_bills', [])
  }

  if (!localStorage.getItem('ims_udhars')) {
    setStorageData('ims_udhars', [])
  }

  if (!localStorage.getItem('ims_udhar_items')) {
    setStorageData('ims_udhar_items', [])
  }
}

// Initialize data on load
initializeDemoData()

// Simulate API response structure
const mockResponse = (data) => Promise.resolve({ data })

// Auth API
export const authAPI = {
  register: async (payload) => {
    const users = getStorageData('ims_users', [])
    const existingUser = users.find(u => u.email === payload.email)
    if (existingUser) {
      throw new Error('User already exists')
    }
    const newUser = {
      user_id: Date.now(),
      email: payload.email,
      username: payload.username,
      created_at: new Date().toISOString()
    }
    users.push(newUser)
    setStorageData('ims_users', users)
    return mockResponse(newUser)
  },
  
  login: async (payload) => {
    const users = getStorageData('ims_users', [])
    const user = users.find(u => u.email === payload.email)
    if (!user) {
      throw new Error('Invalid credentials')
    }
    // Generate a mock token
    const token = `mock_token_${Date.now()}`
    return mockResponse({ access_token: token, user })
  },
  
  me: async () => {
    const token = localStorage.getItem('ims_token')
    if (!token) {
      throw new Error('Not authenticated')
    }
    const user = JSON.parse(localStorage.getItem('ims_user') || '{}')
    return mockResponse(user)
  },
}

// Voice Authentication API (Mock - returns placeholder data)
export const voiceAuthAPI = {
  getParagraph: () => mockResponse({ 
    text: 'یہ ایک ٹیسٹ پیراگراف ہے۔ براہ کرم اسے پڑھیں۔' 
  }),
  registerVoice: () => mockResponse({ success: true, message: 'Voice registered' }),
  loginWithVoice: () => {
    throw new Error('Voice authentication not available in frontend-only mode')
  },
  getStatus: () => mockResponse({ has_voice: false }),
}

// Items API
export const itemsAPI = {
  getAll: () => {
    const items = getStorageData('ims_items', [])
    return mockResponse(items)
  },
  
  getById: (id) => {
    const items = getStorageData('ims_items', [])
    const item = items.find(i => i.item_id === id)
    if (!item) throw new Error('Item not found')
    return mockResponse(item)
  },
  
  search: (keywords) => {
    const items = getStorageData('ims_items', [])
    const filtered = items.filter(i => 
      i.item_name.toLowerCase().includes(keywords.toLowerCase())
    )
    return mockResponse(filtered)
  },
  
  create: (item) => {
    const items = getStorageData('ims_items', [])
    const newItem = {
      ...item,
      item_id: Date.now(),
      created_at: new Date().toISOString()
    }
    items.push(newItem)
    setStorageData('ims_items', items)
    return mockResponse(newItem)
  },
  
  update: (id, item) => {
    const items = getStorageData('ims_items', [])
    const index = items.findIndex(i => i.item_id === id)
    if (index === -1) throw new Error('Item not found')
    items[index] = { ...items[index], ...item, updated_at: new Date().toISOString() }
    setStorageData('ims_items', items)
    return mockResponse(items[index])
  },
  
  delete: (id) => {
    const items = getStorageData('ims_items', [])
    const filtered = items.filter(i => i.item_id !== id)
    setStorageData('ims_items', filtered)
    return mockResponse({ success: true })
  },
}

// Customers API
export const customersAPI = {
  getAll: () => {
    const customers = getStorageData('ims_customers', [])
    return mockResponse(customers)
  },
  
  getById: (id) => {
    const customers = getStorageData('ims_customers', [])
    const customer = customers.find(c => c.customer_id === id)
    if (!customer) throw new Error('Customer not found')
    return mockResponse(customer)
  },
  
  search: (name) => {
    const customers = getStorageData('ims_customers', [])
    const filtered = customers.filter(c => 
      c.customer_name.toLowerCase().includes(name.toLowerCase())
    )
    return mockResponse(filtered)
  },
  
  create: (customer) => {
    const customers = getStorageData('ims_customers', [])
    const newCustomer = {
      ...customer,
      customer_id: Date.now(),
      created_at: new Date().toISOString()
    }
    customers.push(newCustomer)
    setStorageData('ims_customers', customers)
    return mockResponse(newCustomer)
  },
  
  delete: (id) => {
    const customers = getStorageData('ims_customers', [])
    const filtered = customers.filter(c => c.customer_id !== id)
    setStorageData('ims_customers', filtered)
    return mockResponse({ success: true })
  },
}

// Sales API
export const salesAPI = {
  getAll: () => {
    const sales = getStorageData('ims_sales', [])
    return mockResponse(sales)
  },
  
  getByItemId: (itemId) => {
    const sales = getStorageData('ims_sales', [])
    const filtered = sales.filter(s => s.item_id === itemId)
    return mockResponse(filtered)
  },
  
  create: (sale) => {
    const sales = getStorageData('ims_sales', [])
    const items = getStorageData('ims_items', [])
    
    // Update stock
    const itemIndex = items.findIndex(i => i.item_id === sale.item_id)
    if (itemIndex !== -1) {
      items[itemIndex].stock_quantity -= sale.quantity_sold
      setStorageData('ims_items', items)
    }
    
    const newSale = {
      ...sale,
      sale_id: Date.now(),
      dat: new Date().toISOString()
    }
    sales.push(newSale)
    setStorageData('ims_sales', sales)
    return mockResponse(newSale)
  },
}

// Udhar Items API
export const udharItemsAPI = {
  getAll: () => {
    const udharItems = getStorageData('ims_udhar_items', [])
    return mockResponse(udharItems)
  },
  
  create: (udharData) => {
    const udharItems = getStorageData('ims_udhar_items', [])
    const udhars = getStorageData('ims_udhars', [])
    const items = getStorageData('ims_items', [])
    
    // Update stock
    const itemIndex = items.findIndex(i => i.item_id === udharData.item_id)
    if (itemIndex !== -1) {
      items[itemIndex].stock_quantity -= udharData.quantity
      setStorageData('ims_items', items)
    }
    
    const newUdharItem = {
      ...udharData,
      udhar_item_id: Date.now(),
      date: new Date().toISOString()
    }
    udharItems.push(newUdharItem)
    setStorageData('ims_udhar_items', udharItems)
    
    // Update udhar summary
    const udharIndex = udhars.findIndex(u => u.customer_id === udharData.customer_id)
    if (udharIndex !== -1) {
      udhars[udharIndex].total_amount = (udhars[udharIndex].total_amount || 0) + udharData.total_amount
    } else {
      udhars.push({
        customer_id: udharData.customer_id,
        total_amount: udharData.total_amount,
        direct_addition: 0,
        direct_deduction: 0
      })
    }
    setStorageData('ims_udhars', udhars)
    
    return mockResponse(newUdharItem)
  },
}

// Udhars API (Summary)
export const udharsAPI = {
  getAll: () => {
    const udhars = getStorageData('ims_udhars', [])
    return mockResponse(udhars)
  },
  
  getByCustomerId: (customerId) => {
    const udhars = getStorageData('ims_udhars', [])
    const udhar = udhars.find(u => u.customer_id === customerId)
    return mockResponse(udhar || { customer_id: customerId, total_amount: 0, direct_addition: 0, direct_deduction: 0 })
  },
  
  getSummary: (customerId) => {
    const udhars = getStorageData('ims_udhars', [])
    const udhar = udhars.find(u => u.customer_id === customerId)
    if (!udhar) {
      return mockResponse({ customer_id: customerId, total_amount: 0, direct_addition: 0, direct_deduction: 0 })
    }
    return mockResponse(udhar)
  },
  
  updateDirectAddition: (customerId, amount) => {
    const udhars = getStorageData('ims_udhars', [])
    let udharIndex = udhars.findIndex(u => u.customer_id === customerId)
    
    if (udharIndex === -1) {
      udhars.push({
        customer_id: customerId,
        total_amount: 0,
        direct_addition: amount,
        direct_deduction: 0
      })
    } else {
      udhars[udharIndex].direct_addition = (udhars[udharIndex].direct_addition || 0) + amount
    }
    
    setStorageData('ims_udhars', udhars)
    return mockResponse(udhars[udharIndex === -1 ? udhars.length - 1 : udharIndex])
  },
  
  updateDirectDeduction: (customerId, amount) => {
    const udhars = getStorageData('ims_udhars', [])
    let udharIndex = udhars.findIndex(u => u.customer_id === customerId)
    
    if (udharIndex === -1) {
      udhars.push({
        customer_id: customerId,
        total_amount: 0,
        direct_addition: 0,
        direct_deduction: amount
      })
    } else {
      udhars[udharIndex].direct_deduction = (udhars[udharIndex].direct_deduction || 0) + amount
    }
    
    setStorageData('ims_udhars', udhars)
    return mockResponse(udhars[udharIndex === -1 ? udhars.length - 1 : udharIndex])
  },
  
  setTotal: (customerId, amount) => {
    const udhars = getStorageData('ims_udhars', [])
    let udharIndex = udhars.findIndex(u => u.customer_id === customerId)
    
    if (udharIndex === -1) {
      udhars.push({
        customer_id: customerId,
        total_amount: amount,
        direct_addition: 0,
        direct_deduction: 0
      })
    } else {
      // Reset everything and set only the total
      udhars[udharIndex].total_amount = amount
      udhars[udharIndex].direct_addition = 0
      udhars[udharIndex].direct_deduction = 0
    }
    
    setStorageData('ims_udhars', udhars)
    return mockResponse(udhars[udharIndex === -1 ? udhars.length - 1 : udharIndex])
  },
}

// Reports API
export const reportsAPI = {
  downloadInventoryReport: async () => {
    const items = getStorageData('ims_items', [])
    const csvContent = 'Item Name,Unit,Price,Stock\n' + 
      items.map(i => `${i.item_name},${i.item_unit},${i.unit_price},${i.stock_quantity}`).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    return mockResponse(blob)
  },
  
  previewInventoryReport: () => {
    const items = getStorageData('ims_items', [])
    return mockResponse(items)
  },
}

// Bills API
export const billsAPI = {
  getAll: (params) => {
    let bills = getStorageData('ims_bills', [])
    
    // Filter by date if provided
    if (params?.date) {
      bills = bills.filter(b => b.date?.startsWith(params.date))
    }
    
    return mockResponse(bills)
  },
  
  getById: (billId) => {
    const bills = getStorageData('ims_bills', [])
    const bill = bills.find(b => b.bill_id === billId)
    if (!bill) throw new Error('Bill not found')
    return mockResponse(bill)
  },
  
  getByNumber: (billNumber) => {
    const bills = getStorageData('ims_bills', [])
    const bill = bills.find(b => b.bill_number === billNumber)
    if (!bill) throw new Error('Bill not found')
    return mockResponse(bill)
  },
  
  create: (billData) => {
    const bills = getStorageData('ims_bills', [])
    const items = getStorageData('ims_items', [])
    const sales = getStorageData('ims_sales', [])
    
    // Update stock for each item in the bill
    billData.items.forEach(billItem => {
      const itemIndex = items.findIndex(i => i.item_id === billItem.item_id)
      if (itemIndex !== -1) {
        items[itemIndex].stock_quantity -= billItem.quantity
        
        // Also add to sales
        sales.push({
          sale_id: Date.now() + Math.random(),
          item_id: billItem.item_id,
          quantity_sold: billItem.quantity,
          dat: new Date().toISOString()
        })
      }
    })
    
    setStorageData('ims_items', items)
    setStorageData('ims_sales', sales)
    
    const newBill = {
      ...billData,
      bill_id: Date.now(),
      bill_number: `BILL-${Date.now()}`,
      date: new Date().toISOString()
    }
    bills.push(newBill)
    setStorageData('ims_bills', bills)
    return mockResponse(newBill)
  },
  
  delete: (billId) => {
    const bills = getStorageData('ims_bills', [])
    const filtered = bills.filter(b => b.bill_id !== billId)
    setStorageData('ims_bills', filtered)
    return mockResponse({ success: true })
  },
  
  getCount: (params) => {
    let bills = getStorageData('ims_bills', [])
    
    if (params?.date) {
      bills = bills.filter(b => b.date?.startsWith(params.date))
    }
    
    return mockResponse(bills.length)
  },
  
  getTodaySummary: () => {
    const bills = getStorageData('ims_bills', [])
    const today = new Date().toISOString().split('T')[0]
    const todayBills = bills.filter(b => b.date?.startsWith(today))
    
    const total = todayBills.reduce((sum, b) => sum + (b.total_amount || 0), 0)
    
    return mockResponse({
      count: todayBills.length,
      total_amount: total
    })
  },
  
  getDateSummary: (date) => {
    const bills = getStorageData('ims_bills', [])
    const dateBills = bills.filter(b => b.date?.startsWith(date))
    
    const total = dateBills.reduce((sum, b) => sum + (b.total_amount || 0), 0)
    
    return mockResponse({
      count: dateBills.length,
      total_amount: total
    })
  },
}

export default {
  authAPI,
  voiceAuthAPI,
  itemsAPI,
  customersAPI,
  salesAPI,
  udharItemsAPI,
  udharsAPI,
  reportsAPI,
  billsAPI
}
