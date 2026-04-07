import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Search, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) p.set('search', search)
      const res = await api.get(`/products?${p}`)
      setProducts(res.data.products); setTotal(res.data.total)
    } catch {} finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { fetch() }, [fetch])

  const del = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    try { await api.delete(`/products/${id}`); toast.success('Product deleted'); fetch() }
    catch { toast.error('Failed') }
  }

  const toggle = async (id: string, current: boolean) => {
    try { await api.put(`/products/${id}`, { isActive: !current }); fetch() }
    catch { toast.error('Failed') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Products</h1><p className="text-gray-500 text-sm">{total} total</p></div>
        <Link to="/products/add" className="btn-primary"><Plus size={17}/> Add Product</Link>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9 py-2" placeholder="Search products…"/>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr><th className="th">Product</th><th className="th">Category</th><th className="th">Price</th><th className="th">Stock</th><th className="th">Badges</th><th className="th">Status</th><th className="th">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array(8).fill(0).map((_,i) => (
                <tr key={i}><td colSpan={7} className="p-3"><div className="h-10 skeleton rounded-lg"/></td></tr>
              )) : products.map(p => (
                <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0]?.url||`https://placehold.co/40x40/FCE4EC/E91E63?text=P`} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" alt=""/>
                      <div><p className="font-semibold text-sm line-clamp-1 max-w-[200px]">{p.name}</p><p className="text-xs text-gray-400 mt-0.5">{p.sku||'—'}</p></div>
                    </div>
                  </td>
                  <td className="td text-gray-500 text-xs">{p.category?.name||'—'}</td>
                  <td className="td"><span className="font-bold">₹{p.price}</span>{p.mrp>p.price&&<span className="text-xs text-gray-400 ml-1.5 line-through">₹{p.mrp}</span>}</td>
                  <td className="td"><span className={`font-bold ${p.stock===0?'text-red-500':p.stock<10?'text-orange-500':'text-green-600'}`}>{p.stock}</span></td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1">
                      {p.isTrending&&<span className="badge bg-orange-100 text-orange-600">🔥</span>}
                      {p.isFeatured&&<span className="badge bg-yellow-100 text-yellow-600">⭐</span>}
                      {p.isNewArrival&&<span className="badge bg-green-100 text-green-600">✨</span>}
                      {p.isBestSeller&&<span className="badge bg-purple-100 text-purple-600">🏆</span>}
                    </div>
                  </td>
                  <td className="td">
                    <button onClick={() => toggle(p._id, p.isActive)} className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${p.isActive?'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700':'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="td">
                    <div className="flex gap-1">
                      <Link to={`/products/edit/${p._id}`} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Pencil size={15}/></Link>
                      <button onClick={() => del(p._id, p.name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && products.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Package size={48} className="mx-auto mb-3 opacity-30"/>
              <p className="font-medium">No products yet</p>
              <Link to="/products/add" className="btn-primary mt-4">Add First Product</Link>
            </div>
          )}
        </div>
        {total > 20 && (
          <div className="p-4 border-t flex justify-center gap-2">
            {Array(Math.min(Math.ceil(total/20),7)).fill(0).map((_,i) => (
              <button key={i} onClick={() => setPage(i+1)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page===i+1?'bg-primary text-white':'hover:bg-gray-100'}`}>{i+1}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductsPage
