import React, { useState, useEffect } from 'react'
import { Smartphone, Check, Loader2, LayoutGrid, AlignJustify, BookOpen } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const LAYOUTS = [
  {
    id: 1,
    name: 'Classic',
    icon: AlignJustify,
    tagline: 'Clean & Familiar',
    description: 'Horizontal product rows with banner slider. Best for browsing.',
    accent: '#8B5CF6',
    preview: (
      <div className="w-full h-full bg-white flex flex-col gap-1.5 p-2 overflow-hidden">
        {/* header */}
        <div className="flex justify-between items-center mb-1">
          <div className="w-16 h-3 bg-purple-400 rounded-full" />
          <div className="flex gap-1"><div className="w-4 h-4 bg-gray-200 rounded" /><div className="w-4 h-4 bg-gray-200 rounded" /></div>
        </div>
        {/* search */}
        <div className="w-full h-5 bg-gray-100 rounded-lg flex items-center px-2 gap-1">
          <div className="w-2 h-2 bg-gray-300 rounded-full" /><div className="w-20 h-1.5 bg-gray-200 rounded" />
        </div>
        {/* banner */}
        <div className="w-full h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl flex items-end p-2">
          <div className="space-y-1"><div className="w-16 h-2 bg-white/80 rounded" /><div className="w-10 h-1.5 bg-white/60 rounded" /><div className="w-12 h-3 bg-white rounded-full" /></div>
        </div>
        {/* features */}
        <div className="flex gap-1.5">
          {['#10B981','#3B82F6','#8B5CF6','#F59E0B'].map(c => (
            <div key={c} className="flex-1 h-8 rounded-lg flex flex-col items-center justify-center gap-0.5" style={{backgroundColor: c+'22', border: `1px solid ${c}44`}}>
              <div className="w-2.5 h-2.5 rounded-sm" style={{backgroundColor: c+'88'}} />
              <div className="w-6 h-1 rounded" style={{backgroundColor: c+'66'}} />
            </div>
          ))}
        </div>
        {/* categories */}
        <div className="flex gap-1.5 overflow-hidden">
          {[0,1,2,3].map(i => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className="w-9 h-9 rounded-xl" style={{backgroundColor: ['#FCE4EC','#E3F2FD','#F3E5F5','#E8F5E9'][i]}} />
              <div className="w-8 h-1.5 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        {/* product row label */}
        <div className="flex items-center gap-1.5">
          <div className="w-14 h-4 rounded-xl bg-red-100 flex items-center justify-center px-1">
            <div className="w-8 h-1.5 bg-red-300 rounded" />
          </div>
        </div>
        {/* product row */}
        <div className="flex gap-1.5 overflow-hidden">
          {[0,1,2].map(i => (
            <div key={i} className="w-20 shrink-0">
              <div className="w-20 h-14 bg-gray-100 rounded-xl mb-1" />
              <div className="w-14 h-1.5 bg-gray-200 rounded mb-1" />
              <div className="w-10 h-2 bg-purple-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 2,
    name: 'Grid',
    icon: LayoutGrid,
    tagline: 'Modern & Structured',
    description: 'Gradient header, category pills, 2-column product grid. Great for browsing many items.',
    accent: '#E91E63',
    preview: (
      <div className="w-full h-full bg-white flex flex-col overflow-hidden">
        {/* gradient header */}
        <div className="bg-gradient-to-br from-pink-500 to-purple-500 px-3 pt-2 pb-4 rounded-b-2xl mb-1.5">
          <div className="flex justify-between items-center mb-1">
            <div className="w-16 h-3 bg-white/80 rounded-full" />
            <div className="flex gap-1"><div className="w-4 h-4 bg-white/40 rounded" /><div className="w-4 h-4 bg-white/40 rounded" /></div>
          </div>
          <div className="w-full h-5 bg-white rounded-lg flex items-center px-2 gap-1">
            <div className="w-2 h-2 bg-gray-300 rounded-full" /><div className="w-20 h-1.5 bg-gray-200 rounded" />
          </div>
        </div>
        {/* banner */}
        <div className="mx-2 h-12 bg-gradient-to-r from-pink-300 to-orange-300 rounded-xl mb-2" />
        {/* category pills */}
        <div className="flex gap-1.5 px-2 mb-2 overflow-hidden">
          {['#FCE4EC','#E3F2FD','#F3E5F5','#E8F5E9'].map((bg, i) => (
            <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-full text-xs shrink-0" style={{backgroundColor: bg}}>
              <div className="w-3 h-3 rounded-sm bg-gray-300" />
              <div className="w-8 h-1.5 bg-gray-400/60 rounded" />
            </div>
          ))}
        </div>
        {/* section label with left border */}
        <div className="border-l-4 border-pink-500 pl-2 mx-2 mb-1.5">
          <div className="w-16 h-2 bg-gray-700 rounded" />
        </div>
        {/* 2-col grid */}
        <div className="grid grid-cols-2 gap-1.5 px-2 flex-1">
          {[0,1,2,3].map(i => (
            <div key={i} className="bg-gray-50 rounded-xl p-1.5">
              <div className="w-full h-12 bg-gray-200 rounded-lg mb-1" />
              <div className="w-3/4 h-1.5 bg-gray-300 rounded mb-1" />
              <div className="flex justify-between items-center">
                <div className="w-8 h-2.5 bg-pink-200 rounded" />
                <div className="w-5 h-5 bg-pink-500 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 3,
    name: 'Magazine',
    icon: BookOpen,
    tagline: 'Editorial & Bold',
    description: 'Full hero banner with search overlay, category image grid, featured big cards.',
    accent: '#0EA5E9',
    preview: (
      <div className="w-full h-full bg-white flex flex-col overflow-hidden">
        {/* header */}
        <div className="flex justify-between items-center px-2 pt-2 mb-1">
          <div className="w-16 h-3 bg-sky-400 rounded-full" />
          <div className="flex gap-1"><div className="w-4 h-4 bg-gray-200 rounded" /><div className="w-4 h-4 bg-gray-200 rounded" /></div>
        </div>
        {/* big hero */}
        <div className="mx-0 relative mb-1.5" style={{height: 80}}>
          <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-600 rounded-b-xl" />
          {/* search overlay */}
          <div className="absolute bottom-1.5 left-2 right-2 h-5 bg-white/95 rounded-lg flex items-center px-2 gap-1">
            <div className="w-2 h-2 bg-gray-300 rounded-full" /><div className="w-16 h-1.5 bg-gray-200 rounded" />
          </div>
        </div>
        {/* feature icons row */}
        <div className="flex gap-1.5 px-2 mb-1.5">
          {['#10B981','#3B82F6','#8B5CF6','#F59E0B'].map(c => (
            <div key={c} className="flex-1 h-8 rounded-xl flex flex-col items-center justify-center gap-0.5" style={{backgroundColor: c+'18'}}>
              <div className="w-3 h-3 rounded" style={{backgroundColor: c+'88'}} />
              <div className="w-5 h-1 rounded" style={{backgroundColor: c+'66'}} />
            </div>
          ))}
        </div>
        {/* category grid 3-col */}
        <div className="grid grid-cols-3 gap-1 px-2 mb-1.5">
          {[['#FCE4EC',''],['#E3F2FD',''],['#F3E5F5',''],['#E8F5E9',''],['#FFF8E1',''],['#FCE4EC','']].map(([bg], i) => (
            <div key={i} className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 p-1" style={{backgroundColor: bg}}>
              <div className="w-6 h-6 bg-gray-300 rounded-lg" />
              <div className="w-8 h-1 bg-gray-400/60 rounded" />
            </div>
          ))}
        </div>
        {/* section header with border */}
        <div className="flex items-center gap-1 px-2 pb-1 border-b-2 border-sky-400 mx-2 mb-1">
          <div className="text-xs">🔥</div>
          <div className="w-14 h-2 bg-sky-400 rounded" />
        </div>
        {/* full-width featured card */}
        <div className="mx-2 h-10 bg-gradient-to-r from-sky-300 to-blue-400 rounded-xl mb-1 flex items-end p-1.5">
          <div className="space-y-0.5"><div className="w-16 h-1.5 bg-white/80 rounded" /><div className="w-8 h-2 bg-white rounded" /></div>
        </div>
        {/* 2-col small */}
        <div className="grid grid-cols-2 gap-1 px-2">
          {[0,1].map(i => (
            <div key={i} className="bg-gray-50 rounded-xl p-1">
              <div className="w-full h-8 bg-gray-200 rounded-lg mb-0.5" />
              <div className="w-3/4 h-1 bg-gray-300 rounded" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

const MobileLayoutPage: React.FC = () => {
  const [activeLayout, setActiveLayout] = useState<number>(1)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/settings').then(r => {
      setActiveLayout(r.data.settings?.homeLayout || 1)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const applyLayout = async (id: number) => {
    if (id === activeLayout) return
    setSaving(true)
    try {
      await api.put('/settings', { homeLayout: id })
      setActiveLayout(id)
      toast.success(`Layout ${id} applied!`)
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
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Smartphone size={22} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Mobile App Layout</h1>
          <p className="text-gray-500 text-sm">Choose the homepage design for your customer app</p>
        </div>
        {saving && <Loader2 size={18} className="animate-spin text-primary ml-auto" />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {LAYOUTS.map(layout => {
          const isActive = activeLayout === layout.id
          const Icon = layout.icon
          return (
            <div
              key={layout.id}
              onClick={() => applyLayout(layout.id)}
              className={`relative cursor-pointer rounded-3xl border-2 transition-all duration-200 overflow-hidden group
                ${isActive
                  ? 'border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md hover:scale-[1.01]'}`}
            >
              {/* Active badge */}
              {isActive && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
                  <Check size={12} />
                  Active
                </div>
              )}

              {/* Phone mockup */}
              <div className="bg-gray-50 p-5 flex justify-center">
                <div className="relative" style={{ width: 180, height: 320 }}>
                  {/* Phone frame */}
                  <div className="absolute inset-0 rounded-[28px] border-[6px] border-gray-800 shadow-2xl bg-white overflow-hidden z-10 pointer-events-none">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-800 rounded-b-2xl z-20" />
                  </div>
                  {/* Screen content */}
                  <div className="absolute inset-[6px] rounded-[22px] overflow-hidden bg-white" style={{ top: 20 }}>
                    {layout.preview}
                  </div>
                  {/* Home indicator */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-700 rounded-full z-20" />
                </div>
              </div>

              {/* Info */}
              <div className={`p-5 border-t ${isActive ? 'bg-primary/5 border-primary/20' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: layout.accent + '18' }}>
                    <Icon size={18} style={{ color: layout.accent }} />
                  </div>
                  <div>
                    <p className="font-black text-gray-900 text-base">Layout {layout.id}</p>
                    <p className="text-xs font-bold" style={{ color: layout.accent }}>{layout.name} — {layout.tagline}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{layout.description}</p>

                <button
                  onClick={e => { e.stopPropagation(); applyLayout(layout.id) }}
                  disabled={isActive || saving}
                  className={`mt-4 w-full py-2.5 rounded-xl text-sm font-bold transition-all
                    ${isActive
                      ? 'bg-primary text-white cursor-default'
                      : 'bg-gray-100 text-gray-700 hover:bg-primary hover:text-white'}`}
                >
                  {isActive ? '✓ Currently Active' : 'Apply Layout'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-5 flex gap-3">
        <Smartphone size={20} className="text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-800 mb-1">Live Update</p>
          <p className="text-xs text-blue-600 leading-relaxed">Changes apply immediately. Customers will see the new layout next time they open the app (or pull-to-refresh on the home screen).</p>
        </div>
      </div>
    </div>
  )
}

export default MobileLayoutPage
