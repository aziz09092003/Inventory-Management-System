const GUEST_MODE_KEY = 'ims_guest_mode'
const GUEST_USER_KEY = 'ims_guest_user'
const GUEST_DB_KEY = 'ims_guest_demo_db'

const today = () => new Date().toISOString().slice(0, 10)

const initialDemoDb = () => ({
  counters: {
    item: 4,
    customer: 3,
    sale: 4,
    bill: 3,
    udhar: 3,
    udharItem: 3,
  },
  items: [
    { item_id: 1, item_name: 'Sugar', item_unit: 'kg', unit_price: 180, stock_quantity: 42, created_date: today() },
    { item_id: 2, item_name: 'Tea', item_unit: 'pack', unit_price: 950, stock_quantity: 20, created_date: today() },
    { item_id: 3, item_name: 'Oil', item_unit: 'liter', unit_price: 520, stock_quantity: 16, created_date: today() },
    { item_id: 4, item_name: 'Flour', item_unit: 'kg', unit_price: 150, stock_quantity: 58, created_date: today() },
  ],
  customers: [
    { customer_id: 1, customer_name: 'Walk In' },
    { customer_id: 2, customer_name: 'Demo Customer A' },
    { customer_id: 3, customer_name: 'Demo Customer B' },
  ],
  sales: [
    { sale_id: 1, customer_name: 'Walk In', item_id: 1, quantity_sold: 2, sale_date: today() },
    { sale_id: 2, customer_name: 'Walk In', item_id: 2, quantity_sold: 1, sale_date: today() },
    { sale_id: 3, customer_name: 'Demo Customer A', item_id: 3, quantity_sold: 1, sale_date: today() },
    { sale_id: 4, customer_name: 'Demo Customer B', item_id: 4, quantity_sold: 5, sale_date: today() },
  ],
  bills: [
    {
      bill_id: 1,
      customer_id: null,
      status: 'paid',
      bill_date: today(),
      bill_time: '10:10',
      effective_total: 1310,
      items: [
        { item_name: 'Sugar', quantity: 2, unit_price: 180, total_amount: 360 },
        { item_name: 'Tea', quantity: 1, unit_price: 950, total_amount: 950 },
      ],
    },
    {
      bill_id: 2,
      customer_id: 2,
      status: 'unpaid',
      bill_date: today(),
      bill_time: '11:30',
      effective_total: 520,
      items: [{ item_name: 'Oil', quantity: 1, unit_price: 520, total_amount: 520 }],
    },
    {
      bill_id: 3,
      customer_id: 3,
      status: 'paid',
      bill_date: today(),
      bill_time: '13:00',
      effective_total: 750,
      items: [{ item_name: 'Flour', quantity: 5, unit_price: 150, total_amount: 750 }],
    },
  ],
  udhars: [
    { udhar_id: 1, customer_id: 2, subtotal: 520, direct_addition: 0, direct_deduction: 0, total: 520, status: 'unpaid' },
    { udhar_id: 2, customer_id: 3, subtotal: 0, direct_addition: 0, direct_deduction: 0, total: 0, status: 'paid' },
    { udhar_id: 3, customer_id: 1, subtotal: 0, direct_addition: 0, direct_deduction: 0, total: 0, status: 'paid' },
  ],
  udharItems: [
    { udharitem_id: 1, customer_id: 2, item_name: 'Oil', quantity: 1, unit: 'liter', total_amount: 520, created_date: today() },
  ],
})

