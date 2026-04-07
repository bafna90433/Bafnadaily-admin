import React, { useEffect, useState } from 'react'
import { IndianRupee, ShoppingBag, Users, Package, TrendingUp, AlertTriangle, Clock } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../utils/api'

interface Stats { totalRevenue:number; totalOrders:number; totalUsers:number; totalProducts:number; pendingOrders:number }
interface MonthData { month:string; revenue:number; orders:number }

const SC: Record<string,string> = { placed:'bg-blue-100 text-blue-700', confirmed:'bg-purple-100 text-purple-700', processing:'bg-yellow-100 text-yellow-700', shipped:'bg-orange-100 text-orange-700', delivered:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-700' }

const StatCard: React.FC<{ icon: React.ElementType; title:string; value:string|number; color:string; sub?:string }> = ({ icon: Icon, title, value, color, sub }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}><Icon size={22} className="text-white"/></div>
    <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p><p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>{sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}</div>
  </div>
)

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.get('/admin/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false)) }, [])

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array(4).fill(0).map((_,i) => <div key={i} className="h-24 skeleton rounded-xl"/>)}</div>
      <div className="grid lg:grid-cols-2 gap-6"><div className="h-72 skeleton rounded-xl"/><div className="h-72 skeleton rounded-xl"/></div>
    </div>
  )

  const { stats, monthlyRevenue=[], recentOrders=[], lowStockProducts=[] } = data || {}

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Dashboard</h1><p className="text-gray-500 text-sm mt-0.5">Welcome back! Here's your store overview.</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={IndianRupee} title="Total Revenue" value={`₹${(stats?.totalRevenue||0).toLocaleString('en-IN')}`} color="bg-green-500" sub="Net from all orders"/>
        <StatCard icon={ShoppingBag} title="Total Orders" value={stats?.totalOrders||0} color="bg-blue-500" sub={`${stats?.pendingOrders||0} pending`}/>
        <StatCard icon={Users} title="Customers" value={stats?.totalUsers||0} color="bg-purple-500" sub="Registered users"/>
        <StatCard icon={Package} title="Products" value={stats?.totalProducts||0} color="bg-orange-500" sub="Active listings"/>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp size={17} className="text-primary"/> Revenue (6 months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`}/>
              <Tooltip formatter={(v:any) => [`₹${v}`, 'Revenue']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}/>
              <Line type="monotone" dataKey="revenue" stroke="#E91E63" strokeWidth={2.5} dot={{ fill: '#E91E63', r: 4 }} activeDot={{ r: 6 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><ShoppingBag size={17} className="text-primary"/> Orders (6 months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}/>
              <Bar dataKey="orders" fill="#E91E63" radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2"><Clock size={16} className="text-primary"/> Recent Orders</h3>
            <a href="/orders" className="text-primary text-xs font-semibold hover:underline">View All</a>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.slice(0,7).map((o:any) => (
              <div key={o._id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                <div><p className="text-sm font-semibold">#{o.orderNumber}</p><p className="text-xs text-gray-400">{o.user?.name} · ₹{o.total}</p></div>
                <span className={`badge ${SC[o.orderStatus]||'bg-gray-100 text-gray-600'} capitalize`}>{o.orderStatus}</span>
              </div>
            ))}
            {recentOrders.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No orders yet</p>}
          </div>
        </div>
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500"/>
            <h3 className="font-bold">Low Stock Alert</h3>
            {lowStockProducts.length > 0 && <span className="badge bg-orange-100 text-orange-600 ml-auto">{lowStockProducts.length}</span>}
          </div>
          {lowStockProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">✅ All products well stocked</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {lowStockProducts.map((p:any) => (
                <div key={p._id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50">
                  <img src={p.images?.[0]?.url||`https://placehold.co/40x40/FCE4EC/E91E63?text=P`} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" alt=""/>
                  <p className="text-sm font-medium flex-1 truncate">{p.name}</p>
                  <span className={`badge ${p.stock===0?'bg-red-100 text-red-600':'bg-orange-100 text-orange-600'}`}>{p.stock===0?'Out of stock':`${p.stock} left`}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
