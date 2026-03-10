import React from 'react'
import { X, Printer, RotateCcw } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

function Receipt({ billItems, total, customer, onClose, embedded = false, inline = false }) {
  const { t } = useLanguage()
  const getCurrentDateTime = () => {
    const now = new Date()
    return {
      date: now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    }
  }

  const { date, time } = getCurrentDateTime()
  const transactionId = `#${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  const subtotal = total
  const salesTax = (total * 0.05).toFixed(2)
  const grandTotal = (parseFloat(total) + parseFloat(salesTax)).toFixed(2)

  const handlePrint = () => {
    window.print()
  }

  // Inline mode - receipt shows directly inside the parent container (Current Bill section)
  if (inline) {
    return (
      <div className="print:shadow-none">
        {/* Receipt Content */}
        <div className="p-6 font-mono text-sm bg-white dark:bg-gray-900 max-w-md mx-auto shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 print:shadow-none print:border-0">
          {/* Business Header */}
          <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4">
            <h1 className="text-2xl font-bold mb-3 tracking-wider text-gray-900 dark:text-white">{t('aiVoiceBilling').toUpperCase()}</h1>
            <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">1234 Main Street</p>
            <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">Suite 567</p>
            <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">City Name, State 54321</p>
            <p className="text-xs leading-relaxed mt-2 font-semibold text-gray-900 dark:text-white">123-456-7890</p>
          </div>

          {/* Transaction Info */}
          <div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-600 dark:text-gray-400">{t('transactionId')}</span>
              <span className="font-bold text-gray-900 dark:text-white">{transactionId}</span>
            </div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-600 dark:text-gray-400">{t('date')}:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{date} {time}</span>
            </div>
            {customer && (
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-600 dark:text-gray-400">{t('customer')}:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{customer.customer_name}</span>
              </div>
            )}
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-600 dark:text-gray-400">{t('paidBy')}</span>
              <span className="font-semibold text-gray-900 dark:text-white">{t('cash')}</span>
            </div>
          </div>

          {/* Items List */}
          <div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4">
            <div className="mb-3">
              <div className="font-bold text-sm mb-3 text-gray-900 dark:text-white">{t('purchase').toUpperCase()}</div>
            </div>
            {billItems.map((item, index) => (
              <div key={index} className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{item.name}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">₨{item.total.toFixed(2)}</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 pl-2">
                  <span>
                    {item.quantity} {item.unit} @ ₨{item.price}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4">
            <div className="flex justify-between text-sm mb-3">
              <span className="font-semibold text-gray-700 dark:text-gray-300">{t('subTotal')}</span>
              <span className="font-semibold text-gray-900 dark:text-white">₨{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-4">
              <span className="font-semibold text-gray-700 dark:text-gray-300">{t('salesTax')} (5%)</span>
              <span className="font-semibold text-gray-900 dark:text-white">₨{salesTax}</span>
            </div>
            <div className="flex justify-between font-bold text-xl mt-3">
              <span className="text-gray-900 dark:text-white">{t('total').toUpperCase()}</span>
              <span className="text-green-600">₨{grandTotal}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-2">
            <p className="font-bold text-sm mb-1 text-gray-900 dark:text-white">{t('thankYou').toUpperCase()}</p>
            <p className="font-bold text-sm text-gray-900 dark:text-white">{t('yourPurchase').toUpperCase()}</p>
          </div>

          {/* Additional Info */}
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>{t('visitAgain')}</p>
            <p className="text-[10px]">{t('transactionCompleted')}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3 justify-center print:hidden">
          <button
            onClick={handlePrint}
            className="px-6 py-3 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            style={{backgroundColor: '#2C5F6F'}}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#234A57'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#2C5F6F'}
          >
            <Printer className="w-5 h-5" />
            {t('print')}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            {t('newBill')}
          </button>
        </div>

        {/* Print styles */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print\\:shadow-none, .print\\:shadow-none * {
              visibility: visible;
            }
            .print\\:shadow-none {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
        `}</style>
      </div>
    )
  }

  // Embedded mode - receipt is part of the page flow (with header)
  if (embedded) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mt-6 overflow-hidden print:shadow-none print:mt-0">
        {/* Header with actions */}
        <div className="px-6 py-4 flex items-center justify-between print:hidden" style={{background: 'linear-gradient(to right, #2C5F6F, #234A57)'}}>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Printer className="w-6 h-6" />
            {t('viewReceipt')}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              {t('print')}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              {t('close')}
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-8 font-mono text-sm bg-white max-w-md mx-auto my-6 shadow-lg rounded-lg print:shadow-none print:my-0 print:max-w-none">
          {/* Business Header */}
          <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4">
            <h1 className="text-2xl font-bold mb-3 tracking-wider text-gray-900">{t('aiVoiceBilling').toUpperCase()}</h1>
            <p className="text-xs leading-relaxed text-gray-700">1234 Main Street</p>
            <p className="text-xs leading-relaxed text-gray-700">Suite 567</p>
            <p className="text-xs leading-relaxed text-gray-700">City Name, State 54321</p>
            <p className="text-xs leading-relaxed mt-2 font-semibold text-gray-900">123-456-7890</p>
          </div>

          {/* Transaction Info */}
          <div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-600">{t('transactionId')}</span>
              <span className="font-bold text-gray-900">{transactionId}</span>
            </div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-600">{t('date')}:</span>
              <span className="font-semibold text-gray-900">{date} {time}</span>
            </div>
            {customer && (
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-600">{t('customer')}:</span>
                <span className="font-semibold text-gray-900">{customer.customer_name}</span>
              </div>
            )}
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-600">{t('paidBy')}</span>
              <span className="font-semibold text-gray-900">{t('cash')}</span>
            </div>
          </div>

          {/* Items List */}
          <div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4">
            <div className="mb-3">
              <div className="font-bold text-sm mb-3 text-gray-900">{t('purchase').toUpperCase()}</div>
            </div>
            {billItems.map((item, index) => (
              <div key={index} className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-bold text-gray-900">{item.name}</span>
                  <span className="text-sm font-bold text-gray-900">₨{item.total.toFixed(2)}</span>
                </div>
                <div className="text-xs text-gray-600 pl-2">
                  <span>
                    {item.quantity} {item.unit} @ ₨{item.price}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4">
            <div className="flex justify-between text-sm mb-3">
              <span className="font-semibold text-gray-700">{t('subTotal')}</span>
              <span className="font-semibold text-gray-900">₨{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-4">
              <span className="font-semibold text-gray-700">{t('salesTax')} (5%)</span>
              <span className="font-semibold text-gray-900">₨{salesTax}</span>
            </div>
            <div className="flex justify-between font-bold text-xl mt-3">
              <span className="text-gray-900">{t('total').toUpperCase()}</span>
              <span className="text-green-600">₨{grandTotal}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-2">
            <p className="font-bold text-sm mb-1 text-gray-900">{t('thankYou').toUpperCase()}</p>
            <p className="font-bold text-sm text-gray-900">{t('yourPurchase').toUpperCase()}</p>
          </div>

          {/* Additional Info */}
          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>{t('visitAgain')}</p>
            <p className="text-[10px]">{t('transactionCompleted')}</p>
            <p className="text-[10px]">Vendor ID: 987654-321</p>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="px-6 pb-6 print:hidden flex gap-3 justify-center">
          <button
            onClick={handlePrint}
            className="px-6 py-3 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            style={{backgroundColor: '#2C5F6F'}}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#234A57'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#2C5F6F'}
          >
            <Printer className="w-5 h-5" />
            {t('printReceipt')}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {t('newBill')}
          </button>
        </div>

        {/* Print styles */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .bg-white.dark\\:bg-gray-800.rounded-xl, .bg-white.dark\\:bg-gray-800.rounded-xl * {
              visibility: visible;
            }
            .bg-white.dark\\:bg-gray-800.rounded-xl {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
        `}</style>
      </div>
    )
  }

  // Modal mode (original behavior)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto relative print:shadow-none print:max-h-none">
        {/* Close button - hidden when printing */}
        <button
          onClick={onClose}
          className="sticky top-2 right-2 ml-auto mr-2 mt-2 p-2 bg-white hover:bg-gray-100 rounded-full transition-colors shadow-lg print:hidden z-10 flex items-center justify-center border border-gray-200"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Print button - hidden when printing */}
        <button
          onClick={handlePrint}
          className="absolute top-2 left-2 p-2 bg-white hover:bg-gray-100 rounded-full transition-colors print:hidden flex items-center gap-2 shadow-lg border border-gray-200 z-10"
          style={{color: '#2C5F6F'}}
        >
          <Printer className="w-5 h-5" />
        </button>

        {/* Receipt Content */}
        <div className="p-8 pt-4 font-mono text-sm">
          {/* Business Header */}
          <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4">
            <h1 className="text-2xl font-bold mb-3 tracking-wider">{t('aiVoiceBilling').toUpperCase()}</h1>
            <p className="text-xs leading-relaxed">1234 Main Street</p>
            <p className="text-xs leading-relaxed">Suite 567</p>
            <p className="text-xs leading-relaxed">City Name, State 54321</p>
            <p className="text-xs leading-relaxed mt-2 font-semibold">123-456-7890</p>
          </div>

          {/* Transaction Info */}
          <div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-600">{t('transactionId')}</span>
              <span className="font-bold">{transactionId}</span>
            </div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-600">{t('date')}:</span>
              <span className="font-semibold">{date} {time}</span>
            </div>
            {customer && (
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-600">{t('customer')}:</span>
                <span className="font-semibold">{customer.customer_name}</span>
              </div>
            )}
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-600">{t('paidBy')}</span>
              <span className="font-semibold">{t('cash')}</span>
            </div>
          </div>

          {/* Items List */}
          <div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4">
            <div className="mb-3">
              <div className="font-bold text-sm mb-3">{t('purchase').toUpperCase()}</div>
            </div>
            {billItems.map((item, index) => (
              <div key={index} className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-bold">{item.name}</span>
                  <span className="text-sm font-bold">₨{item.total.toFixed(2)}</span>
                </div>
                <div className="text-xs text-gray-600 pl-2">
                  <span>
                    {item.quantity} {item.unit} @ ₨{item.price}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4">
            <div className="flex justify-between text-sm mb-3">
              <span className="font-semibold">{t('subTotal')}</span>
              <span className="font-semibold">₨{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-4">
              <span className="font-semibold">{t('salesTax')} (5%)</span>
              <span className="font-semibold">₨{salesTax}</span>
            </div>
            <div className="flex justify-between font-bold text-xl mt-3">
              <span>{t('total').toUpperCase()}</span>
              <span>₨{grandTotal}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-2">
            <p className="font-bold text-sm mb-1">{t('thankYou').toUpperCase()}</p>
            <p className="font-bold text-sm">{t('yourPurchase').toUpperCase()}</p>
          </div>

          {/* Additional Info */}
          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>{t('visitAgain')}</p>
            <p className="text-[10px]">{t('transactionCompleted')}</p>
            <p className="text-[10px]">Vendor ID: 987654-321</p>
          </div>
        </div>

        {/* Action Buttons - hidden when printing */}
        <div className="px-8 pb-8 print:hidden flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            style={{backgroundColor: '#2C5F6F'}}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#234A57'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#2C5F6F'}
          >
            <Printer className="w-5 h-5" />
            {t('printReceipt')}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            margin: 0.5cm;
            size: auto;
          }
          
          body * {
            visibility: hidden;
          }
          
          .fixed.inset-0 {
            position: static !important;
            background: white !important;
            overflow: visible !important;
            max-height: none !important;
          }
          
          .fixed.inset-0, .fixed.inset-0 * {
            visibility: visible;
          }
          
          .fixed.inset-0 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            page-break-after: avoid;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .bg-white {
            box-shadow: none !important;
            border-radius: 0 !important;
            max-height: none !important;
            overflow: visible !important;
          }
          
          .p-8 {
            page-break-inside: avoid;
            page-break-after: avoid;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}

export default Receipt
