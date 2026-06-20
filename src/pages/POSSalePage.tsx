import React, { useState, useEffect, useRef, useCallback } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import {
  Search, ShoppingCart, X, Plus, Minus, Trash2, Printer,
  CreditCard, Banknote, User, Phone, CheckCircle2, Package,
  Loader2, Receipt, ChevronDown, AlertCircle
} from 'lucide-react'

interface Product {
  _id: string
  name: string
  price: number
  mrp: number
  stock: number
  images: { url: string }[]
  sku?: string
  barcode?: string
  category?: { name: string }
  gstRate?: number
}

interface CartItem {
  product: Product
  quantity: number
  salePrice: number
}

interface PlacedOrder {
  _id: string
  orderNumber: string
  items: { name: string; price: number; mrp: number; quantity: number; sku: string; gstRate: number; image?: string }[]
  subtotal: number
  total: number
  shippingCharge: number
  discount: number
  paymentMethod: string
  paymentStatus: string
  orderStatus: string
  shippingAddress: { name: string; phone: string }
  notes?: string
  createdAt: string
}

const POSSalePage: React.FC = () => {
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash')
  const [note, setNote] = useState('')
  const [placing, setPlacing] = useState(false)
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null)
  const [showInvoice, setShowInvoice] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) { setProducts([]); return }
    setSearching(true)
    try {
      const res = await api.get(`/products?search=${encodeURIComponent(q)}&limit=12&admin=true`)
      setProducts(res.data.products || [])
    } catch {
      toast.error('Product search failed')
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchProducts(search), 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search, searchProducts])

  const addToCart = (product: Product) => {
    setCart(prev => {
      const exists = prev.find(i => i.product._id === product._id)
      if (exists) {
        if (exists.quantity >= product.stock) {
          toast.error(`Only ${product.stock} in stock`)
          return prev
        }
        return prev.map(i => i.product._id === product._id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      if (product.stock === 0) { toast.error('Out of stock'); return prev }
      return [...prev, { product, quantity: 1, salePrice: product.price }]
    })
    toast.success(`${product.name.slice(0, 20)}... added`, { duration: 1000 })
  }

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.product._id !== id))

  const updateQty = (id: string, qty: number) => {
    setCart(prev => prev.map(i => {
      if (i.product._id !== id) return i
      if (qty < 1) return i
      if (qty > i.product.stock) { toast.error(`Max stock: ${i.product.stock}`); return i }
      return { ...i, quantity: qty }
    }))
  }

  const updatePrice = (id: string, price: number) => {
    setCart(prev => prev.map(i => i.product._id === id ? { ...i, salePrice: price } : i))
  }

  const subtotal = cart.reduce((sum, i) => sum + i.salePrice * i.quantity, 0)

  const placeOrder = async () => {
    if (cart.length === 0) { toast.error('Add products to cart first'); return }
    setPlacing(true)
    try {
      const res = await api.post('/orders/pos', {
        items: cart.map(i => ({ productId: i.product._id, quantity: i.quantity, price: i.salePrice })),
        customerName: customerName.trim() || 'Walk-In Customer',
        customerPhone: customerPhone.trim(),
        paymentMethod,
        note: note.trim(),
      })
      const order = res.data.order as PlacedOrder
      setPlacedOrder(order)
      setShowInvoice(true)
      setCart([])
      setCustomerName('')
      setCustomerPhone('')
      setNote('')
      setSearch('')
      setProducts([])
      toast.success(`Order #${order.orderNumber} created!`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order')
    } finally {
      setPlacing(false)
    }
  }

  const printInvoice = () => {
    if (!placedOrder) return
    const storeName = 'Bafna Daily'
    const storeAddress = 'Your Store Address'
    const date = new Date(placedOrder.createdAt).toLocaleString('en-IN')
    const payLabel = placedOrder.paymentMethod === 'cod' ? 'CASH' : 'ONLINE'
    const customerLabel = placedOrder.shippingAddress.name
    const customerPhoneLabel = placedOrder.shippingAddress.phone

    // Calculate GST breakdown
    const gstMap: Record<number, { taxable: number; gst: number }> = {}
    placedOrder.items.forEach(item => {
      const rate = item.gstRate || 0
      if (rate > 0) {
        const taxablePerItem = item.price / (1 + rate / 100)
        const gstPerItem = item.price - taxablePerItem
        if (!gstMap[rate]) gstMap[rate] = { taxable: 0, gst: 0 }
        gstMap[rate].taxable += taxablePerItem * item.quantity
        gstMap[rate].gst += gstPerItem * item.quantity
      }
    })

    const gstRows = Object.entries(gstMap)
      .map(([rate, { taxable, gst }]) =>
        `<tr><td>GST @ ${rate}%</td><td>₹${taxable.toFixed(2)}</td><td>₹${gst.toFixed(2)}</td></tr>`
      ).join('')

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${placedOrder.orderNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: white; color: #1a1a2e; padding: 20px; }
    .invoice { max-width: 320px; margin: auto; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; }
    .header { text-align: center; margin-bottom: 12px; border-bottom: 2px dashed #e2e8f0; padding-bottom: 12px; }
    .store-name { font-size: 20px; font-weight: 800; color: #E91E63; letter-spacing: 1px; }
    .store-addr { font-size: 10px; color: #64748b; margin-top: 2px; }
    .invoice-title { font-size: 12px; font-weight: 700; color: white; background: #E91E63; display: inline-block; padding: 2px 12px; border-radius: 20px; margin-top: 8px; }
    .meta { font-size: 10px; color: #64748b; margin: 8px 0; display: flex; justify-content: space-between; }
    .meta span { display: block; }
    .customer { background: #f8fafc; border-radius: 8px; padding: 8px; margin: 8px 0; font-size: 10px; }
    .customer strong { font-size: 11px; color: #1e293b; display: block; margin-bottom: 2px; }
    table.items { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px; }
    table.items th { background: #f1f5f9; font-weight: 700; padding: 5px 4px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: .5px; }
    table.items td { padding: 5px 4px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    table.items .price { text-align: right; }
    .totals { margin-top: 8px; border-top: 2px dashed #e2e8f0; padding-top: 8px; }
    .total-row { display: flex; justify-content: space-between; font-size: 10px; padding: 2px 0; color: #475569; }
    .grand-total { font-size: 14px; font-weight: 800; color: #1e293b; border-top: 1px solid #cbd5e1; margin-top: 6px; padding-top: 6px; }
    .pay-badge { display: inline-flex; align-items: center; gap: 4px; background: ${payLabel === 'CASH' ? '#dcfce7' : '#dbeafe'}; color: ${payLabel === 'CASH' ? '#16a34a' : '#2563eb'}; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 20px; margin-top: 10px; }
    .gst-table { width: 100%; border-collapse: collapse; font-size: 9px; margin-top: 10px; border-top: 1px dashed #e2e8f0; padding-top: 8px; }
    .gst-table th { background: #f8fafc; padding: 3px 4px; text-align: left; font-weight: 700; color: #64748b; }
    .gst-table td { padding: 3px 4px; color: #475569; }
    .footer { text-align: center; margin-top: 14px; border-top: 2px dashed #e2e8f0; padding-top: 10px; font-size: 9px; color: #94a3b8; }
    .order-num { font-size: 11px; font-weight: 800; color: #475569; }
    @media print {
      body { padding: 0; }
      .invoice { border: none; max-width: 100%; }
    }
  </style>
</head>
<body>
<div class="invoice">
  <div class="header">
    <div class="store-name">${storeName}</div>
    <div class="store-addr">${storeAddress}</div>
    <div class="invoice-title">SALE INVOICE</div>
  </div>
  <div class="meta">
    <span class="order-num">#${placedOrder.orderNumber}</span>
    <span>${date}</span>
  </div>
  ${customerLabel !== 'Walk-In Customer' || customerPhoneLabel ? `
  <div class="customer">
    <strong>${customerLabel}</strong>
    ${customerPhoneLabel ? `<span>📱 ${customerPhoneLabel}</span>` : ''}
  </div>` : ''}
  <table class="items">
    <thead>
      <tr><th>#</th><th>Item</th><th>Qty</th><th class="price">Amt</th></tr>
    </thead>
    <tbody>
      ${placedOrder.items.map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>
          <div style="font-weight:600;line-height:1.3">${item.name}</div>
          ${item.sku ? `<div style="font-size:8px;color:#94a3b8;font-family:monospace">${item.sku}</div>` : ''}
          ${item.gstRate ? `<div style="font-size:8px;color:#6366f1">GST ${item.gstRate}%</div>` : ''}
        </td>
        <td>${item.quantity}</td>
        <td class="price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row"><span>Subtotal</span><span>₹${placedOrder.subtotal.toLocaleString('en-IN')}</span></div>
    <div class="total-row"><span>Shipping</span><span>₹0</span></div>
    <div class="total-row grand-total"><span>TOTAL</span><span>₹${placedOrder.total.toLocaleString('en-IN')}</span></div>
    <div style="margin-top:6px;text-align:right">
      <span class="pay-badge">${payLabel === 'CASH' ? '💵' : '💳'} Paid — ${payLabel}</span>
    </div>
  </div>

  ${gstRows ? `
  <table class="gst-table">
    <thead><tr><th>GST Rate</th><th>Taxable Value</th><th>Tax Amount</th></tr></thead>
    <tbody>${gstRows}</tbody>
  </table>` : ''}

  <div class="footer">
    <p>Thank you for your purchase! 🛍️</p>
    <p style="margin-top:4px">All sales are final. Prices include GST where applicable.</p>
  </div>
</div>
<script>window.onload = () => { setTimeout(() => { window.print(); }, 300); }</script>
</body>
</html>`

    const win = window.open('', '_blank', 'width=400,height=600')
    if (!win) { toast.error('Allow pop-ups to print invoice'); return }
    win.document.write(html)
    win.document.close()
  }

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-200">
            <Receipt size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">Personal Sale (POS)</h1>
            <p className="text-xs text-slate-400">Walk-in / Office staff sale — stock auto deducted</p>
          </div>
        </div>
        {placedOrder && (
          <button
            onClick={() => setShowInvoice(true)}
            className="flex items-center gap-2 px-4 py-2 bg-pink-50 border border-pink-200 text-pink-700 rounded-xl text-sm font-bold hover:bg-pink-100 transition-colors"
          >
            <Receipt size={15} /> Last Invoice
          </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* LEFT: Product search & listing */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              {searching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-pink-400" size={16} />}
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, SKU, barcode..."
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all font-medium"
                autoFocus
              />
              {search && (
                <button onClick={() => { setSearch(''); setProducts([]) }} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Products grid */}
          {products.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {products.map(p => {
                const inCart = cart.find(i => i.product._id === p._id)
                return (
                  <button
                    key={p._id}
                    onClick={() => addToCart(p)}
                    disabled={p.stock === 0}
                    className={`bg-white rounded-2xl border p-3 text-left hover:shadow-md hover:border-pink-300 hover:-translate-y-0.5 transition-all group relative ${
                      p.stock === 0 ? 'opacity-50 cursor-not-allowed border-slate-100' : 'border-slate-100 cursor-pointer'
                    } ${inCart ? 'ring-2 ring-pink-400 border-pink-300' : ''}`}
                  >
                    {inCart && (
                      <div className="absolute top-2 right-2 bg-pink-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                        ×{inCart.quantity}
                      </div>
                    )}
                    <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2">
                      <img
                        src={p.images?.[0]?.url}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=No+Image' }}
                      />
                    </div>
                    <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight mb-1">{p.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-pink-600">₹{p.price.toLocaleString('en-IN')}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        p.stock === 0 ? 'bg-red-100 text-red-600' :
                        p.stock < 5 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {p.stock === 0 ? 'Out' : `${p.stock} left`}
                      </span>
                    </div>
                    {p.sku && <p className="text-[9px] text-slate-400 font-mono mt-0.5">{p.sku}</p>}
                  </button>
                )
              })}
            </div>
          )}

          {search && !searching && products.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <Package size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-400 font-medium">No products found for "{search}"</p>
            </div>
          )}

          {!search && (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <Search size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-400 font-medium">Type a product name, SKU, or barcode to search</p>
            </div>
          )}
        </div>

        {/* RIGHT: Cart & Billing */}
        <div className="lg:col-span-2 space-y-4">

          {/* Customer Info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
            <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
              <User size={15} className="text-slate-400" /> Customer (Optional)
            </h3>
            <input
              type="text"
              placeholder="Customer name"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all"
            />
            <input
              type="tel"
              placeholder="Phone number"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all"
            />
          </div>

          {/* Cart Items */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
              <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                <ShoppingCart size={15} className="text-pink-500" />
                Cart
                {totalItems > 0 && (
                  <span className="bg-pink-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{totalItems}</span>
                )}
              </h3>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-xs text-red-400 hover:text-red-600 font-bold flex items-center gap-1">
                  <Trash2 size={12} /> Clear
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">
                <ShoppingCart size={32} className="mx-auto mb-2 text-slate-300" />
                Cart is empty — search and add products
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[320px] overflow-y-auto">
                {cart.map(item => (
                  <div key={item.product._id} className="flex gap-3 p-3">
                    <img
                      src={item.product.images?.[0]?.url}
                      alt={item.product.name}
                      className="w-12 h-12 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                      onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=?' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 leading-tight truncate">{item.product.name}</p>
                      {item.product.sku && <p className="text-[9px] text-slate-400 font-mono">{item.product.sku}</p>}

                      {/* Price edit */}
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[9px] text-slate-400">₹</span>
                        <input
                          type="number"
                          value={item.salePrice}
                          onChange={e => updatePrice(item.product._id, Number(e.target.value) || 0)}
                          className="w-20 text-xs font-black text-pink-600 bg-pink-50 border border-pink-100 rounded-lg px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-pink-300"
                        />
                        <span className="text-[9px] text-slate-400 line-through ml-1">₹{item.product.mrp}</span>
                      </div>

                      {/* Qty controls */}
                      <div className="flex items-center gap-1 mt-1.5">
                        <button
                          onClick={() => updateQty(item.product._id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="text-sm font-black text-slate-800 w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.product._id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          <Plus size={11} />
                        </button>
                        <span className="ml-auto text-xs font-black text-slate-700">
                          ₹{(item.salePrice * item.quantity).toLocaleString('en-IN')}
                        </span>
                        <button onClick={() => removeFromCart(item.product._id)} className="p-1 text-slate-300 hover:text-red-500 transition-colors ml-1">
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
            <h3 className="text-sm font-black text-slate-700">Payment Method</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`flex items-center gap-2 justify-center py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                  paymentMethod === 'cash'
                    ? 'bg-green-50 border-green-400 text-green-700 shadow-sm'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Banknote size={18} className={paymentMethod === 'cash' ? 'text-green-600' : 'text-slate-400'} />
                Cash
              </button>
              <button
                onClick={() => setPaymentMethod('online')}
                className={`flex items-center gap-2 justify-center py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                  paymentMethod === 'online'
                    ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <CreditCard size={18} className={paymentMethod === 'online' ? 'text-blue-600' : 'text-slate-400'} />
                Online / UPI
              </button>
            </div>

            {/* Note */}
            <input
              type="text"
              placeholder="Add a note (optional)"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all"
            />
          </div>

          {/* Bill Summary */}
          {cart.length > 0 && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-xl">
              <div className="space-y-2 mb-4">
                {cart.map(item => (
                  <div key={item.product._id} className="flex justify-between text-xs text-slate-400">
                    <span className="truncate max-w-[180px]">{item.product.name} <span className="text-slate-500">×{item.quantity}</span></span>
                    <span>₹{(item.salePrice * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-700 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm font-medium">Total ({totalItems} items)</span>
                  <span className="text-2xl font-black text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${paymentMethod === 'cash' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {paymentMethod === 'cash' ? '💵 Cash' : '💳 Online/UPI'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Place Order Button */}
          <button
            onClick={placeOrder}
            disabled={cart.length === 0 || placing}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-pink-200 hover:shadow-pink-300 transition-all active:scale-95"
          >
            {placing ? (
              <><Loader2 size={20} className="animate-spin" /> Processing...</>
            ) : (
              <><CheckCircle2 size={20} /> Create Sale & Print Invoice</>
            )}
          </button>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && placedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-pink-50 to-rose-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-green-600" />
                </div>
                <div>
                  <h2 className="font-black text-slate-800 text-lg">Sale Successful!</h2>
                  <p className="text-xs text-slate-500">Order #{placedOrder.orderNumber}</p>
                </div>
              </div>
              <button onClick={() => setShowInvoice(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {/* Order Summary */}
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* Alert */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 items-start">
                <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 font-medium">Stock has been automatically deducted for all items.</p>
              </div>

              {/* Customer + Payment */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Customer</p>
                  <p className="text-sm font-bold text-slate-800">{placedOrder.shippingAddress.name}</p>
                  {placedOrder.shippingAddress.phone && <p className="text-xs text-slate-500">{placedOrder.shippingAddress.phone}</p>}
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Payment</p>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                    placedOrder.paymentMethod === 'cod' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {placedOrder.paymentMethod === 'cod' ? <Banknote size={12} /> : <CreditCard size={12} />}
                    {placedOrder.paymentMethod === 'cod' ? 'Cash' : 'Online/UPI'}
                  </div>
                  <p className="text-[10px] text-green-600 font-bold mt-1">✓ PAID</p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                {placedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                    {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-slate-200 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                      {item.sku && <p className="text-[9px] text-slate-400 font-mono">{item.sku}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-black text-slate-800">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                      <p className="text-[9px] text-slate-400">₹{item.price} × {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl p-4 flex items-center justify-between text-white">
                <span className="font-bold text-sm opacity-80">Grand Total</span>
                <span className="text-2xl font-black">₹{placedOrder.total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setShowInvoice(false)}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                New Sale
              </button>
              <button
                onClick={printInvoice}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:from-pink-600 hover:to-rose-700 transition-all shadow-lg shadow-pink-200"
              >
                <Printer size={16} /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default POSSalePage