const guestUser = {
  user_id: 0,
  username: 'Guest',
  email: 'guest@demo.local',
  isGuest: true,
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function loadDb() {
  try {
    const raw = sessionStorage.getItem(GUEST_DB_KEY)
    if (!raw) return initialDemoDb()
    return JSON.parse(raw)
  } catch {
    return initialDemoDb()
  }
}

let db = loadDb()

function saveDb() {
  try {
    sessionStorage.setItem(GUEST_DB_KEY, JSON.stringify(db))
  } catch {
    // ignore storage errors
  }
}

function nextId(key) {
  db.counters[key] = (db.counters[key] || 0) + 1
  return db.counters[key]
}

function ensureCustomerByName(customerName) {
  const normalized = (customerName || '').trim()
  if (!normalized) return null
  let customer = db.customers.find((c) => c.customer_name.toLowerCase() === normalized.toLowerCase())
  if (!customer) {
    customer = { customer_id: nextId('customer'), customer_name: normalized }
    db.customers.push(customer)
  }
  return customer
}

function itemByName(name) {
  return db.items.find((i) => i.item_name.toLowerCase() === String(name).toLowerCase())
}

function recalcUdhar(customerId) {
  let udhar = db.udhars.find((u) => u.customer_id === customerId)
  if (!udhar) {
    udhar = {
      udhar_id: nextId('udhar'),
      customer_id: customerId,
      subtotal: 0,
      direct_addition: 0,
      direct_deduction: 0,
      total: 0,
      status: 'paid',
    }
    db.udhars.push(udhar)
  }
  const subtotal = db.udharItems
    .filter((u) => u.customer_id === customerId)
    .reduce((sum, u) => sum + (Number(u.total_amount) || 0), 0)
  udhar.subtotal = subtotal
  udhar.total = subtotal + (Number(udhar.direct_addition) || 0) - (Number(udhar.direct_deduction) || 0)
  udhar.status = udhar.total <= 0 ? 'paid' : 'unpaid'
  return udhar
}

export function isGuestModeEnabled() {
  try {
    return sessionStorage.getItem(GUEST_MODE_KEY) === 'true'
  } catch {
    return false
  }
}

export function beginGuestSession() {
  try {
    sessionStorage.setItem(GUEST_MODE_KEY, 'true')
    sessionStorage.setItem(GUEST_USER_KEY, JSON.stringify(guestUser))
    db = initialDemoDb()
    saveDb()
  } catch {
    // ignore
  }
  return clone(guestUser)
}

export function endGuestSession() {
  try {
    sessionStorage.removeItem(GUEST_MODE_KEY)
    sessionStorage.removeItem(GUEST_USER_KEY)
    sessionStorage.removeItem(GUEST_DB_KEY)
  } catch {
    // ignore
  }
  db = initialDemoDb()
}

export function getGuestUser() {
  try {
    const raw = sessionStorage.getItem(GUEST_USER_KEY)
    if (!raw) return clone(guestUser)
    return JSON.parse(raw)
  } catch {
    return clone(guestUser)
  }
}

export function guestAuthGetUsers() {
  return [getGuestUser()]
}

export function guestAuthUpdateProfile(userId, payload) {
  const current = getGuestUser()
  const updated = {
    ...current,
    username: payload?.username || current.username,
    email: payload?.email || current.email,
  }
  try {
    sessionStorage.setItem(GUEST_USER_KEY, JSON.stringify(updated))
  } catch {
    // ignore
  }
  return updated
}

export function guestItemsGetAll() {
  return clone(db.items)
}

export function guestItemsGetById(id) {
  return clone(db.items.find((i) => i.item_id === Number(id)) || null)
}

export function guestItemsSearch(keywords) {
  const q = String(keywords || '').toLowerCase()
  return clone(db.items.filter((i) => i.item_name.toLowerCase().includes(q)))
}

export function guestItemsCreate(item) {
  const created = {
    item_id: nextId('item'),
    item_name: item.item_name,
    item_unit: item.item_unit,
    unit_price: Number(item.unit_price) || 0,
    stock_quantity: Number(item.stock_quantity) || 0,
    created_date: today(),
  }
  db.items.push(created)
  saveDb()
  return clone(created)
}

export function guestItemsUpdate(id, item) {
  const idx = db.items.findIndex((i) => i.item_id === Number(id))
  if (idx < 0) return null
  db.items[idx] = { ...db.items[idx], ...item }
  saveDb()
  return clone(db.items[idx])
}

export function guestItemsDelete(id) {
  db.items = db.items.filter((i) => i.item_id !== Number(id))
  db.sales = db.sales.filter((s) => s.item_id !== Number(id))
  saveDb()
  return { message: 'Deleted' }
}

export function guestCustomersGetAll() {
  return clone(db.customers)
}

export function guestCustomersGetById(id) {
  return clone(db.customers.find((c) => c.customer_id === Number(id)) || null)
}

export function guestCustomersSearch(name) {
  const q = String(name || '').toLowerCase()
  return clone(db.customers.filter((c) => c.customer_name.toLowerCase().includes(q)))
}

export function guestCustomersCreate(customer) {
  const existing = db.customers.find((c) => c.customer_name.toLowerCase() === String(customer.customer_name).toLowerCase())
  if (existing) return clone(existing)
  const created = { customer_id: nextId('customer'), customer_name: customer.customer_name }
  db.customers.push(created)
  saveDb()
  return clone(created)
}

export function guestCustomersDelete(id) {
  db.customers = db.customers.filter((c) => c.customer_id !== Number(id))
  db.udhars = db.udhars.filter((u) => u.customer_id !== Number(id))
  db.udharItems = db.udharItems.filter((u) => u.customer_id !== Number(id))
  db.bills = db.bills.filter((b) => b.customer_id !== Number(id))
  saveDb()
  return { message: 'Deleted' }
}

export function guestSalesGetAll() {
  return clone(db.sales)
}

export function guestSalesGetByItemId(itemId) {
  return clone(db.sales.filter((s) => s.item_id === Number(itemId)))
}

export function guestSalesDelete(saleId) {
  db.sales = db.sales.filter((s) => s.sale_id !== Number(saleId))
  saveDb()
  return { message: 'Deleted' }
}

export function guestBillItemsGetAll() {
  return clone(db.bills.flatMap((b) => (b.items || []).map((it) => ({ ...it, bill_id: b.bill_id }))))
}

export function guestBillItemsCreateBatch(items) {
  const lines = []
  for (const req of items) {
    const item = itemByName(req.item_name)
    if (!item) throw new Error(`Item not found: ${req.item_name}`)
    const qty = Number(req.quantity) || 0
    if (qty <= 0) continue
    if (qty > Number(item.stock_quantity || 0)) {
      throw new Error(`Insufficient stock for ${item.item_name}`)
    }
    item.stock_quantity = Number(item.stock_quantity || 0) - qty
    const total_amount = qty * Number(item.unit_price || 0)
    lines.push({ item_name: item.item_name, quantity: qty, unit_price: Number(item.unit_price || 0), total_amount })

    db.sales.push({
      sale_id: nextId('sale'),
      customer_name: 'Walk In',
      item_id: item.item_id,
      quantity_sold: qty,
      sale_date: today(),
    })
  }
  const total = lines.reduce((s, l) => s + l.total_amount, 0)
  const bill = {
    bill_id: nextId('bill'),
    customer_id: null,
    status: 'paid',
    bill_date: today(),
    bill_time: new Date().toTimeString().slice(0, 5),
    effective_total: total,
    items: lines,
  }
  db.bills.unshift(bill)
  saveDb()
  return clone(bill)
}

export function guestBillItemsCreate(single) {
  return guestBillItemsCreateBatch([single])
}

export function guestBillsGetAll() {
  return clone(db.bills)
}

export function guestBillsGetByCustomerId(customerId) {
  return clone(db.bills.filter((b) => b.customer_id === Number(customerId)))
}

export function guestBillsPayBill(customerId) {
  db.bills = db.bills.map((b) => (b.customer_id === Number(customerId) ? { ...b, status: 'paid' } : b))
  const udhar = db.udhars.find((u) => u.customer_id === Number(customerId))
  if (udhar) {
    udhar.direct_deduction = udhar.direct_deduction + udhar.total
    recalcUdhar(Number(customerId))
  }
  saveDb()
  return { message: 'Paid' }
}

export function guestBillsDelete(billId) {
  db.bills = db.bills.filter((b) => b.bill_id !== Number(billId))
  saveDb()
  return { message: 'Deleted' }
}

export function guestBillsReturnBill(billId, data) {
  const bill = db.bills.find((b) => b.bill_id === Number(billId))
  if (!bill) throw new Error('Bill not found')

  const itemsToReturn = data?.return_type === 'full'
    ? bill.items
    : (data?.items || []).map((r) => {
        const found = bill.items.find((it) => it.item_name === r.item_name)
        return found ? { ...found, quantity: Number(r.return_qty) || 0 } : null
      }).filter(Boolean)

  let refund = 0
  for (const row of itemsToReturn) {
    const item = itemByName(row.item_name)
    if (item) item.stock_quantity = Number(item.stock_quantity || 0) + Number(row.quantity || 0)
    refund += Number(row.quantity || 0) * Number(row.unit_price || 0)
  }

  bill.status = 'returned'
  bill.effective_total = Math.max(0, Number(bill.effective_total || 0) - refund)
  saveDb()
  return { message: 'Returned', refund_amount: refund }
}

export function guestUdharItemsGetAll() {
  return clone(db.udharItems)
}

export function guestUdharItemsGetByCustomerId(customerId) {
  return clone(db.udharItems.filter((u) => u.customer_id === Number(customerId)))
}

export function guestUdharItemsCreate(payload) {
  const customer = ensureCustomerByName(payload.customer_name)
  const item = itemByName(payload.item_name)
  if (!customer) throw new Error('Customer not found')
  if (!item) throw new Error(`Item not found: ${payload.item_name}`)

  const qty = Number(payload.quantity || 0)
  if (qty <= 0) throw new Error('Invalid quantity')
  if (qty > Number(item.stock_quantity || 0)) {
    throw new Error(`Insufficient stock for ${item.item_name}`)
  }

  item.stock_quantity = Number(item.stock_quantity || 0) - qty
  const total_amount = qty * Number(item.unit_price || 0)

  db.sales.push({
    sale_id: nextId('sale'),
    customer_name: customer.customer_name,
    item_id: item.item_id,
    quantity_sold: qty,
    sale_date: today(),
  })

  const udharItem = {
    udharitem_id: nextId('udharItem'),
    customer_id: customer.customer_id,
    item_name: item.item_name,
    quantity: qty,
    unit: payload.unit || item.item_unit,
    total_amount,
    created_date: today(),
  }
  db.udharItems.push(udharItem)

  const udhar = recalcUdhar(customer.customer_id)

  const bill = {
    bill_id: nextId('bill'),
    customer_id: customer.customer_id,
    status: 'unpaid',
    bill_date: today(),
    bill_time: new Date().toTimeString().slice(0, 5),
    effective_total: total_amount,
    items: [{ item_name: item.item_name, quantity: qty, unit_price: item.unit_price, total_amount }],
  }
  db.bills.unshift(bill)

  saveDb()
  return clone({ ...udharItem, udhar_id: udhar.udhar_id })
}

export function guestUdharsGetAll() {
  return clone(db.udhars)
}

export function guestUdharsGetByCustomerId(customerId) {
  return clone(db.udhars.find((u) => u.customer_id === Number(customerId)) || null)
}

export function guestUdharsGetSummary(customerId) {
  const udhar = db.udhars.find((u) => u.customer_id === Number(customerId))
  if (!udhar) return { subtotal: 0, direct_addition: 0, direct_deduction: 0, total: 0, status: 'paid' }
  return clone(udhar)
}

export function guestUdharsUpdateDirectAddition(customerId, amount) {
  const id = Number(customerId)
  let udhar = db.udhars.find((u) => u.customer_id === id)
  if (!udhar) {
    udhar = { udhar_id: nextId('udhar'), customer_id: id, subtotal: 0, direct_addition: 0, direct_deduction: 0, total: 0, status: 'paid' }
    db.udhars.push(udhar)
  }
  udhar.direct_addition = Number(udhar.direct_addition || 0) + Number(amount || 0)
  recalcUdhar(id)
  saveDb()
  return clone(udhar)
}

export function guestUdharsUpdateDirectDeduction(customerId, amount) {
  const id = Number(customerId)
  let udhar = db.udhars.find((u) => u.customer_id === id)
  if (!udhar) {
    udhar = { udhar_id: nextId('udhar'), customer_id: id, subtotal: 0, direct_addition: 0, direct_deduction: 0, total: 0, status: 'paid' }
    db.udhars.push(udhar)
  }
  udhar.direct_deduction = Number(udhar.direct_deduction || 0) + Number(amount || 0)
  recalcUdhar(id)
  saveDb()
  return clone(udhar)
}

export function guestUdharsDelete(udharId) {
  db.udhars = db.udhars.filter((u) => u.udhar_id !== Number(udharId))
  saveDb()
  return { message: 'Deleted' }
}

export function guestReportsGenerate() {
  const table = db.sales.map((s) => {
    const item = db.items.find((i) => i.item_id === s.item_id)
    return {
      Date: s.sale_date,
      Item: item?.item_name || 'Unknown',
      Quantity: s.quantity_sold,
      Revenue: Number(s.quantity_sold || 0) * Number(item?.unit_price || 0),
    }
  })
  return {
    title: 'Guest Demo Report',
    table,
  }
}

export function guestForecastGetForecast(periods = 3) {
  return {
    periods,
    message: 'Guest forecast demo mode',
  }
}

export function guestShopsGetAll() {
  return [
    { shop_id: 1, shop_name: 'Demo Mart', address: 'Demo Street, City' },
  ]
}
