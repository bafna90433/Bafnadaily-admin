import React, { useState, useRef, useCallback } from 'react'
import { Plus, Trash2, Printer, Download, RotateCcw, Save } from 'lucide-react'
import toast from 'react-hot-toast'

interface LineItem {
  id: string
  description: string
  qty: number | string
  rate: number | string
}

const uid = () => Math.random().toString(36).slice(2, 9)

const blankItem = (): LineItem => ({ id: uid(), description: '', qty: 1, rate: 0 })

const getNextPO = () => {
  const n = parseInt(localStorage.getItem('po_counter') || '11') + 1
  localStorage.setItem('po_counter', String(n))
  return `PO-${n}`
}

const todayStr = () => new Date().toISOString().slice(0, 10)

const fmt = (d: string) => {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const PurchaseOrderPage: React.FC = () => {
  // Company (buyer)
  const [companyName, setCompanyName] = useState('Your Company')
  const [companyContact, setCompanyContact] = useState('Your Name')
  const [companyAddress, setCompanyAddress] = useState("Company's Address")
  const [companyCity, setCompanyCity] = useState('City, State Zip')
  const [companyCountry, setCompanyCountry] = useState('Country')

  // Vendor
  const [vendorCompany, setVendorCompany] = useState("Your Vendor's Company")
  const [vendorAddress, setVendorAddress] = useState("Vendor's Address")
  const [vendorCity, setVendorCity] = useState('City, State Zip')
  const [vendorCountry, setVendorCountry] = useState('Country')

  // PO meta
  const [poNumber, setPoNumber] = useState(() => getNextPO())
  const [orderDate, setOrderDate] = useState(todayStr())
  const [deliveryDate, setDeliveryDate] = useState(todayStr())

  // Items
  const [items, setItems] = useState<LineItem[]>([blankItem(), blankItem(), blankItem()])

  // Totals
  const [taxRate, setTaxRate] = useState<number | string>(10)
  const [notes, setNotes] = useState('It was great doing business with you.')
  const [terms, setTerms] = useState('Upon accepting this purchase order, you hereby agree to the terms & conditions.')

  const printRef = useRef<HTMLDivElement>(null)

  // ── Calculations ──────────────────────────────────────────────────────────
  const lineAmount = (item: LineItem) => {
    const q = parseFloat(String(item.qty)) || 0
    const r = parseFloat(String(item.rate)) || 0
    return q * r
  }

  const subTotal = items.reduce((s, i) => s + lineAmount(i), 0)
  const taxAmt = subTotal * (parseFloat(String(taxRate)) || 0) / 100
  const total = subTotal + taxAmt

  // ── Item helpers ──────────────────────────────────────────────────────────
  const addItem = () => setItems(prev => [...prev, blankItem()])

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id))

  const updateItem = (id: string, field: keyof LineItem, value: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  const resetPO = () => {
    if (!window.confirm('Reset this purchase order?')) return
    setCompanyName('Your Company'); setCompanyContact('Your Name')
    setCompanyAddress("Company's Address"); setCompanyCity('City, State Zip'); setCompanyCountry('Country')
    setVendorCompany("Your Vendor's Company"); setVendorAddress("Vendor's Address")
    setVendorCity('City, State Zip'); setVendorCountry('Country')
    setPoNumber(getNextPO()); setOrderDate(todayStr()); setDeliveryDate(todayStr())
    setItems([blankItem(), blankItem(), blankItem()])
    setTaxRate(10); setNotes('It was great doing business with you.')
    setTerms('Upon accepting this purchase order, you hereby agree to the terms & conditions.')
    toast.success('New PO started')
  }

  const handlePrint = () => {
    window.print()
  }

  // ── Inline editable cell ──────────────────────────────────────────────────
  const Field: React.FC<{ value: string; onChange: (v: string) => void; className?: string; placeholder?: string; multiline?: boolean }> = ({ value, onChange, className = '', placeholder, multiline }) => {
    if (multiline) return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className={`bg-transparent border-0 outline-none resize-none w-full ${className}`}
      />
    )
    return (
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`bg-transparent border-0 outline-none w-full ${className}`}
      />
    )
  }

  return (
    <div className="bg-amber-50 py-6 px-4 pb-10">
      {/* ── Toolbar (hidden on print) ── */}
      <div className="max-w-3xl mx-auto mb-4 flex items-center gap-2 print:hidden">
        <h1 className="font-bold text-gray-700 text-lg flex-1">Purchase Order Generator</h1>
        <button onClick={resetPO} className="flex items-center gap-1.5 px-3 py-2 bg-white text-gray-600 rounded-xl text-sm font-semibold border hover:bg-gray-50 transition-all">
          <RotateCcw size={14} /> New PO
        </button>
        <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2 bg-gray-800 text-white rounded-xl text-sm font-bold hover:bg-gray-900 transition-all active:scale-95 shadow">
          <Printer size={16} /> Print / Save PDF
        </button>
      </div>

      {/* ── Invoice Paper ── */}
      <div ref={printRef} className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden print:shadow-none print:rounded-none" id="po-paper">
        <div className="p-8 print:p-6">

          {/* ── Header: Company + Title ── */}
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-0.5">
              <input
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="font-bold text-xl text-gray-800 bg-transparent border-0 outline-none w-full block"
                placeholder="Your Company"
              />
              <input value={companyContact} onChange={e => setCompanyContact(e.target.value)} className="text-sm text-gray-500 bg-transparent border-0 outline-none w-full block" placeholder="Your Name" />
              <input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} className="text-sm text-gray-500 bg-transparent border-0 outline-none w-full block" placeholder="Company's Address" />
              <input value={companyCity} onChange={e => setCompanyCity(e.target.value)} className="text-sm text-gray-500 bg-transparent border-0 outline-none w-full block" placeholder="City, State Zip" />
              <input value={companyCountry} onChange={e => setCompanyCountry(e.target.value)} className="text-sm text-gray-500 bg-transparent border-0 outline-none w-full block" placeholder="Country" />
            </div>
            <div className="text-right flex-shrink-0">
              <h2 className="text-3xl font-light tracking-widest text-gray-700 uppercase">Purchase Order</h2>
            </div>
          </div>

          {/* ── Vendor + PO Details ── */}
          <div className="flex items-start justify-between mb-8 gap-8">
            {/* Vendor */}
            <div className="flex-1">
              <p className="font-bold text-sm text-gray-700 mb-1">Vendor Address:</p>
              <input value={vendorCompany} onChange={e => setVendorCompany(e.target.value)} className="text-sm text-blue-600 bg-transparent border-0 outline-none w-full block" placeholder="Vendor's Company" />
              <input value={vendorAddress} onChange={e => setVendorAddress(e.target.value)} className="text-sm text-blue-600 bg-transparent border-0 outline-none w-full block" placeholder="Vendor's Address" />
              <input value={vendorCity} onChange={e => setVendorCity(e.target.value)} className="text-sm text-blue-600 bg-transparent border-0 outline-none w-full block" placeholder="City, State Zip" />
              <input value={vendorCountry} onChange={e => setVendorCountry(e.target.value)} className="text-sm text-blue-600 bg-transparent border-0 outline-none w-full block" placeholder="Country" />
            </div>

            {/* PO Meta */}
            <div className="flex-shrink-0 min-w-[240px]">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 font-semibold text-gray-600 pr-4">PO#</td>
                    <td className="py-1">
                      <input value={poNumber} onChange={e => setPoNumber(e.target.value)} className="text-blue-600 font-semibold bg-transparent border-0 outline-none w-full" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold text-gray-600 pr-4">Order Date</td>
                    <td className="py-1">
                      <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className="text-blue-600 bg-transparent border-0 outline-none w-full text-sm print:hidden" />
                      <span className="text-blue-600 hidden print:inline">{fmt(orderDate)}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold text-gray-600 pr-4">Delivery Date</td>
                    <td className="py-1">
                      <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="text-blue-600 bg-transparent border-0 outline-none w-full text-sm print:hidden" />
                      <span className="text-blue-600 hidden print:inline">{fmt(deliveryDate)}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Line Items Table ── */}
          <table className="w-full mb-4 border-collapse">
            <thead>
              <tr className="bg-gray-700 text-white text-sm">
                <th className="text-left py-2.5 px-3 rounded-tl-lg font-semibold">Item Description</th>
                <th className="text-right py-2.5 px-3 font-semibold w-20">Qty</th>
                <th className="text-right py-2.5 px-3 font-semibold w-24">Rate</th>
                <th className="text-right py-2.5 px-3 rounded-tr-lg font-semibold w-24">Amount</th>
                <th className="w-8 print:hidden"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-2 px-3 border-b border-gray-100">
                    <textarea
                      value={item.description}
                      onChange={e => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Enter item name/description"
                      rows={2}
                      className="w-full bg-transparent border-0 outline-none resize-none text-sm text-gray-700 placeholder-blue-300"
                    />
                  </td>
                  <td className="py-2 px-3 border-b border-gray-100 text-right">
                    <input
                      type="number"
                      value={item.qty}
                      onChange={e => updateItem(item.id, 'qty', e.target.value)}
                      min="0"
                      className="w-full bg-transparent border-0 outline-none text-sm text-right text-gray-700"
                    />
                  </td>
                  <td className="py-2 px-3 border-b border-gray-100 text-right">
                    <input
                      type="number"
                      value={item.rate}
                      onChange={e => updateItem(item.id, 'rate', e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-full bg-transparent border-0 outline-none text-sm text-right text-gray-700"
                    />
                  </td>
                  <td className="py-2 px-3 border-b border-gray-100 text-right text-sm font-medium text-gray-700">
                    {lineAmount(item).toFixed(2)}
                  </td>
                  <td className="py-2 px-1 border-b border-gray-100 text-center print:hidden">
                    {items.length > 1 && (
                      <button onClick={() => removeItem(item.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── Add Line Item ── */}
          <div className="flex justify-between items-start mb-6">
            <button onClick={addItem} className="flex items-center gap-1.5 text-sm text-green-600 font-semibold hover:text-green-700 transition-colors print:hidden">
              <div className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                <Plus size={12} />
              </div>
              Add Line Item
            </button>

            {/* Totals */}
            <div className="min-w-[260px] space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Sub Total</span>
                <span className="font-semibold">{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 items-center">
                <span className="flex items-center gap-1">
                  Purchase Tax (
                  <input
                    type="number"
                    value={taxRate}
                    onChange={e => setTaxRate(e.target.value)}
                    min="0"
                    max="100"
                    className="w-10 bg-transparent border-0 outline-none text-center text-sm print:hidden"
                  />
                  <span className="hidden print:inline">{taxRate}</span>
                  %)
                </span>
                <span className="font-semibold">{taxAmt.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded-lg">
                <span className="font-bold text-gray-700 uppercase tracking-wide text-sm">TOTAL</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 text-sm border-r border-gray-300 pr-2 mr-1">₹</span>
                  <span className="font-black text-gray-800">{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Notes ── */}
          <div className="mb-5">
            <p className="font-bold text-sm text-gray-700 mb-1">Notes</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full text-sm text-gray-600 bg-transparent border-0 outline-none resize-none border-b border-dashed border-gray-200 pb-2"
              placeholder="Add notes..."
            />
          </div>

          {/* ── Terms ── */}
          <div className="mb-8">
            <p className="font-bold text-sm text-gray-700 mb-1">Terms &amp; Conditions</p>
            <textarea
              value={terms}
              onChange={e => setTerms(e.target.value)}
              rows={2}
              className="w-full text-sm text-gray-600 bg-transparent border-0 outline-none resize-none border-b border-dashed border-gray-200 pb-2"
              placeholder="Terms & conditions..."
            />
          </div>

          {/* ── Powered by ── */}
          <div className="border-t border-gray-100 pt-4 text-center">
            <p className="text-xs text-gray-400 tracking-widest uppercase font-semibold">Powered by <span className="text-gray-600 font-black">BAFNATOYS</span></p>
          </div>

        </div>
      </div>

      {/* ── Print styles (injected via style tag) ── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #po-paper, #po-paper * { visibility: visible; }
          #po-paper { position: fixed; left: 0; top: 0; width: 100%; }
          input, textarea { color: inherit !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  )
}

export default PurchaseOrderPage
