// API Service Layer - Connected to FastAPI Backend
import axios from 'axios'
import {
  isGuestModeEnabled,
  guestAuthGetUsers,
  guestAuthUpdateProfile,
  guestItemsGetAll,
  guestItemsGetById,
  guestItemsSearch,
  guestItemsCreate,
  guestItemsUpdate,
  guestItemsDelete,
  guestCustomersGetAll,
  guestCustomersGetById,
  guestCustomersSearch,
  guestCustomersCreate,
  guestCustomersDelete,
  guestSalesGetAll,
  guestSalesGetByItemId,
  guestSalesDelete,
  guestBillItemsGetAll,
  guestBillItemsCreate,
  guestBillItemsCreateBatch,
  guestBillsGetAll,
  guestBillsGetByCustomerId,
  guestBillsPayBill,
  guestBillsDelete,
  guestBillsReturnBill,
  guestUdharItemsGetAll,
  guestUdharItemsGetByCustomerId,
  guestUdharItemsCreate,
  guestUdharsGetAll,
  guestUdharsGetByCustomerId,
  guestUdharsGetSummary,
  guestUdharsUpdateDirectAddition,
  guestUdharsUpdateDirectDeduction,
  guestUdharsDelete,
  guestReportsGenerate,
  guestForecastGetForecast,
  guestShopsGetAll,
} from './guestDemo'

