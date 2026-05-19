import React, { useEffect, useState, useCallback } from 'react'
import { Eye, ChevronDown, Truck, X, FileText, Trash2, BookOpen } from 'lucide-react'

const downloadExcelFormat = (orders: any[], filename: string) => {
  const rows: any[][] = [
    ['Order_Numb', 'Product_Name', 'SKU', 'MRP', 'Qty', 'Order_Date', 'Customer_Name', 'Shop_Name', 'City', 'State']
  ]
  
  orders.forEach(order => {
    const orderDt = new Date(order.createdAt)
    const orderDate = orderDt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    const customerName = order.user?.name || '—'
    const shopName = order.shippingAddress?.name || '—'
    const city = order.shippingAddress?.city || '—'
    const state = order.shippingAddress?.state || '—'
    
    ;(order.items || []).forEach((it: any) => {
      rows.push([
        order.orderNumber,
        it.name,
        it.sku || '',
        it.mrp || it.price || 0,
        it.quantity,
        orderDate,
        customerName,
        shopName,
        city,
        state
      ])
    })
  })

  const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

const exportExcel = (order: any) => downloadExcelFormat([order], `Order_${order.orderNumber}.csv`)
const bulkExportExcel = (orders: any[]) => downloadExcelFormat(orders, `Bulk_Orders_Export_${new Date().getTime()}.csv`)

import api from '../utils/api'
import toast from 'react-hot-toast'

const printInvoice = (order: any, settings: any) => {
  const win = window.open('', '_blank')
  if (!win) return
  const sa = order.shippingAddress || {}
  const u = order.user || {}
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })
  const printDate = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })
  const siteName = settings?.siteName || 'Store'
  const logo = settings?.siteLogo || ''

  const getGstRate = (it: any) => {
    if (it.gstRate && it.gstRate > 0) return it.gstRate
    const name = (it.name || '').toLowerCase()
    const sku = (it.sku || '').toUpperCase()
    if (sku.startsWith('KEY') || name.includes('keychain') || name.includes('ring')) {
      return 5
    }
    return 18
  }

  const getItemCategory = (it: any) => {
    if (it.product?.category?.name) {
      return it.product.category.name.toLowerCase()
    }
    const name = (it.name || '').toLowerCase()
    const sku = (it.sku || '').toUpperCase()
    if (sku.startsWith('KEY') || name.includes('keychain') || name.includes('ring')) {
      return 'keychain'
    }
    return 'toys'
  }

  const itemRows = (order.items || []).map((it: any, i: number) => {
    const r = getGstRate(it)
    return `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:center;color:#64748b">${i+1}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:12px;white-space:nowrap">${it.sku || '—'}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9">
        <span style="font-weight:600;color:#1e293b">${it.name}</span>
        ${it.variant ? `<br/><span style="font-size:11px;color:#94a3b8">${it.variant}</span>` : ''}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:center">${it.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;color:#94a3b8;text-decoration:${(it.mrp && it.mrp > it.price) ? 'line-through' : 'none'}">₹${Number(it.mrp || it.price).toLocaleString('en-IN')}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right">₹${Number(it.price).toLocaleString('en-IN')}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700">₹${(it.price*it.quantity).toLocaleString('en-IN')}</td>
    </tr>`
  }).join('')

  const statusLabel = (s: string) => (s==='placed'||s==='confirmed'||s==='processing') ? 'Confirmed' : s.charAt(0).toUpperCase()+s.slice(1)

  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <title>Invoice ${order.orderNumber}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',system-ui,sans-serif;background:#fff;color:#1e293b;padding:32px;font-size:13px}
    .wrap{max-width:860px;margin:0 auto}
    .head{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:22px;border-bottom:3px solid #e91e63;margin-bottom:22px}
    .brand{display:flex;align-items:center;gap:12px}
    .brand img{height:52px;object-fit:contain}
    .logo-box{width:48px;height:48px;background:#e91e63;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:20px}
    .brand-name{font-size:22px;font-weight:800;letter-spacing:-0.5px}
    .brand-sub{font-size:11px;color:#94a3b8;margin-top:2px}
    .inv-right{text-align:right}
    .inv-right h1{font-size:30px;font-weight:900;color:#e91e63;letter-spacing:3px}
    .inv-right p{font-size:12px;color:#64748b;margin-top:3px}
    .meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:22px}
    .mc{background:#f8fafc;border-radius:10px;padding:13px 15px}
    .mc h4{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:6px}
    .mc p{font-size:13px;line-height:1.7}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    thead tr{background:linear-gradient(135deg,#e91e63,#c2185b)}
    th{padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#fff}
    th:nth-child(1){text-align:center;width:36px}
    th:nth-child(2){width:90px}
    th:nth-child(4){text-align:center}
    th:nth-child(5),th:nth-child(6){text-align:right}
    .sum{margin-left:auto;width:260px;margin-top:4px}
    .sr{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#475569;border-bottom:1px solid #f1f5f9}
    .st{display:flex;justify-content:space-between;padding:10px 0 0;font-size:16px;font-weight:800;border-top:2px solid #1e293b;margin-top:4px}
    .track{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:12px;color:#15803d}
    .foot{text-align:center;margin-top:28px;padding-top:18px;border-top:1px solid #f1f5f9;font-size:11px;color:#94a3b8}
    .no-print{text-align:center;margin-top:20px}
    .pbtn{padding:11px 28px;background:#e91e63;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;margin-right:8px}
    .ebtn{padding:11px 22px;background:#16a34a;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;margin-right:8px}
    .cbtn{padding:11px 22px;background:#64748b;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer}
    @media print{body{padding:16px}.no-print{display:none}}
  </style>
  </head><body><div class="wrap">
  <div class="head">
    <div class="brand">
      ${logo ? `<img src="${logo}" alt="${siteName}"/>` : `<div class="logo-box">${siteName[0]}</div>`}
      <div><div class="brand-sub" style="margin-top:4px">Tax Invoice / Proforma Invoice</div></div>
    </div>
    <div class="inv-right">
      <h1>INVOICE</h1>
      <p>${order.orderNumber}</p>
      <p>Date: ${orderDate}</p>
      <p>Printed: ${printDate}</p>
    </div>
  </div>

  <div class="meta">
    <div class="mc">
      <h4>Customer</h4>
      <p><strong>${u.name || sa.name || '—'}</strong><br/>
      📞 ${u.phone || sa.phone || '—'}</p>
    </div>
    <div class="mc">
      <h4>Ship To</h4>
      <p>${sa.addressLine1 || '—'}${sa.addressLine2 ? ', '+sa.addressLine2 : ''}<br/>
      ${sa.city || ''}, ${sa.state || ''}<br/>
      PIN: ${sa.pincode || '—'}</p>
    </div>
    <div class="mc">
      <h4>Order Info</h4>
      <p>Order #: <strong>${order.orderNumber}</strong><br/>
      Date: ${orderDate}<br/>
      Payment: <strong style="color:${order.paymentMethod==='cod'?'#f59e0b':'#10b981'}">${(order.paymentMethod||'').toUpperCase()}</strong><br/>
      Status: <strong>${statusLabel(order.orderStatus)}</strong>${order.gstin?`<br/>GSTIN: <strong style="color:#6366f1;font-family:monospace">${order.gstin}</strong>`:''}</p>
    </div>
  </div>

  ${order.trackingNumber ? `<div class="track">🚚 <strong>Shipped via ${order.courierName||'Courier'}</strong> &nbsp;·&nbsp; Tracking: <strong>${order.trackingNumber}</strong></div>` : ''}

  <table>
    <thead><tr><th>#</th><th>SKU</th><th>Product</th><th>Qty</th><th>MRP</th><th>Rate</th><th>Amount</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="sum">
    <div class="sr"><span>Subtotal</span><span>₹${Number(order.subtotal||0).toLocaleString('en-IN')}</span></div>
    <div class="sr"><span>Shipping</span><span>${(order.shippingCharge||0)===0?'<span style="color:#10b981;font-weight:600">FREE</span>':'₹'+order.shippingCharge}</span></div>
    ${(order.discount||0)>0?`<div class="sr" style="color:#10b981"><span>Discount</span><span>-₹${Number(order.discount).toLocaleString('en-IN')}</span></div>`:''}
    <div class="st"><span>Grand Total</span><span>₹${Number(order.total||0).toLocaleString('en-IN')}</span></div>
    ${order.paymentMethod==='cod' && (order.advanceAmount||0)>0?`<div class="sr" style="color:#10b981"><span>Advance Paid</span><span>-₹${Number(order.advanceAmount).toLocaleString('en-IN')}</span></div>`:''}
    ${order.paymentMethod==='cod'?`<div class="st" style="color:#ef4444"><span>To Collect (COD)</span><span>₹${Math.max(0,Number(order.total||0)-Number(order.advanceAmount||0)).toLocaleString('en-IN')}</span></div>`:''}
    ${(() => {
      const byCategory: Record<string, { rate: number; amount: number }> = {}
      ;(order.items||[]).forEach((it:any) => {
        const r = getGstRate(it); if(!r) return
        const cat = getItemCategory(it)
        const amt = it.price*it.quantity*r/(100+r)
        if (!byCategory[cat]) {
          byCategory[cat] = { rate: r, amount: 0 }
        }
        byCategory[cat].amount += amt
      })
      const entries = Object.entries(byCategory).sort(([a],[b])=>a.localeCompare(b))
      if(!entries.length) return ''
      return `<div style="border-top:1px dashed #e2e8f0;padding-top:6px;margin-top:4px">` +
        entries.map(([cat, info])=>`<div class="sr" style="color:#6366f1;font-size:11px"><span>${cat} GST @ ${info.rate}% (included)</span><span>₹${info.amount.toFixed(2)}</span></div>`).join('') +
        `</div>`
    })()}
  </div>

  <div class="foot">
    <p style="font-size:13px;font-weight:600;color:#475569;margin-bottom:4px">Thank you for your business! — ${siteName}</p>
    <p>This is a computer generated invoice.</p>
  </div>
  </div>
  <div class="no-print">
    <button class="pbtn" onclick="window.print()">🖨️ Print / Save PDF</button>
    <button class="ebtn" onclick="downloadExcel()">📊 Download Excel</button>
    <button class="cbtn" onclick="window.close()">Close</button>
  </div>
  <script>
  function downloadExcel() {
    const rows = [${order.gstin?`['Customer GSTIN','${order.gstin}','','','','','',''],['','','','','','','',''],`:''}['#','SKU','Product','Variant','Qty','MRP','Rate','Amount']];
    ${JSON.stringify((order.items||[]).map((it: any,i: number) => [i+1, it.sku||'', it.name, it.variant||'', it.quantity, it.mrp||it.price, it.price, it.price*it.quantity]))}.forEach(r => rows.push(r));
    rows.push(['','','','','','','Subtotal', ${order.subtotal||0}]);
    rows.push(['','','','','','','Shipping', ${order.shippingCharge||0}]);
    ${(order.discount||0)>0 ? `rows.push(['','','','','','','Discount', -${order.discount}]);` : ''}
    rows.push(['','','','','','','Grand Total', ${order.total||0}]);
    ${ order.paymentMethod==='cod' && (order.advanceAmount||0)>0 ? `rows.push(['','','','','','','Advance Paid', -${order.advanceAmount}]);` : '' }
    ${ order.paymentMethod==='cod' ? `rows.push(['','','','','','','To Collect (COD)', ${Math.max(0,(order.total||0)-(order.advanceAmount||0))}]);` : '' }
    const csv = rows.map(r => r.map(v => '"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\\n');
    const blob = new Blob(['\\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Invoice_${order.orderNumber}.csv';
    a.click();
  }
  </script>
  </body></html>`)
  win.document.close()
}

const printCatalog = (order: any, settings: any) => {
  const win = window.open('', '_blank')
  if (!win) return
  const sa = order.shippingAddress || {}
  const u = order.user || {}
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })
  const printDate = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })
  const siteName = settings?.siteName || 'Store'
  const logo = settings?.siteLogo || ''
  const totalQty = (order.items || []).reduce((acc: number, it: any) => acc + (it.quantity || 0), 0)

  const cardItems = (order.items || []).map((it: any, i: number) => {
    const fallbackImage = `https://placehold.co/240x240/FCE4EC/E91E63?text=${encodeURIComponent(it.name.substring(0, 8))}`
    const imgUrl = it.image || fallbackImage
    return `
      <div class="card">
        <div class="qty-tag">${it.quantity} Pcs</div>
        <div class="img-box">
          <img src="${imgUrl}" alt="${it.name}" onerror="this.onerror=null;this.src='${fallbackImage}';"/>
        </div>
        <div class="info">
          <div class="title">${it.name}</div>
          ${it.sku ? `<div class="sku">SKU: ${it.sku}</div>` : `<div class="sku" style="background:#f1f5f9;color:#94a3b8;font-family:monospace">SKU: —</div>`}
          ${it.variant ? `<div class="variant">Variant: ${it.variant}</div>` : ''}
          <div class="price-box">
            <div>
              <span class="price-lbl">Wholesale Rate</span>
              <div class="price-val" style="color:#e91e63;font-size:14px;font-weight:800">₹${Number(it.price).toLocaleString('en-IN')}</div>
            </div>
            ${it.mrp && it.mrp > it.price ? `
            <div style="text-align:right">
              <span class="price-lbl">MRP</span>
              <div class="price-val" style="text-decoration:line-through;color:#94a3b8">₹${Number(it.mrp).toLocaleString('en-IN')}</div>
            </div>
            ` : ''}
          </div>
          <div style="margin-top:8px;font-size:11px;color:#64748b;display:flex;justify-content:space-between;background:#f8fafc;padding:5px 8px;border-radius:6px">
            <span>Qty: <strong style="color:#0f172a">${it.quantity} Pcs</strong></span>
            <span>Item Total: <strong style="color:#0f172a">₹${(it.price * it.quantity).toLocaleString('en-IN')}</strong></span>
          </div>
        </div>
      </div>`
  }).join('')

  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <title>Order Catalog Reference ${order.orderNumber}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',system-ui,sans-serif;background:#f8fafc;color:#1e293b;padding:32px;font-size:13px}
    .wrap{max-width:1080px;margin:0 auto}
    .head{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:22px;border-bottom:3px solid #e91e63;margin-bottom:22px;background:#fff;padding:20px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.05)}
    .brand{display:flex;align-items:center;gap:12px}
    .brand img{height:52px;object-fit:contain}
    .logo-box{width:48px;height:48px;background:#e91e63;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:20px}
    .brand-name{font-size:22px;font-weight:800;letter-spacing:-0.5px}
    .brand-sub{font-size:11px;color:#94a3b8;margin-top:2px}
    .inv-right{text-align:right}
    .inv-right h1{font-size:26px;font-weight:900;color:#e91e63;letter-spacing:1px}
    .inv-right p{font-size:12px;color:#64748b;margin-top:3px}
    .meta{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:22px}
    .mc{background:#fff;border-radius:12px;padding:15px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.05)}
    .mc h4{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:6px}
    .mc p{font-size:13px;line-height:1.7}
    
    .grid{display:grid;grid-template-columns:repeat(3, 1fr);gap:20px;margin-bottom:24px}
    .card{background:#fff;border-radius:12px;border:1px solid #e2e8f0;padding:15px;display:flex;flex-direction:column;position:relative;box-shadow:0 1px 3px rgba(0,0,0,0.02);break-inside:avoid;page-break-inside:avoid}
    .img-box{width:100%;height:180px;background:#f8fafc;border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden;margin-bottom:12px;border:1px solid #f1f5f9}
    .img-box img{max-width:100%;max-height:100%;object-fit:contain}
    .info{flex:1;display:flex;flex-direction:column}
    .title{font-size:13px;font-weight:700;color:#1e293b;margin-bottom:6px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;height:36px}
    .sku{display:inline-block;font-size:10px;font-weight:700;color:#6366f1;background:#e0e7ff;padding:2px 8px;border-radius:4px;margin-bottom:8px;width:fit-content;font-family:monospace}
    .variant{font-size:11px;color:#64748b;margin-bottom:8px;font-style:italic}
    
    .price-box{display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding-top:6px;border-top:1px dashed #e2e8f0}
    .price-lbl{font-size:10px;color:#94a3b8;display:block;text-transform:uppercase;font-weight:600;letter-spacing:0.5px}
    .price-val{font-size:12px;font-weight:600;color:#0f172a}
    
    .qty-tag{position:absolute;top:10px;right:10px;background:#e91e63;color:#fff;font-size:11px;font-weight:800;padding:4px 10px;border-radius:20px;box-shadow:0 2px 4px rgba(233,30,99,0.3);z-index:10}
    
    .foot{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}
    .no-print{text-align:center;margin-top:20px;margin-bottom:30px}
    .pbtn{padding:12px 30px;background:#e91e63;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 6px rgba(233,30,99,0.2);margin-right:10px}
    .cbtn{padding:12px 24px;background:#64748b;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer}
    
    @media print{
      body{background:#fff;padding:0}
      .head{box-shadow:none;border:none;padding:10px 0;border-bottom:3px solid #e91e63;border-radius:0}
      .mc{box-shadow:none;padding:10px 0}
      .card{box-shadow:none;border:1px solid #cbd5e1}
      .no-print{display:none}
      .grid{grid-template-columns:repeat(3, 1fr);gap:15px}
    }
  </style>
  </head><body><div class="wrap">
  <div class="head">
    <div class="brand">
      ${logo ? `<img src="${logo}" alt="Logo"/>` : `<div class="logo-box">B</div>`}
      <div>
        <div class="brand-sub" style="font-size:16px;font-weight:800;color:#1e293b">Product Catalog Reference Sheet</div>
      </div>
    </div>
    <div class="inv-right">
      <h1>ORDER CATALOG</h1>
      <p>Order #: <strong>${order.orderNumber}</strong></p>
      <p>Date: ${orderDate}</p>
      <p>Printed: ${printDate}</p>
      <p style="margin-top:4px;font-size:12px;color:#e91e63">Items: <strong>${(order.items || []).length}</strong> | Total Qty: <strong>${totalQty} Pcs</strong></p>
    </div>
  </div>

  <div class="meta">
    <div class="mc">
      <h4>Customer Details</h4>
      <p><strong>Shop: ${sa.name || '—'}</strong><br/>
      Contact Person: ${u.name || '—'}<br/>
      📞 Phone: ${u.phone || sa.phone || '—'}</p>
    </div>
    <div class="mc">
      <h4>Shipping Address</h4>
      <p>${sa.addressLine1 || '—'}${sa.addressLine2 ? ', ' + sa.addressLine2 : ''}<br/>
      ${sa.city || ''}, ${sa.state || ''}<br/>
      PIN: ${sa.pincode || '—'}</p>
    </div>
  </div>

  <div class="grid">${cardItems}</div>

  <div class="foot">
    <p style="font-size:13px;font-weight:600;color:#475569;margin-bottom:4px">Catalog Reference for Order #${order.orderNumber}</p>
    <p>This catalog contains products ordered by the customer. Thank you for your business!</p>
  </div>
  </div>
  <div class="no-print">
    <button class="pbtn" onclick="window.print()">🖨️ Print Catalog / Save PDF</button>
    <button class="cbtn" onclick="window.close()">Close Window</button>
  </div>
  </body></html>`)
  win.document.close()
}


// Dropdown mein sirf ye 4 options
const STATUS_OPT = ['confirmed','shipped','delivered','cancelled']
const SC: Record<string,string> = { placed:'bg-blue-100 text-blue-700', confirmed:'bg-blue-100 text-blue-700', processing:'bg-blue-100 text-blue-700', shipped:'bg-orange-100 text-orange-700', delivered:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-700' }

// placed/processing → "confirmed" ke roop mein dikhao
const displayStatus = (s: string) => (s === 'placed' || s === 'processing') ? 'confirmed' : s
const displayLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const BOX_WEIGHTS_KG: Record<string, number> = { A28: 8.46, A06: 10.75, A08: 15.68, A31: 34.18, A18: 2.42, CVR: 0.20 }
const BOX_LABELS: Record<string, string> = { A28: 'A28', A06: 'A06', A08: 'A08', A31: 'A31', A18: 'A18', CVR: '✉️ Cover' }
const BOX_SIZES = ['A28','A06','A08','A31','A18','CVR'] as const
type BoxSize = typeof BOX_SIZES[number]

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<any>(null)
  const [updating, setUpdating] = useState<string|null>(null)
  const [siteSettings, setSiteSettings] = useState<any>(null)
  const [editingAdvance, setEditingAdvance] = useState<string|null>(null)
  const [advanceInput, setAdvanceInput] = useState('')

  // ── Delete Modal State ──
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; order: any | null }>({ open: false, order: null })
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeletePwd, setShowDeletePwd] = useState(false)

  // ── Multi-Select State ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkDeletePwd, setBulkDeletePwd] = useState('')
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)
  const [showBulkPwd, setShowBulkPwd] = useState(false)

  useEffect(() => { api.get('/settings').then(r => setSiteSettings(r.data.settings)).catch(() => {}) }, [])

  // Ship modal state
  const [shipOpen, setShipOpen] = useState(false)
  const [shipOrder, setShipOrder] = useState<any>(null)
  const [shipProvider, setShipProvider] = useState<'delhivery'|'shiprocket'|'manual'>('delhivery')
  const [manualTracking, setManualTracking] = useState('')
  const [manualCourier, setManualCourier] = useState('')
  const [boxes, setBoxes] = useState<Record<BoxSize, { qty: number; weight: number }>>({ A28:{qty:0,weight:0}, A06:{qty:0,weight:0}, A08:{qty:0,weight:0}, A31:{qty:0,weight:0}, A18:{qty:0,weight:0}, CVR:{qty:0,weight:0} })
  const [cvrDims, setCvrDims] = useState({ l: '', b: '', h: '', wt: '' })
  const [shipErr, setShipErr] = useState('')
  const [shipping, setShipping] = useState(false)

  const openTracking = (order: any) => {
    if (!order.trackingNumber) return
    const courier = (order.courierName || '').toLowerCase()
    const trackUrl = courier.includes('delhivery')
      ? `https://www.delhivery.com/track-v2/package/${order.trackingNumber}`
      : `https://www.google.com/search?q=${encodeURIComponent(order.trackingNumber + ' ' + order.courierName + ' tracking')}`
    window.open(trackUrl, '_blank')
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20' })
      if (filter) p.set('status', filter)
      const res = await api.get(`/orders?${p}`)
      setOrders(res.data.orders); setTotal(res.data.total)
    } catch {} finally { setLoading(false) }
  }, [filter, page])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // ── Delete Order ──────────────────────────────────────────────────────────
  const openDeleteModal = (order: any) => {
    setDeleteModal({ open: true, order })
    setDeletePassword('')
    setShowDeletePwd(false)
  }

  const handleDelete = async () => {
    if (!deleteModal.order) return
    setDeleteLoading(true)
    try {
      await api.delete(`/orders/${deleteModal.order._id}`, { data: { password: deletePassword } })
      toast.success(`Order #${deleteModal.order.orderNumber} deleted!`)
      setDeleteModal({ open: false, order: null })
      setDeletePassword('')
      setSelectedIds(prev => { const n = new Set(prev); n.delete(deleteModal.order._id); return n })
      fetchOrders()
      if (selected?._id === deleteModal.order._id) setSelected(null)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Delete failed')
    } finally { setDeleteLoading(false) }
  }

  // ── Multi-Select Helpers ────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(orders.map((o: any) => o._id)))
    }
  }

  const openBulkDeleteModal = () => {
    setBulkDeletePwd('')
    setShowBulkPwd(false)
    setBulkDeleteOpen(true)
  }

  const handleBulkDelete = async () => {
    setBulkDeleteLoading(true)
    try {
      const ids = Array.from(selectedIds)
      const res = await api.delete('/orders/bulk', { data: { password: bulkDeletePwd, ids } })
      toast.success(res.data.message || `${ids.length} orders deleted!`)
      setBulkDeleteOpen(false)
      setBulkDeletePwd('')
      setSelectedIds(new Set())
      fetchOrders()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Bulk delete failed')
    } finally { setBulkDeleteLoading(false) }
  }

  const updateStatus = async (orderId: string, status: string) => {
    if (status === 'shipped') { openShipModal(orders.find(o => o._id === orderId)); return }
    setUpdating(orderId)
    try {
      await api.put(`/orders/${orderId}/status`, { status, note: `Updated to ${status} by admin` })
      toast.success(`Marked as ${status}`)
      fetchOrders()
      if (selected?._id === orderId) setSelected((s:any) => s ? {...s, orderStatus: status} : null)
    } catch { toast.error('Update failed') } finally { setUpdating(null) }
  }

  const saveAdvance = async (orderId: string) => {
    const amt = Number(advanceInput)
    if (isNaN(amt) || amt < 0) { toast.error('Valid amount daalo'); return }
    try {
      await api.put(`/orders/${orderId}/advance`, { advanceAmount: amt })
      toast.success(`Advance ₹${amt} updated!`)
      fetchOrders()
      setEditingAdvance(null)
    } catch { toast.error('Update failed') }
  }

  const markPaymentPaid = async (orderId: string) => {
    try {
      await api.put(`/orders/${orderId}/payment-status`, { paymentStatus: 'paid' })
      toast.success('Payment marked as paid')
      fetchOrders()
      if (selected?._id === orderId) setSelected((s:any) => s ? {...s, paymentStatus: 'paid'} : null)
    } catch { toast.error('Update failed') }
  }

  const openShipModal = (order: any) => {
    if (!order) return
    setShipOrder(order)
    setShipProvider('delhivery')
    setManualTracking(order.trackingNumber || '')
    setManualCourier(order.courierName || '')
    setBoxes({ A28:{qty:0,weight:0}, A06:{qty:0,weight:0}, A08:{qty:0,weight:0}, A31:{qty:0,weight:0}, A18:{qty:0,weight:0}, CVR:{qty:0,weight:0} })
    setCvrDims({ l: '', b: '', h: '', wt: '' })
    setShipErr('')
    setShipOpen(true)
  }

  const handleBoxQty = (size: BoxSize, val: string) => {
    const qty = Math.max(0, Number(val) || 0)
    // CVR: weight comes from cvrDims.wt, not BOX_WEIGHTS_KG
    const weight = size === 'CVR' ? 0 : qty * BOX_WEIGHTS_KG[size]
    setBoxes(prev => ({ ...prev, [size]: { qty, weight } }))
  }

  const totalBoxQty = BOX_SIZES.reduce((s, k) => s + boxes[k].qty, 0)
  const cvrWeightKg = (boxes['CVR'].qty * Number(cvrDims.wt || 0)) / 1000
  const totalBoxWeightKg = BOX_SIZES.reduce((s, k) => k === 'CVR' ? s : s + boxes[k].weight, 0) + cvrWeightKg

  const submitShip = async () => {
    if (!shipOrder) return
    setShipErr('')

    const payload: any = { status: 'shipped', shipProvider }

    if (shipProvider === 'delhivery') {
      if (totalBoxQty === 0) { setShipErr('Kam se kam 1 box add karo.'); return }
      if (boxes['CVR'].qty > 0) {
        if (!cvrDims.l || !cvrDims.b || !cvrDims.h) { setShipErr('Cover ke dimensions (L × B × H) daalo.'); return }
        if (!cvrDims.wt) { setShipErr('Cover ka weight daalo.'); return }
      }
      payload.packingDetails = BOX_SIZES.filter(k => boxes[k].qty > 0).map(k => ({
        boxType: k, quantity: boxes[k].qty, totalWeight: boxes[k].weight,
        ...(k === 'CVR' ? { customDims: { l: Number(cvrDims.l), b: Number(cvrDims.b), h: Number(cvrDims.h) }, customWeightKg: Number(cvrDims.wt) / 1000 } : {})
      }))
    } else {
      if (!manualTracking.trim()) { setShipErr('Tracking ID required.'); return }
      payload.trackingNumber = manualTracking.trim()
      payload.courierName = manualCourier.trim() || (shipProvider === 'shiprocket' ? 'Shiprocket' : manualCourier)
    }

    try {
      setShipping(true)
      await api.put(`/orders/${shipOrder._id}/status`, payload)
      toast.success('Order shipped! WhatsApp message bhi gaya 🚚')
      setShipOpen(false)
      fetchOrders()
      if (selected?._id === shipOrder._id) setSelected((s:any) => s ? { ...s, orderStatus: 'shipped' } : null)
    } catch (e: any) {
      setShipErr(e?.response?.data?.message || 'Shipping failed.')
    } finally { setShipping(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Orders</h1><p className="text-gray-500 text-sm">{total} total orders</p></div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <button
                onClick={() => bulkExportExcel(orders.filter(o => selectedIds.has(o._id)))}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
              >
                📊 Export {selectedIds.size} Selected
              </button>
              <button
                onClick={openBulkDeleteModal}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
              >
                <Trash2 size={15}/> Delete {selectedIds.size} Selected
              </button>
            </>
          )}
          <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); setSelectedIds(new Set()) }} className="input w-44 py-2">
            <option value="">All Orders</option>
            {STATUS_OPT.map(s => <option key={s} value={s} className="capitalize">{displayLabel(s)}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="th w-10">
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && selectedIds.size === orders.length}
                    ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < orders.length }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-red-500 cursor-pointer"
                  />
                </th>
                <th className="th">Order</th><th className="th">Customer</th><th className="th">Items</th><th className="th">Total</th><th className="th">Payment</th><th className="th">Status</th><th className="th">Tracking</th><th className="th">Date</th><th className="th">Actions</th><th className="th">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array(8).fill(0).map((_,i) => (
                <tr key={i}><td colSpan={11} className="p-3"><div className="h-10 skeleton rounded-lg"/></td></tr>
              )) : orders.map((o: any) => (
                <tr key={o._id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(o._id) ? 'bg-red-50' : ''}`}>
                  <td className="td">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(o._id)}
                      onChange={() => toggleSelect(o._id)}
                      className="w-4 h-4 accent-red-500 cursor-pointer"
                    />
                  </td>
                  <td className="td"><p className="font-bold text-sm">#{o.orderNumber}</p></td>
                  <td className="td"><p className="font-medium text-sm">{o.user?.name||'—'}</p><p className="text-xs text-gray-400">{o.user?.phone}</p></td>
                  <td className="td text-gray-600">{o.items?.length||0} item(s)</td>
                  <td className="td font-bold">₹{o.total}</td>
                  <td className="td">
                    <span className={`badge ${o.paymentMethod==='cod'?'bg-orange-100 text-orange-700':o.paymentMethod==='upi'?'bg-blue-100 text-blue-700':'bg-purple-100 text-purple-700'} uppercase`}>{o.paymentMethod}</span>
                    {o.paymentStatus==='pending' && o.paymentMethod!=='cod' && <span className="ml-1 badge bg-red-100 text-red-600 text-xs">Unpaid</span>}
                    {o.paymentStatus==='paid' && o.paymentMethod!=='cod' && <span className="ml-1 badge bg-green-100 text-green-700 text-xs">Paid ✓</span>}
                    {o.paymentMethod==='cod' && (
                      editingAdvance === o._id ? (
                        <div className="mt-1 flex items-center gap-1">
                          <input type="number" value={advanceInput} onChange={e => setAdvanceInput(e.target.value)} onKeyDown={e => { if(e.key==='Enter') saveAdvance(o._id); if(e.key==='Escape') setEditingAdvance(null) }} className="w-20 text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-primary" autoFocus placeholder="₹" />
                          <button onClick={() => saveAdvance(o._id)} className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded font-bold">✓</button>
                          <button onClick={() => setEditingAdvance(null)} className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold">✕</button>
                        </div>
                      ) : (
                        <div className="mt-0.5 flex items-center gap-1">
                          {o.advanceAmount > 0
                            ? <span className="text-xs text-green-700 font-semibold">Advance ₹{o.advanceAmount} ✓</span>
                            : <span className="text-xs text-red-500 font-semibold">No advance</span>
                          }
                          <button onClick={() => { setEditingAdvance(o._id); setAdvanceInput(String(o.advanceAmount||0)) }} className="text-[9px] text-gray-400 hover:text-primary underline ml-0.5">edit</button>
                        </div>
                      )
                    )}
                  </td>
                  <td className="td">
                    <div className="relative inline-block">
                      <select value={displayStatus(o.orderStatus)} onChange={e => updateStatus(o._id, e.target.value)} disabled={updating===o._id||o.orderStatus==='cancelled'}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-full border-0 cursor-pointer appearance-none pr-6 ${SC[o.orderStatus]||'bg-gray-100 text-gray-600'} disabled:opacity-60`}>
                        {STATUS_OPT.map(s => <option key={s} value={s} className="bg-white text-gray-900 capitalize">{displayLabel(s)}</option>)}
                      </select>
                      <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
                    </div>
                  </td>
                  <td className="td text-xs text-gray-500">
                    {o.trackingNumber ? (
                      <button onClick={() => openTracking(o)} className="text-left">
                        <span className="text-green-600 font-medium hover:underline">{o.courierName}: {o.trackingNumber}</span>
                        <span className="ml-1 text-xs text-blue-500 font-semibold">📍 Track</span>
                      </button>
                    ) : '—'}
                    {o.wa?.trackingSent && <span className="ml-1 text-green-500 text-xs">✓WA</span>}
                  </td>
                  <td className="td text-gray-400 text-xs">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="td">
                    <div className="flex gap-1 flex-wrap">
                      <button onClick={() => setSelected(o)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="View"><Eye size={15}/></button>
                      <button onClick={() => openShipModal(o)} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg" title="Ship"><Truck size={15}/></button>
                      {o.paymentStatus === 'pending' && o.paymentMethod !== 'cod' && (
                        <button onClick={() => markPaymentPaid(o._id)} className="px-2 py-1 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg" title="Mark payment received">₹ Paid</button>
                      )}
                      <button onClick={() => openDeleteModal(o)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete Order"><Trash2 size={15}/></button>
                    </div>
                  </td>
                  <td className="td">
                    <div className="flex gap-1 flex-wrap">
                      <button onClick={() => exportExcel(o)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Excel"><span className="text-[15px]">📊</span></button>
                      <button onClick={() => printInvoice(o, siteSettings)} className="p-1.5 text-pink-500 hover:bg-pink-50 rounded-lg" title="Invoice"><FileText size={15}/></button>
                      <button onClick={() => printCatalog(o, siteSettings)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg" title="Catalog Reference"><BookOpen size={15}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && orders.length === 0 && <div className="text-center py-16 text-gray-400">No orders found</div>}
        </div>
        {total > 20 && (() => {
          const totalPages = Math.ceil(total / 20)
          const win = 5
          let start = Math.max(1, page - Math.floor(win / 2))
          let end = Math.min(totalPages, start + win - 1)
          if (end - start < win - 1) start = Math.max(1, end - win + 1)
          return (
            <div className="p-4 border-t flex justify-center items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">← Prev</button>
              {start > 1 && <><button onClick={() => setPage(1)} className="w-9 h-9 rounded-lg text-sm font-medium hover:bg-gray-100">1</button>{start > 2 && <span className="text-gray-400 px-1">…</span>}</>}
              {Array.from({ length: end - start + 1 }, (_, i) => start + i).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-lg text-sm font-medium ${page === p ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}>{p}</button>
              ))}
              {end < totalPages && <>{end < totalPages - 1 && <span className="text-gray-400 px-1">…</span>}<button onClick={() => setPage(totalPages)} className="w-9 h-9 rounded-lg text-sm font-medium hover:bg-gray-100">{totalPages}</button></>}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">Next →</button>
              <span className="text-xs text-gray-400 ml-2">Page {page} of {totalPages} ({total} total)</span>
            </div>
          )
        })()}
      </div>

      {/* ── Order Detail Modal ── */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[88vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-bold text-lg">#{selected.orderNumber}</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs mb-1">Customer</p><p className="font-bold">{selected.user?.name}</p><p className="text-gray-500 text-xs">{selected.user?.phone}</p></div>
                <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs mb-1">Payment</p><p className="font-bold text-lg">₹{selected.total}</p><p className="uppercase text-orange-500 text-xs font-bold">{selected.paymentMethod}</p>{selected.paymentMethod==='cod' && selected.advanceAmount>0 && <p className="text-green-600 text-xs font-semibold mt-0.5">Advance ₹{selected.advanceAmount} paid ✓</p>}{selected.paymentMethod==='cod' && <p className="text-red-600 text-xs font-semibold">Collect: ₹{Math.max(0,selected.total-(selected.advanceAmount||0))}</p>}</div>
              </div>
              {selected.trackingNumber && (
                <div className="bg-green-50 rounded-xl p-3 text-sm">
                  <p className="text-green-700 font-semibold">🚚 {selected.courierName}: {selected.trackingNumber}</p>
                  {selected.wa?.trackingSent && <p className="text-green-500 text-xs mt-1">✓ WhatsApp tracking sent</p>}
                </div>
              )}
              <div><p className="font-bold text-sm mb-2">Delivery Address</p>
                <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600"><p>{selected.shippingAddress?.name} · {selected.shippingAddress?.phone}</p><p>{selected.shippingAddress?.addressLine1}{selected.shippingAddress?.addressLine2?`, ${selected.shippingAddress.addressLine2}`:''}</p><p>{selected.shippingAddress?.city}, {selected.shippingAddress?.state} – {selected.shippingAddress?.pincode}</p></div>
              </div>
              <div><p className="font-bold text-sm mb-2">Items</p>
                <div className="space-y-2">{selected.items?.map((item:any,i:number) => (
                  <div key={i} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                    <img src={item.image||`https://placehold.co/48x48/FCE4EC/E91E63?text=P`} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" alt=""/>
                    <div className="text-sm flex-1"><p className="font-semibold line-clamp-1">{item.name}</p><p className="text-gray-400 text-xs">{item.variant||''}</p><p className="text-gray-600 mt-0.5">₹{item.price} × {item.quantity} = <strong>₹{item.price*item.quantity}</strong></p></div>
                  </div>
                ))}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{selected.subtotal}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{selected.shippingCharge===0?'FREE':'₹'+selected.shippingCharge}</span></div>
                {selected.discount>0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{selected.discount}</span></div>}
                <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Total</span><span>₹{selected.total}</span></div>
                {selected.paymentMethod==='cod' && selected.advanceAmount>0 && <div className="flex justify-between text-green-600 text-sm"><span>Advance Paid</span><span>-₹{selected.advanceAmount}</span></div>}
                {selected.paymentMethod==='cod' && <div className="flex justify-between font-bold text-red-600 text-sm"><span>To Collect (COD)</span><span>₹{Math.max(0,selected.total-(selected.advanceAmount||0))}</span></div>}
                {(() => {
                  const byRate: Record<number,number> = {}
                  ;(selected.items||[]).forEach((it:any) => {
                    const r=it.gstRate||0; if(!r) return
                    byRate[r]=(byRate[r]||0)+it.price*it.quantity*r/(100+r)
                  })
                  const entries=Object.entries(byRate).sort(([a],[b])=>Number(a)-Number(b))
                  if(!entries.length) return null
                  return <div className="pt-1 border-t border-dashed space-y-0.5">
                    {entries.map(([r,a])=>(
                      <div key={r} className="flex justify-between text-indigo-500 text-xs">
                        <span>GST @ {r}% (incl.)</span><span>₹{(a as number).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                })()}
                {selected.gstin && <div className="flex justify-between text-indigo-600 text-xs pt-1 border-t border-dashed"><span>🧾 GSTIN</span><span className="font-mono font-bold">{selected.gstin}</span></div>}
              </div>
              {/* WhatsApp Status */}
              <div className={`rounded-xl p-3 text-xs ${selected.wa?.orderConfirmedSent ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                <div className="flex items-center justify-between">
                  <span>{selected.wa?.orderConfirmedSent ? '✅ WhatsApp confirmation sent' : '❌ WhatsApp confirmation not sent'}</span>
                  {!selected.wa?.orderConfirmedSent && (
                    <button onClick={async () => {
                      try {
                        await api.post(`/orders/${selected._id}/resend-wa`)
                        toast.success('WhatsApp sent!')
                        fetchOrders()
                        setSelected((s:any) => s ? {...s, wa: {...s.wa, orderConfirmedSent: true, lastError: ''}} : null)
                      } catch { toast.error('Failed to send') }
                    }} className="ml-2 px-2 py-1 bg-green-600 text-white rounded-lg font-semibold">
                      Retry
                    </button>
                  )}
                </div>
                {selected.wa?.lastError && <p className="mt-1 text-xs opacity-70 break-all">{selected.wa.lastError}</p>}
              </div>

              <div><p className="font-bold text-sm mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPT.map(s => (
                    <button key={s} onClick={() => updateStatus(selected._id, s)}
                      className={`text-xs px-3 py-1.5 rounded-full capitalize font-semibold border transition-colors ${displayStatus(selected.orderStatus)===s?SC[s]+' border-transparent':'border-gray-200 hover:border-primary hover:text-primary'}`}>
                      {displayLabel(s)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* ── Sticky Footer Buttons ── */}
            <div className="p-4 border-t bg-white flex gap-2 sticky bottom-0 rounded-b-2xl">
              <button onClick={() => printInvoice(selected, siteSettings)}
                className="flex-1 flex items-center justify-center gap-2 border-2 border-pink-400 text-pink-500 hover:bg-pink-500 hover:text-white py-2.5 rounded-xl font-semibold text-sm transition-colors">
                <FileText size={15}/> Invoice
              </button>
              <button onClick={() => printCatalog(selected, siteSettings)}
                className="flex-1 flex items-center justify-center gap-2 border-2 border-indigo-400 text-indigo-500 hover:bg-indigo-500 hover:text-white py-2.5 rounded-xl font-semibold text-sm transition-colors">
                <BookOpen size={15}/> Catalog
              </button>
              <button onClick={() => exportExcel(selected)}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors">
                📊 Excel
              </button>
              <button onClick={() => openShipModal(selected)}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors">
                <Truck size={16}/> Ship
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live tracking: opens in new tab directly */}

      {/* ── Ship Modal ── */}
      {shipOpen && shipOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShipOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-bold text-lg flex items-center gap-2"><Truck size={18} className="text-orange-500"/> Ship #{shipOrder.orderNumber}</h2>
              <button onClick={() => setShipOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Customer summary */}
              <div className="bg-gray-50 rounded-xl p-3 text-sm">
                <p className="font-semibold">{shipOrder.shippingAddress?.name}</p>
                <p className="text-gray-500 text-xs">{shipOrder.shippingAddress?.city}, {shipOrder.shippingAddress?.state} – {shipOrder.shippingAddress?.pincode}</p>
                <p className="text-orange-600 font-bold mt-1">
                  ₹{shipOrder.total} · {shipOrder.paymentMethod?.toUpperCase()}
                  {shipOrder.paymentMethod === 'cod' && (
                    <span className="ml-2 text-sm">
                      · Collect: <span className="text-red-600">₹{Math.max(0, shipOrder.total - (shipOrder.advanceAmount || 0))}</span>
                      {shipOrder.advanceAmount > 0 && <span className="text-green-600 text-xs ml-1">(Advance ₹{shipOrder.advanceAmount} paid)</span>}
                    </span>
                  )}
                </p>
              </div>

              {/* Provider selector */}
              <div>
                <p className="text-sm font-semibold mb-2">Courier Provider</p>
                <div className="flex gap-2">
                  {([['delhivery','📦 Delhivery'],['shiprocket','🚀 Shiprocket'],['manual','✏️ Manual']] as const).map(([val, label]) => (
                    <button key={val} type="button" onClick={() => setShipProvider(val)}
                      className={`flex-1 text-xs py-2 px-3 rounded-xl border font-semibold transition-colors ${shipProvider===val?'bg-orange-500 text-white border-orange-500':'border-gray-200 hover:border-orange-300'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delhivery: Box packing */}
              {shipProvider === 'delhivery' && (
                <div>
                  <p className="text-sm font-semibold mb-2">📦 Packing Details</p>
                  <div className="space-y-2">
                    {BOX_SIZES.map(size => (
                      <div key={size} className="space-y-1">
                        <div className={`flex items-center gap-3 rounded-xl p-2.5 ${size==='CVR'?'bg-blue-50 border border-blue-100':'bg-gray-50'}`}>
                          <span className={`text-sm font-bold w-16 ${size==='CVR'?'text-blue-600':'text-gray-700'}`}>{BOX_LABELS[size]}</span>
                          <input type="number" min="0" placeholder="Qty" value={boxes[size].qty || ''}
                            onChange={e => handleBoxQty(size, e.target.value)}
                            className="input flex-1 py-1.5 text-sm"/>
                          <span className="text-xs text-gray-400 w-16 text-right">
                            {size === 'CVR'
                              ? (cvrDims.wt ? `${cvrDims.wt}g/pc` : 'Custom')
                              : (boxes[size].weight > 0 ? `${(boxes[size].weight*1000).toLocaleString()}g` : `${(BOX_WEIGHTS_KG[size]*1000).toFixed(0)}g/pc`)}
                          </span>
                        </div>
                        {size === 'CVR' && (
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2">
                            <p className="text-xs font-semibold text-blue-700 mb-1">✉️ Cover ka size aur weight daalo</p>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <label className="text-[10px] text-gray-500 font-medium">Length (cm)</label>
                                <input type="number" min="1" placeholder="L" value={cvrDims.l}
                                  onChange={e => setCvrDims(p => ({...p, l: e.target.value}))}
                                  className="input w-full py-1 text-sm mt-0.5"/>
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] text-gray-500 font-medium">Breadth (cm)</label>
                                <input type="number" min="1" placeholder="B" value={cvrDims.b}
                                  onChange={e => setCvrDims(p => ({...p, b: e.target.value}))}
                                  className="input w-full py-1 text-sm mt-0.5"/>
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] text-gray-500 font-medium">Height (cm)</label>
                                <input type="number" min="1" placeholder="H" value={cvrDims.h}
                                  onChange={e => setCvrDims(p => ({...p, h: e.target.value}))}
                                  className="input w-full py-1 text-sm mt-0.5"/>
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] text-gray-500 font-medium">Weight (grams)</label>
                                <input type="number" min="1" placeholder="g" value={cvrDims.wt}
                                  onChange={e => setCvrDims(p => ({...p, wt: e.target.value}))}
                                  className="input w-full py-1 text-sm mt-0.5"/>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {totalBoxQty > 0 && (
                    <div className="mt-2 bg-orange-50 rounded-xl p-2.5 text-sm flex justify-between">
                      <span className="text-orange-700 font-medium">{totalBoxQty} box{totalBoxQty>1?'es':''}</span>
                      <span className="text-orange-700 font-bold">{(totalBoxWeightKg*1000).toLocaleString()}g ({totalBoxWeightKg.toFixed(2)} kg)</span>
                    </div>
                  )}
                </div>
              )}

              {/* Shiprocket / Manual: Tracking ID */}
              {(shipProvider === 'shiprocket' || shipProvider === 'manual') && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold block mb-1">Tracking ID *</label>
                    <input type="text" value={manualTracking} onChange={e => setManualTracking(e.target.value)}
                      placeholder="Enter AWB / tracking number" className="input w-full py-2 text-sm"/>
                  </div>
                  <div>
                    <label className="text-sm font-semibold block mb-1">Courier Name</label>
                    <input type="text" value={manualCourier} onChange={e => setManualCourier(e.target.value)}
                      placeholder={shipProvider === 'shiprocket' ? 'e.g. Delhivery, DTDC' : 'Courier name'} className="input w-full py-2 text-sm"/>
                  </div>
                </div>
              )}

              {shipErr && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3">⚠️ {shipErr}</div>}

              <div className="flex gap-2 pt-1">
                <button onClick={() => setShipOpen(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={submitShip} disabled={shipping} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                  {shipping ? 'Processing...' : <><Truck size={15}/> {shipProvider === 'delhivery' ? 'Generate AWB' : 'Mark Shipped'}</>}
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center">WhatsApp tracking message customer ko automatically jayega</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Order Modal ── */}
      {deleteModal.open && deleteModal.order && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setDeleteModal({ open: false, order: null })}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Trash2 size={20} className="text-red-600"/>
                </div>
                <div>
                  <h2 className="font-bold text-base text-red-700">Delete Order</h2>
                  <p className="text-xs text-gray-400">#{deleteModal.order.orderNumber}</p>
                </div>
              </div>
              <button onClick={() => setDeleteModal({ open: false, order: null })} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                <p className="font-bold mb-1">⚠️ This action is irreversible!</p>
                <p>Order <strong>#{deleteModal.order.orderNumber}</strong> will be permanently deleted. Stock will NOT be restored.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Enter Delete Password</label>
                <div className="relative">
                  <input
                    type={showDeletePwd ? 'text' : 'password'}
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && deletePassword && handleDelete()}
                    className="input pr-10 border-red-200 focus:border-red-400"
                    placeholder="Enter admin delete password…"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowDeletePwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showDeletePwd ? '🙈' : '👁️'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Set this password in Admin → Settings → Advanced</p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setDeleteModal({ open: false, order: null })}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!deletePassword || deleteLoading}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  {deleteLoading ? 'Deleting…' : <><Trash2 size={15}/> Delete Order</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Delete Modal ── */}
      {bulkDeleteOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setBulkDeleteOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Trash2 size={20} className="text-red-600"/>
                </div>
                <div>
                  <h2 className="font-bold text-base text-red-700">Bulk Delete Orders</h2>
                  <p className="text-xs text-gray-400">{selectedIds.size} order(s) selected</p>
                </div>
              </div>
              <button onClick={() => setBulkDeleteOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                <p className="font-bold mb-1">⚠️ This action is irreversible!</p>
                <p><strong>{selectedIds.size} order(s)</strong> will be permanently deleted. Stock will NOT be restored.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Enter Delete Password</label>
                <div className="relative">
                  <input
                    type={showBulkPwd ? 'text' : 'password'}
                    value={bulkDeletePwd}
                    onChange={e => setBulkDeletePwd(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && bulkDeletePwd && handleBulkDelete()}
                    className="input pr-10 border-red-200 focus:border-red-400"
                    placeholder="Enter admin delete password…"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowBulkPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showBulkPwd ? '🙈' : '👁️'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Set this password in Admin → Settings → Advanced</p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setBulkDeleteOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={!bulkDeletePwd || bulkDeleteLoading}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  {bulkDeleteLoading ? 'Deleting…' : <><Trash2 size={15}/> Delete {selectedIds.size} Orders</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdersPage
