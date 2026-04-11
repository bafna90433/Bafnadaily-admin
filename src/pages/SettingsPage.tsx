import React, { useEffect, useState } from 'react'
import { Settings, Upload, Globe, CreditCard, Truck, Users, Eye, EyeOff, ToggleLeft, ToggleRight, Save, RefreshCw, Loader2 } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

type TabKey = 'general' | 'homepage' | 'payments' | 'shipping' | 'b2b' | 'advanced'

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'general', label: 'General', icon: Globe },
  { key: 'homepage', label: 'Homepage', icon: Eye },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'shipping', label: 'Shipping', icon: Truck },
  { key: 'b2b', label: 'B2B / MOQ', icon: Users },
  { key: 'advanced', label: 'Advanced', icon: Settings },
]

const SECTION_LABELS: Record<string, string> = {
  heroBanner: '🏠 Hero Banner (Main)',
  categories: '🗂️ Categories Grid',
  featuresBar: '✨ Features Bar (Delivery / Pay / etc)',
  trendingProducts: '🔥 Trending Products Section',
  newArrivals: '✨ New Arrivals Section',
  featuredProducts: '⭐ Featured Products Section',
  promoBanners: '🎯 Promo Banners Container',
  underPriceBanner: '💸 Under ₹199 Banner',
  giftComboBanner: '🎁 Gift Combos Banner',
}

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label?: string }> = ({ checked, onChange, label }) => (
  <div className="flex items-center gap-3">
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-primary' : 'bg-gray-200'}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-7' : 'translate-x-1'}`}/>
    </button>
    {label && <span className="text-sm font-medium">{label}</span>}
  </div>
)

const SettingsPage: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('general')
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showRzSecret, setShowRzSecret] = useState(false)
  const [showSRPwd, setShowSRPwd] = useState(false)
  const [srAuthing, setSrAuthing] = useState(false)

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data.settings)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const set = (path: string, value: any) => {
    setSettings((prev: any) => {
      const parts = path.split('.')
      const next = { ...prev }
      let obj = next
      for (let i = 0; i < parts.length - 1; i++) {
        obj[parts[i]] = { ...obj[parts[i]] }
        obj = obj[parts[i]]
      }
      obj[parts[parts.length - 1]] = value
      return next
    })
  }

  const save = async () => {
    setSaving(true)
    try {
      await api.put('/settings', settings)
      toast.success('Settings saved! ✅')
    } catch { toast.error('Save failed') } finally { setSaving(false) }
  }

  const uploadLogo = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('logo', file)
      const res = await api.post('/settings/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setSettings((s: any) => ({ ...s, siteLogo: res.data.url }))
      toast.success('Logo updated! 🎨')
    } catch { toast.error('Upload failed') } finally { setUploading(false) }
  }

  const shiprocketAuth = async () => {
    setSrAuthing(true)
    try {
      await api.post('/settings/shiprocket/auth')
      toast.success('Shiprocket authenticated!')
    } catch (err: any) { toast.error(err.response?.data?.message || 'Auth failed') } finally { setSrAuthing(false) }
  }

  if (loading) return (
    <div className="space-y-4">{Array(4).fill(0).map((_,i) => <div key={i} className="h-16 skeleton rounded-xl"/>)}</div>
  )
  if (!settings) return <div className="text-gray-400 text-center py-20">Failed to load settings</div>

  const inp = (path: string, type = 'text', placeholder = '') => (
    <input type={type} value={path.split('.').reduce((o, k) => o?.[k], settings) ?? ''} placeholder={placeholder}
      onChange={e => set(path, type === 'number' ? Number(e.target.value) : e.target.value)} className="input"/>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Site Settings</h1><p className="text-gray-500 text-sm">Full control over your store</p></div>
        <button onClick={save} disabled={saving} className="btn-primary"><Save size={16}/>{saving ? 'Saving…' : 'Save All Changes'}</button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <aside className="w-48 flex-shrink-0">
          <div className="card p-2 space-y-1 sticky top-24">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${tab === key ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                <Icon size={16}/> {label}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 space-y-5">

          {/* ── GENERAL ── */}
          {tab === 'general' && (
            <>
              <div className="card p-6 space-y-5">
                <h3 className="font-bold text-lg border-b pb-3">Site Identity</h3>

                {/* Logo */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Site Logo</label>
                  <div className="flex items-center gap-5">
                    <div className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden bg-gray-50">
                      {settings.siteLogo
                        ? <img src={settings.siteLogo} alt="Logo" className="w-full h-full object-contain p-2"/>
                        : <span className="text-3xl font-black text-primary">R</span>
                      }
                    </div>
                    <div>
                      <label className={`flex items-center gap-2 btn btn-secondary cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
                        {uploading ? <Loader2 size={15} className="animate-spin"/> : <Upload size={15}/>}
                        {uploading ? 'Uploading…' : 'Upload Logo'}
                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadLogo(e.target.files[0])} disabled={uploading}/>
                      </label>
                      <p className="text-xs text-gray-400 mt-1.5">PNG / SVG recommended. Uploaded to ImageKit.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Site Name</label>{inp('siteName', 'text', 'Reteiler')}</div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Tagline</label>{inp('siteTagline', 'text', 'Gifts & Accessories')}</div>
                  <div className="col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Announcement / Promo Bar Text</label>{inp('promoText', 'text', '🚚 Free Delivery on orders above ₹499 | COD Available 🎁')}</div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Support Email</label>{inp('supportEmail', 'email')}</div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Support Phone</label>{inp('supportPhone', 'tel')}</div>
                </div>
              </div>

              <div className="card p-6 space-y-4">
                <h3 className="font-bold text-lg border-b pb-3">WhatsApp Floating Button</h3>
                <div className="flex items-center justify-between">
                  <div><p className="font-semibold">Enable WhatsApp Button</p><p className="text-xs text-gray-400">Show floating WhatsApp chat button on frontend</p></div>
                  <Toggle checked={settings.whatsappEnabled} onChange={v => set('whatsappEnabled', v)}/>
                </div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">WhatsApp Number (without +91)</label>{inp('whatsappNumber', 'tel', '7550350036')}</div>
                {settings.whatsappEnabled && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
                    ✅ Button live at: wa.me/91{settings.whatsappNumber}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── HOMEPAGE SECTIONS ── */}
          {tab === 'homepage' && (
            <div className="card p-6">
              <h3 className="font-bold text-lg border-b pb-3 mb-5">Homepage Section Controls</h3>
              <p className="text-sm text-gray-500 mb-5 bg-blue-50 border border-blue-200 rounded-xl p-3">
                🎛️ Toggle each section on/off. Changes apply instantly on the frontend after saving.
              </p>
              <div className="space-y-3">
                {Object.entries(SECTION_LABELS).map(([key, label]) => (
                  <div key={key} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${settings.homepageSections?.[key] !== false ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div>
                      <p className="font-semibold text-sm">{label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Section key: <code className="bg-gray-200 px-1 rounded text-xs">{key}</code></p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge ${settings.homepageSections?.[key] !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {settings.homepageSections?.[key] !== false ? 'VISIBLE' : 'HIDDEN'}
                      </span>
                      <Toggle checked={settings.homepageSections?.[key] !== false} onChange={v => set(`homepageSections.${key}`, v)}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PAYMENTS ── */}
          {tab === 'payments' && (
            <>
              {/* COD */}
              <div className="card p-6 space-y-4">
                <h3 className="font-bold text-lg border-b pb-3">Cash on Delivery (COD)</h3>
                <div className="flex items-center justify-between">
                  <div><p className="font-semibold">Enable COD</p><p className="text-xs text-gray-400">Allow Cash on Delivery for all customers</p></div>
                  <Toggle checked={settings.codEnabled} onChange={v => set('codEnabled', v)}/>
                </div>
                {settings.codEnabled && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Advance % (COD booking)</label>
                      {inp('codAdvancePercent', 'number', '30')}
                      <p className="text-xs text-gray-400 mt-1">Customer pays this % online, rest on delivery (0 = full COD)</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">COD Flat Charge (₹)</label>
                      {inp('codFlatCharge', 'number', '0')}
                      <p className="text-xs text-gray-400 mt-1">Extra charge for COD orders (0 = no charge)</p>
                    </div>
                  </div>
                )}
                {settings.codEnabled && settings.codAdvancePercent > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                    📋 Current policy: Customer pays <strong>{settings.codAdvancePercent}%</strong> advance online + <strong>{100 - settings.codAdvancePercent}%</strong> on delivery
                    {settings.codFlatCharge > 0 && <> + ₹{settings.codFlatCharge} COD charge</>}
                  </div>
                )}
              </div>

              {/* UPI */}
              <div className="card p-6 space-y-4">
                <h3 className="font-bold text-lg border-b pb-3">UPI Payment</h3>
                <div className="flex items-center justify-between">
                  <div><p className="font-semibold">Enable UPI</p></div>
                  <Toggle checked={settings.upiEnabled} onChange={v => set('upiEnabled', v)}/>
                </div>
                {settings.upiEnabled && (
                  <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Your UPI ID</label>{inp('upiId', 'text', 'yourname@upi')}</div>
                )}
              </div>

              {/* Razorpay */}
              <div className="card p-6 space-y-4">
                <h3 className="font-bold text-lg border-b pb-3 flex items-center gap-2">
                  <img src="https://razorpay.com/favicon.png" className="w-5 h-5" alt="" onError={e => (e.target as any).style.display='none'}/> Razorpay Integration
                </h3>
                <div className="flex items-center justify-between">
                  <div><p className="font-semibold">Enable Razorpay</p><p className="text-xs text-gray-400">Online card / netbanking / wallet payments</p></div>
                  <Toggle checked={settings.razorpay?.enabled} onChange={v => set('razorpay.enabled', v)}/>
                </div>
                {settings.razorpay?.enabled && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Mode</label>
                      <select value={settings.razorpay?.mode||'test'} onChange={e => set('razorpay.mode', e.target.value)} className="input">
                        <option value="test">Test Mode</option>
                        <option value="live">Live Mode</option>
                      </select>
                    </div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Key ID</label>{inp('razorpay.keyId','text','rzp_test_...')}</div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Key Secret</label>
                      <div className="relative">
                        <input type={showRzSecret ? 'text' : 'password'} value={settings.razorpay?.keySecret||''} onChange={e => set('razorpay.keySecret', e.target.value)} className="input pr-10" placeholder="Key Secret"/>
                        <button type="button" onClick={() => setShowRzSecret(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showRzSecret ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                      </div>
                    </div>
                    {settings.razorpay?.mode === 'live' && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">⚠️ You are in LIVE mode. Real money transactions will happen.</div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {/* ── SHIPPING ── */}
          {tab === 'shipping' && (
            <>
              <div className="card p-6 space-y-4">
                <h3 className="font-bold text-lg border-b pb-3">Shipping Charges</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Free Shipping Above (₹)</label>{inp('freeShippingAbove','number','499')}</div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Standard Charge (₹)</label>{inp('standardShippingCharge','number','49')}</div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Gift Wrap Charge (₹)</label>{inp('giftWrapCharge','number','29')}</div>
                </div>
              </div>

              <div className="card p-6 space-y-4">
                <h3 className="font-bold text-lg border-b pb-3 flex items-center gap-2">
                  🚚 Shiprocket Integration
                </h3>
                <div className="flex items-center justify-between">
                  <div><p className="font-semibold">Enable Shiprocket</p><p className="text-xs text-gray-400">Automated shipping label generation</p></div>
                  <Toggle checked={settings.shiprocket?.enabled} onChange={v => set('shiprocket.enabled', v)}/>
                </div>
                {settings.shiprocket?.enabled && (
                  <>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Shiprocket Email</label>{inp('shiprocket.email','email')}</div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Shiprocket Password</label>
                      <div className="relative">
                        <input type={showSRPwd ? 'text' : 'password'} value={settings.shiprocket?.password||''} onChange={e => set('shiprocket.password', e.target.value)} className="input pr-10"/>
                        <button type="button" onClick={() => setShowSRPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showSRPwd ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                      </div>
                    </div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Channel ID</label>{inp('shiprocket.channelId','text')}</div>
                    <div className="flex gap-3">
                      <button onClick={shiprocketAuth} disabled={srAuthing} className="btn-primary">
                        {srAuthing ? <><Loader2 size={15} className="animate-spin"/> Authenticating…</> : <><RefreshCw size={15}/> Authenticate Shiprocket</>}
                      </button>
                      {settings.shiprocket?.token && (
                        <div className="flex items-center gap-2 text-green-600 text-sm font-semibold"><span className="w-2 h-2 bg-green-500 rounded-full inline-block animate-pulse"/> Token Active</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* ── B2B / MOQ ── */}
          {tab === 'b2b' && (
            <div className="card p-6 space-y-5">
              <h3 className="font-bold text-lg border-b pb-3">B2B / Wholesale Settings</h3>
              <div className="flex items-center justify-between">
                <div><p className="font-semibold">Enable B2B Features</p><p className="text-xs text-gray-400">MOQ policy, wholesale customer types, B2B pricing</p></div>
                <Toggle checked={settings.b2bEnabled} onChange={v => set('b2bEnabled', v)}/>
              </div>
              {settings.b2bEnabled && (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">
                    <p className="font-bold">📦 MOQ Policy (Minimum Order Quantity)</p>
                    <p>• Products under ₹{settings.moqPolicy?.belowPrice}: Minimum <strong>{settings.moqPolicy?.belowPriceQty} pieces</strong></p>
                    <p>• Products ₹{settings.moqPolicy?.belowPrice}+: Minimum <strong>{settings.moqPolicy?.abovePriceQty} pieces</strong></p>
                    <p className="text-xs text-amber-600 mt-1">Box/Carton items follow their own pack quantity.</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Price Threshold (₹)</label>
                      {inp('moqPolicy.belowPrice','number','60')}
                      <p className="text-xs text-gray-400 mt-1">Split point between low/high MOQ</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">MOQ (below threshold)</label>
                      {inp('moqPolicy.belowPriceQty','number','3')}
                      <p className="text-xs text-gray-400 mt-1">Min qty for items under ₹{settings.moqPolicy?.belowPrice}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">MOQ (above threshold)</label>
                      {inp('moqPolicy.abovePriceQty','number','2')}
                      <p className="text-xs text-gray-400 mt-1">Min qty for items ₹{settings.moqPolicy?.belowPrice}+</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── ADVANCED ── */}
          {tab === 'advanced' && (
            <div className="card p-6 space-y-5">
              <h3 className="font-bold text-lg border-b pb-3 text-red-600">⚠️ Advanced Settings</h3>

              {/* Haptic Feedback */}
              <div className="p-5 rounded-2xl border-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-base">📳 Haptic Feedback (App Vibration)</p>
                    <p className="text-xs text-gray-500 mt-0.5">Vibrate phone on button taps in customer app</p>
                  </div>
                  <Toggle checked={settings.hapticFeedback !== false} onChange={v => set('hapticFeedback', v)}/>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border-2 transition-colors ${settings.maintenanceMode ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-base">🚧 Maintenance Mode</p>
                    <p className="text-xs text-gray-500 mt-0.5">Hides the store for customers. Admin access still works.</p>
                  </div>
                  <Toggle checked={settings.maintenanceMode} onChange={v => set('maintenanceMode', v)}/>
                </div>
                {settings.maintenanceMode && (
                  <div className="mt-4">
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Maintenance Message</label>
                    <input value={settings.maintenanceMessage||''} onChange={e => set('maintenanceMessage', e.target.value)} className="input" placeholder="We are upgrading. Back soon!"/>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Save button */}
          <button onClick={save} disabled={saving} className="btn-primary w-full py-3.5 text-base justify-center">
            <Save size={18}/> {saving ? 'Saving All Settings…' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