const API_BASE_URL = 'http://localhost:8000'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ims_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor - handle 401 (expired token) globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (inGuestMode()) {
      return Promise.reject(error)
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('ims_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Helper to wrap response data in { data } format for backward compatibility
const wrapResponse = (responsePromise) =>
  responsePromise.then((res) => ({ data: res.data }))

const wrapGuest = (data) => Promise.resolve({ data })
const inGuestMode = () => isGuestModeEnabled()

// ==================== AUTH API ====================
export const authAPI = {
  register: (payload) =>
    wrapResponse(
      api.post('/auth/register', {
        email: payload.email,
        username: payload.username,
        password: payload.password,
        voice_samples: payload.voice_samples || null,
      })
    ),

  login: async (payload) => {
    // Backend expects OAuth2 form data (username + password)
    const formData = new URLSearchParams()
    formData.append('username', payload.username)
    formData.append('password', payload.password)

    const res = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    // Store token
    if (res.data.access_token) {
      localStorage.setItem('ims_token', res.data.access_token)
    }

    return { data: res.data }
  },

  voiceLogin: async (payload) => {
    const res = await api.post('/auth/voice-login', {
      email: payload.email,
      audio_base64: payload.audio_base64,
    })

    if (res.data.access_token) {
      localStorage.setItem('ims_token', res.data.access_token)
    }

    return { data: res.data }
  },

  saveVoiceSamples: (payload) =>
    wrapResponse(
      api.post('/auth/save-voice-samples', {
        email: payload.email,
        samples: payload.samples,
      })
    ),

  getUsers: () => (inGuestMode() ? wrapGuest(guestAuthGetUsers()) : wrapResponse(api.get('/auth/users'))),

  getMe: () => (inGuestMode() ? wrapGuest(guestAuthGetUsers()[0]) : wrapResponse(api.get('/auth/me'))),

  updateProfile: (userId, payload) =>
    (inGuestMode()
      ? wrapGuest(guestAuthUpdateProfile(userId, payload))
      : wrapResponse(api.patch(`/auth/users/${userId}`, payload))),

  deleteUser: (userId) =>
    (inGuestMode()
      ? wrapGuest({ message: 'Guest mode: no permanent user deletion' })
      : wrapResponse(api.delete('/auth/delete_user', { params: { user_id: userId } }))),

  forgotPassword: (email) =>
    wrapResponse(api.post('/auth/forgot-password', null, { params: { email } })),

  resetPasswordConfirm: (payload) =>
    wrapResponse(api.post('/auth/reset-password-confirm', payload)),

  logout: () => {
    localStorage.removeItem('ims_token')
    localStorage.removeItem('user')
  },
}

// ==================== VOICE AUTH API ====================
export const voiceAuthAPI = {
  saveVoiceSamples: (payload) => authAPI.saveVoiceSamples(payload),
  loginWithVoice: (payload) => authAPI.voiceLogin(payload),
}

// ==================== ITEMS API ====================
export const itemsAPI = {
  getAll: () => (inGuestMode() ? wrapGuest(guestItemsGetAll()) : wrapResponse(api.get('/items/'))),

  getById: (id) => (inGuestMode() ? wrapGuest(guestItemsGetById(id)) : wrapResponse(api.get(`/items/${id}`))),

  search: (keywords) =>
    (inGuestMode()
      ? wrapGuest(guestItemsSearch(keywords))
      : wrapResponse(api.get('/items/search', { params: { keywords } }))),

  create: (item) =>
    (inGuestMode()
      ? wrapGuest(guestItemsCreate(item))
      : wrapResponse(
          api.post('/items/', {
            item_name: item.item_name,
            item_unit: item.item_unit,
            unit_price: item.unit_price,
            stock_quantity: item.stock_quantity,
          })
        )),

  update: (id, item) =>
    (inGuestMode() ? wrapGuest(guestItemsUpdate(id, item)) : wrapResponse(api.patch(`/items/${id}`, item))),

  delete: (id) => (inGuestMode() ? wrapGuest(guestItemsDelete(id)) : wrapResponse(api.delete(`/items/${id}`))),
}

// ==================== CUSTOMERS API ====================
export const customersAPI = {
  getAll: () => (inGuestMode() ? wrapGuest(guestCustomersGetAll()) : wrapResponse(api.get('/customers/'))),

  getById: (id) => (inGuestMode() ? wrapGuest(guestCustomersGetById(id)) : wrapResponse(api.get(`/customers/${id}`))),

  search: (name) =>
    (inGuestMode()
      ? wrapGuest(guestCustomersSearch(name))
      : wrapResponse(
          api.get('/customers/search', { params: { customer_name: name } })
        )),

  create: (customer) =>
    (inGuestMode()
      ? wrapGuest(guestCustomersCreate(customer))
      : wrapResponse(
          api.post('/customers/', {
            customer_name: customer.customer_name,
          })
        )),

  delete: (id) => (inGuestMode() ? wrapGuest(guestCustomersDelete(id)) : wrapResponse(api.delete(`/customers/${id}`))),
}

// ==================== SALES API ====================
export const salesAPI = {
  getAll: () => (inGuestMode() ? wrapGuest(guestSalesGetAll()) : wrapResponse(api.get('/sales/'))),

  getByItemId: (itemId) =>
    (inGuestMode() ? wrapGuest(guestSalesGetByItemId(itemId)) : wrapResponse(api.get(`/sales/${itemId}`))),

  delete: (saleId) => (inGuestMode() ? wrapGuest(guestSalesDelete(saleId)) : wrapResponse(api.delete(`/sales/${saleId}`))),
}

// ==================== BILL ITEMS API ====================
export const billItemsAPI = {
  getAll: () => (inGuestMode() ? wrapGuest(guestBillItemsGetAll()) : wrapResponse(api.get('/billitems/'))),

  create: (billItem) =>
    (inGuestMode()
      ? wrapGuest(guestBillItemsCreate(billItem))
      : wrapResponse(
          api.post('/billitems/', {
            item_name: billItem.item_name,
            quantity: billItem.quantity,
            requested_unit: billItem.requested_unit,
            created_date: billItem.created_date || null,
          })
        )),

  createBatch: (items) =>
    (inGuestMode()
      ? wrapGuest(guestBillItemsCreateBatch(items))
      : wrapResponse(
          api.post('/billitems/batch', {
            items: items.map(item => ({
              item_name: item.item_name,
              quantity: item.quantity,
              requested_unit: item.requested_unit,
            })),
          })
        )),
}

// ==================== BILLS API ====================
export const billsAPI = {
  getAll: () => (inGuestMode() ? wrapGuest(guestBillsGetAll()) : wrapResponse(api.get('/bills/'))),

  getByCustomerId: (customerId) =>
    (inGuestMode() ? wrapGuest(guestBillsGetByCustomerId(customerId)) : wrapResponse(api.get(`/bills/customer/${customerId}`))),

  payBill: (customerId) =>
    (inGuestMode() ? wrapGuest(guestBillsPayBill(customerId)) : wrapResponse(api.put(`/bills/customer/${customerId}/pay`))),

  delete: (billId) => (inGuestMode() ? wrapGuest(guestBillsDelete(billId)) : wrapResponse(api.delete(`/bills/${billId}`))),

  returnBill: (billId, data) =>
    (inGuestMode() ? wrapGuest(guestBillsReturnBill(billId, data)) : wrapResponse(api.post(`/bills/${billId}/return`, data))),
}

// ==================== UDHAR ITEMS API ====================
export const udharItemsAPI = {
  getAll: () => (inGuestMode() ? wrapGuest(guestUdharItemsGetAll()) : wrapResponse(api.get('/udhar-items/'))),

  getByCustomerId: (customerId) =>
    (inGuestMode()
      ? wrapGuest(guestUdharItemsGetByCustomerId(customerId))
      : wrapResponse(api.get(`/udhar-items/customer/${customerId}`))),

  create: (udharData) =>
    (inGuestMode()
      ? wrapGuest(guestUdharItemsCreate(udharData))
      : wrapResponse(
          api.post('/udhar-items/', {
            customer_name: udharData.customer_name,
            item_name: udharData.item_name,
            quantity: udharData.quantity,
            unit: udharData.unit,
            created_date: udharData.created_date || null,
          })
        )),
}

// ==================== UDHARS API ====================
export const udharsAPI = {
  getAll: () => (inGuestMode() ? wrapGuest(guestUdharsGetAll()) : wrapResponse(api.get('/udhars/'))),

  getByCustomerId: (customerId) =>
    (inGuestMode() ? wrapGuest(guestUdharsGetByCustomerId(customerId)) : wrapResponse(api.get(`/udhars/${customerId}`))),

  getSummary: (customerId) =>
    (inGuestMode() ? wrapGuest(guestUdharsGetSummary(customerId)) : wrapResponse(api.get(`/udhars/${customerId}/summary`))),

  updateDirectAddition: (customerId, amount) =>
    (inGuestMode()
      ? wrapGuest(guestUdharsUpdateDirectAddition(customerId, amount))
      : wrapResponse(
          api.put(`/udhars/${customerId}/direct-addition`, null, {
            params: { amount },
          })
        )),

  updateDirectDeduction: (customerId, amount) =>
    (inGuestMode()
      ? wrapGuest(guestUdharsUpdateDirectDeduction(customerId, amount))
      : wrapResponse(
          api.put(`/udhars/${customerId}/direct-deduction`, null, {
            params: { amount },
          })
        )),

  delete: (udharId) => (inGuestMode() ? wrapGuest(guestUdharsDelete(udharId)) : wrapResponse(api.delete(`/udhars/${udharId}`))),
}

// ==================== REPORTS API ====================
export const reportsAPI = {
  generate: (params) =>
    (inGuestMode() ? wrapGuest(guestReportsGenerate()) : wrapResponse(api.get('/reports/generate', { params }))),
}

// ==================== FORECAST API ====================
export const forecastAPI = {
  getForecast: (periods = 3) =>
    (inGuestMode() ? wrapGuest(guestForecastGetForecast(periods)) : wrapResponse(api.get('/forecast/', { params: { periods } }))),
}

// ==================== SHOPS API ====================
export const shopsAPI = {
  getAll: () => (inGuestMode() ? wrapGuest(guestShopsGetAll()) : wrapResponse(api.get('/shops/'))),

  getById: (shopId) => wrapResponse(api.get(`/shops/${shopId}`)),

  create: (shop) =>
    wrapResponse(
      api.post('/shops/', {
        shop_name: shop.shop_name,
        address: shop.address,
      })
    ),

  update: (shopId, shop) => wrapResponse(api.patch(`/shops/${shopId}`, shop)),

  delete: (shopId) => wrapResponse(api.delete(`/shops/${shopId}`)),
}

export default {
  authAPI,
  voiceAuthAPI,
  itemsAPI,
  customersAPI,
  salesAPI,
  billItemsAPI,
  billsAPI,
  udharItemsAPI,
  udharsAPI,
  reportsAPI,
  forecastAPI,
  shopsAPI,
}
