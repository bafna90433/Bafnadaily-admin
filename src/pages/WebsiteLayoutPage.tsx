import React, { useState, useEffect } from 'react'
import { Monitor, Check, Loader2, Layers, Sparkles, Crown, Heart } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

// ── Mini browser chrome wrapper ───────────────────────────────────────────────
const BrowserFrame: React.FC<{ children: React.ReactNode; accent: string }> = ({ children, accent }) => (
  <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200">
    {/* Browser chrome */}
    <div className="bg-gray-100 border-b border-gray-200 px-3 py-2 flex items-center gap-2">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400"/>
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"/>
        <div className="w-2.5 h-2.5 rounded-full bg-green-400"/>
      </div>
      <div className="flex-1 bg-white rounded-md px-3 py-1 text-[10px] text-gray-400 font-medium mx-2">
        bafnadaily.com
      </div>
    </div>
    {/* Page content */}
    <div className="bg-white overflow-hidden" style={{ height: 260 }}>
      {children}
    </div>
  </div>
)

// ── Layout Preview 1: Classic Split ──────────────────────────────────────────
const Preview1 = () => (
  <div className="w-full h-full flex flex-col">
    {/* Promo bar */}
    <div className="h-5 bg-pink-500 flex items-center justify-center">
      <div className="w-48 h-1.5 bg-white/60 rounded"/>
    </div>
    {/* Navbar */}
    <div className="h-10 bg-white border-b border-gray-100 flex items-center px-3 gap-3">
      <div className="w-5 h-5 bg-pink-500 rounded-lg"/>
      <div className="w-20 h-2.5 bg-gray-800 rounded"/>
      <div className="flex-1 h-6 bg-gray-100 rounded-lg mx-2 flex items-center px-2 gap-1">
        <div className="w-2 h-2 bg-gray-300 rounded-full"/>
        <div className="w-20 h-1.5 bg-gray-200 rounded"/>
      </div>
      <div className="flex gap-2">
        <div className="w-5 h-5 bg-gray-100 rounded"/>
        <div className="w-5 h-5 bg-pink-500 rounded"/>
      </div>
    </div>
    {/* Hero: split layout */}
    <div className="flex-1 bg-gradient-to-br from-pink-50 to-purple-50 flex px-4 py-3 gap-4 overflow-hidden">
      <div className="flex-1 flex flex-col justify-center gap-2">
        <div className="w-24 h-3 bg-pink-200 rounded-full"/>
        <div className="space-y-1.5">
          <div className="w-36 h-4 bg-gray-800 rounded"/>
          <div className="w-28 h-4 bg-pink-500 rounded"/>
        </div>
        <div className="w-32 h-2 bg-gray-400 rounded mt-1"/>
        <div className="flex gap-2 mt-1">
          <div className="w-16 h-6 bg-pink-500 rounded-xl"/>
          <div className="w-16 h-6 border border-pink-500 rounded-xl"/>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5 w-28">
        {['#FCE4EC','#F3E5F5','#E8F5E9','#FFF3E0'].map((bg,i) => (
          <div key={i} className="rounded-xl flex flex-col items-center justify-center p-2 border" style={{backgroundColor:bg, borderColor:bg}}>
            <div className="text-sm mb-0.5">{['🔑','👗','🎁','💄'][i]}</div>
            <div className="w-8 h-1.5 bg-gray-400/60 rounded"/>
          </div>
        ))}
      </div>
    </div>
    {/* Features strip */}
    <div className="h-10 border-t border-gray-100 flex items-center px-3 gap-2">
      {['#E91E63','#9C27B0','#FF9800','#E91E63'].map((c,i) => (
        <div key={i} className="flex items-center gap-1 flex-1">
          <div className="w-5 h-5 rounded-lg flex-shrink-0" style={{backgroundColor:c+'20'}}/>
          <div className="flex flex-col gap-0.5">
            <div className="w-10 h-1.5 bg-gray-700 rounded"/>
            <div className="w-8 h-1 bg-gray-300 rounded"/>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// ── Layout Preview 2: Dark Premium Hero ──────────────────────────────────────
const Preview2 = () => (
  <div className="w-full h-full flex flex-col">
    <div className="h-5 bg-pink-500 flex items-center justify-center">
      <div className="w-48 h-1.5 bg-white/60 rounded"/>
    </div>
    <div className="h-10 bg-white border-b border-gray-100 flex items-center px-3 gap-3">
      <div className="w-5 h-5 bg-pink-500 rounded-lg"/>
      <div className="w-20 h-2.5 bg-gray-800 rounded"/>
      <div className="flex-1 h-6 bg-gray-100 rounded-lg mx-2"/>
      <div className="flex gap-2">
        <div className="w-5 h-5 bg-gray-100 rounded"/>
        <div className="w-5 h-5 bg-pink-500 rounded"/>
      </div>
    </div>
    {/* Dark hero */}
    <div className="flex-1 bg-gray-900 flex flex-col items-center justify-center gap-2 px-4 py-3">
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-3 h-3 bg-amber-400 rounded"/>
        <div className="w-24 h-2 bg-amber-400/80 rounded"/>
        <div className="w-3 h-3 bg-amber-400 rounded"/>
      </div>
      <div className="text-center space-y-1.5">
        <div className="w-40 h-5 bg-white rounded mx-auto"/>
        <div className="w-32 h-5 rounded mx-auto" style={{background:'linear-gradient(90deg,#E91E63,#C77DFF)'}}/>
      </div>
      <div className="w-48 h-2 bg-gray-600 rounded"/>
      <div className="flex gap-2 mt-1">
        <div className="w-20 h-6 bg-pink-500 rounded-2xl"/>
        <div className="w-20 h-6 bg-white/10 border border-white/20 rounded-2xl"/>
      </div>
      <div className="grid grid-cols-4 gap-1.5 w-full mt-2">
        {['🔑','💍','🎁','🔥'].map((e,i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl py-2 flex flex-col items-center gap-0.5">
            <div className="text-xs">{e}</div>
            <div className="w-6 h-1.5 bg-white/50 rounded"/>
            <div className="w-4 h-1 bg-gray-500 rounded"/>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// ── Layout Preview 3: Minimalist Elegant ─────────────────────────────────────
const Preview3 = () => (
  <div className="w-full h-full flex flex-col">
    <div className="h-5 bg-pink-500 flex items-center justify-center">
      <div className="w-48 h-1.5 bg-white/60 rounded"/>
    </div>
    <div className="h-10 bg-white border-b border-gray-100 flex items-center px-3 gap-3">
      <div className="w-5 h-5 bg-pink-500 rounded-lg"/>
      <div className="w-20 h-2.5 bg-gray-800 rounded"/>
      <div className="flex-1 h-6 bg-gray-100 rounded-lg mx-2"/>
      <div className="flex gap-2">
        <div className="w-5 h-5 bg-gray-100 rounded"/>
        <div className="w-5 h-5 bg-pink-500 rounded"/>
      </div>
    </div>
    {/* White minimalist hero */}
    <div className="bg-white px-4 py-4 flex flex-col items-center gap-2 border-b border-gray-50">
      <div className="w-28 h-3 bg-pink-100 rounded-full flex items-center justify-center">
        <div className="w-18 h-1.5 bg-pink-400 rounded"/>
      </div>
      <div className="text-center space-y-1">
        <div className="w-44 h-4 bg-gray-900 rounded mx-auto"/>
        <div className="w-32 h-4 bg-pink-500 rounded mx-auto"/>
      </div>
      <div className="w-40 h-2 bg-gray-200 rounded"/>
      <div className="flex gap-2">
        <div className="w-20 h-6 bg-pink-500 rounded-xl"/>
        <div className="w-20 h-6 border border-pink-500 rounded-xl"/>
      </div>
    </div>
    {/* Category pill row */}
    <div className="flex gap-2 px-3 py-2 overflow-hidden">
      {[['🔑','#FCE4EC'],['👗','#F3E5F5'],['🎁','#E8F5E9'],['💄','#FFF3E0'],['💕','#FCE4EC']].map(([e,bg],i) => (
        <div key={i} className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl border flex-shrink-0 text-xs" style={{backgroundColor:bg as string, borderColor:(bg as string).replace('EC','D0').replace('F5','E0')}}>
          <span>{e}</span>
          <div className="w-8 h-1.5 bg-gray-400/60 rounded"/>
        </div>
      ))}
    </div>
    {/* Products grid */}
    <div className="flex-1 px-3 pb-2">
      <div className="grid grid-cols-4 gap-1.5">
        {Array(8).fill(0).map((_,i) => (
          <div key={i} className="rounded-xl overflow-hidden">
            <div className="aspect-square bg-gray-100 rounded-xl"/>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// ── Layout Preview 4: Soft Pastel Boutique (Full-Width) ───────────────────────
const Preview4 = () => (
  <div className="w-full h-full flex flex-col" style={{background:'linear-gradient(135deg,#fff0f6 0%,#fdf2ff 40%,#fff8f0 100%)'}}>
    <div className="h-5 flex items-center justify-center" style={{background:'linear-gradient(90deg,#C2185B,#E91E63,#AD1457)'}}>
      <div className="w-48 h-1.5 bg-white/60 rounded"/>
    </div>
    <div className="h-10 bg-white/90 backdrop-blur border-b border-pink-100 flex items-center px-3 gap-3">
      <div className="w-5 h-5 rounded-xl" style={{background:'linear-gradient(135deg,#E91E63,#C2185B)'}}/>
      <div className="w-20 h-2.5 bg-gray-800 rounded"/>
      <div className="flex-1 h-6 rounded-xl border flex-grow mx-2" style={{background:'rgba(233,30,99,0.04)', borderColor:'rgba(233,30,99,0.15)'}}/>
      <div className="flex gap-1.5">
        <div className="w-5 h-5 bg-gray-100 rounded-lg"/>
        <div className="w-5 h-5 rounded-lg" style={{background:'linear-gradient(135deg,#E91E63,#C2185B)'}}/>
      </div>
    </div>
    {/* Hero with banner */}
    <div className="mx-3 mt-2 rounded-2xl overflow-hidden flex-shrink-0" style={{height:70, background:'linear-gradient(135deg,#E91E63,#FF6B9D,#C77DFF)'}}>
      <div className="w-full h-full flex items-end p-2">
        <div className="space-y-1">
          <div className="w-28 h-2 bg-white/80 rounded"/>
          <div className="w-20 h-2.5 bg-white rounded"/>
          <div className="w-16 h-4 bg-white rounded-full flex items-center justify-center">
            <div className="w-10 h-1.5 bg-pink-500 rounded"/>
          </div>
        </div>
      </div>
    </div>
    {/* Features bar */}
    <div className="mx-3 mt-2 grid grid-cols-4 gap-1">
      {['#E91E63','#9C27B0','#FF9800','#E91E63'].map((c,i) => (
        <div key={i} className="flex items-center gap-1 bg-white rounded-xl px-2 py-1.5" style={{boxShadow:`0 1px 4px ${c}15`}}>
          <div className="w-4 h-4 rounded-lg flex-shrink-0" style={{background:c+'15'}}/>
          <div className="flex flex-col gap-0.5">
            <div className="w-8 h-1.5 bg-gray-700 rounded"/>
            <div className="w-6 h-1 bg-gray-300 rounded"/>
          </div>
        </div>
      ))}
    </div>
    {/* Products 5-col */}
    <div className="flex-1 mx-3 mt-2 overflow-hidden">
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <div className="w-24 h-2.5 bg-gray-800 rounded mb-1"/>
          <div className="w-10 h-1 rounded-full" style={{background:'linear-gradient(90deg,#E91E63,#C77DFF)'}}/>
        </div>
        <div className="w-12 h-4 bg-pink-100 rounded-full"/>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {Array(10).fill(0).map((_,i) => (
          <div key={i} className="rounded-xl overflow-hidden">
            <div className="aspect-square rounded-xl" style={{background: i % 3 === 0 ? '#FCE4EC' : i % 3 === 1 ? '#F3E5F5' : '#FFF0F6'}}/>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// ── Layouts config ────────────────────────────────────────────────────────────
const LAYOUTS = [
  {
    id: 1,
    name: 'Classic Split',
    icon: Layers,
    tagline: 'Bright & Welcoming',
    description: 'Clean white navbar, pink-purple hero with category cards on the right. Best for welcoming new visitors.',
    accent: '#E91E63',
    preview: <Preview1 />,
  },
  {
    id: 2,
    name: 'Dark Premium',
    icon: Crown,
    tagline: 'Bold & Luxurious',
    description: 'Dark charcoal hero with gold crown elements and glowing product stats. Great for premium feel.',
    accent: '#F59E0B',
    preview: <Preview2 />,
  },
  {
    id: 3,
    name: 'Minimalist',
    icon: Sparkles,
    tagline: 'Clean & Elegant',
    description: 'White background with subtle accents. Category pills scroll + compact product grid. Very clean.',
    accent: '#8B5CF6',
    preview: <Preview3 />,
  },
  {
    id: 4,
    name: 'Boutique',
    icon: Heart,
    tagline: 'Cute & Pastel 💕',
    description: 'Soft pink-purple gradient, full-width banner slider, 5-column product grid. Perfect for keychains & women\'s fashion!',
    accent: '#EC4899',
    preview: <Preview4 />,
  },
]

// ── Main Page ─────────────────────────────────────────────────────────────────
const WebsiteLayoutPage: React.FC = () => {
  const [activeLayout, setActiveLayout] = useState<number>(1)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/settings').then(r => {
      setActiveLayout(r.data.settings?.websiteLayout || 1)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const applyLayout = async (id: number) => {
    if (id === activeLayout || saving) return
    setSaving(true)
    try {
      await api.put('/settings', { websiteLayout: id })
      setActiveLayout(id)
      toast.success(`Layout ${id} — ${LAYOUTS[id-1].name} applied! 🎨`)
    } catch {
      toast.error('Failed to apply layout')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Monitor size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Website Layout</h1>
            <p className="text-gray-500 text-sm">Choose homepage design for your website</p>
          </div>
        </div>
        {saving && (
          <div className="flex items-center gap-2 text-sm text-primary font-semibold">
            <Loader2 size={16} className="animate-spin" /> Applying...
          </div>
        )}
      </div>

      {/* Layout cards — 2×2 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {LAYOUTS.map(layout => {
          const isActive = activeLayout === layout.id
          const Icon = layout.icon
          return (
            <div
              key={layout.id}
              onClick={() => applyLayout(layout.id)}
              className={`relative cursor-pointer rounded-3xl border-2 overflow-hidden group transition-all duration-200
                ${isActive
                  ? 'border-primary shadow-xl shadow-primary/15 scale-[1.01]'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-lg hover:scale-[1.005]'
                }`}
            >
              {/* Active badge */}
              {isActive && (
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  <Check size={11} /> Active
                </div>
              )}

              {/* Browser preview */}
              <div className="p-4 bg-gray-50 border-b border-gray-100">
                <BrowserFrame accent={layout.accent}>
                  {layout.preview}
                </BrowserFrame>
              </div>

              {/* Info */}
              <div className={`p-5 ${isActive ? 'bg-primary/5' : 'bg-white'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: layout.accent + '18' }}>
                    <Icon size={18} style={{ color: layout.accent }} />
                  </div>
                  <div>
                    <p className="font-black text-gray-900">Layout {layout.id} — {layout.name}</p>
                    <p className="text-xs font-bold" style={{ color: layout.accent }}>{layout.tagline}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{layout.description}</p>
                <button
                  onClick={e => { e.stopPropagation(); applyLayout(layout.id) }}
                  disabled={isActive || saving}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all
                    ${isActive
                      ? 'bg-primary text-white cursor-default'
                      : 'bg-gray-100 text-gray-700 hover:bg-primary hover:text-white active:scale-95'}`}
                >
                  {isActive ? '✓ Currently Active' : `Apply Layout ${layout.id}`}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Info box */}
      <div className="mt-8 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-2xl p-5 flex gap-3">
        <Monitor size={20} className="text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-gray-800 mb-1">⚡ Instant Live Update</p>
          <p className="text-xs text-gray-600 leading-relaxed">
            Changes apply immediately to your website. Customers will see the new layout on their next page load or refresh.
            The <strong>Boutique (Layout 4)</strong> is specially designed for keychains & women's accessories with a soft pastel theme. 💕
          </p>
        </div>
      </div>
    </div>
  )
}

export default WebsiteLayoutPage
