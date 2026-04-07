import React, { useEffect, useState, useMemo } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Globe, Users, Eye, Monitor, Smartphone, Tablet, MapPin, TrendingUp, Clock, Activity } from 'lucide-react'
import api from '../utils/api'
import * as topojson from 'topojson-client'
import { geoMercator, geoPath } from 'd3-geo'
import indiaTopoJSON from './india-states.json'

const COLORS = ['#E91E63', '#9C27B0', '#3F51B5', '#00BCD4', '#4CAF50', '#FF9800', '#F44336', '#607D8B']
const DEVICE_ICONS: Record<string, React.ElementType> = { desktop: Monitor, mobile: Smartphone, tablet: Tablet }

const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [hoveredState, setHoveredState] = useState<string | null>(null)
  const [mapRotation, setMapRotation] = useState({ x: 15, y: -5 })

  useEffect(() => {
    setLoading(true)
    api.get(`/analytics/dashboard?days=${days}`)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [days])

  // Convert TopoJSON to GeoJSON features
  const geoFeatures = useMemo(() => {
    try {
      const topo = indiaTopoJSON as any
      const statesObj = topo.objects['states']
      if (!statesObj) return []
      const geojson = topojson.feature(topo, statesObj) as any
      return geojson.features || []
    } catch {
      return []
    }
  }, [])

  // Build projection & path generator
  const { pathGen, projection } = useMemo(() => {
    const proj = geoMercator()
      .center([83, 23])
      .scale(1000)
      .translate([300, 280])
    const gen = geoPath().projection(proj)
    return { pathGen: gen, projection: proj }
  }, [])

  // Build state visitor count map
  const stateCountMap = useMemo(() => {
    if (!data?.stateWise) return {} as Record<string, { count: number; unique: number }>
    const map: Record<string, { count: number; unique: number }> = {}
    data.stateWise.forEach((s: any) => {
      map[s._id] = { count: s.count, unique: s.unique || 0 }
    })
    return map
  }, [data])

  const maxCount = useMemo(() => {
    if (!data?.stateWise?.length) return 1
    return Math.max(...data.stateWise.map((s: any) => s.count), 1)
  }, [data])

  const getStateColor = (name: string): string => {
    const info = stateCountMap[name]
    if (!info) return '#334155'
    const intensity = info.count / maxCount
    // hsl pink gradient
    const l = 75 - intensity * 45
    const s = 55 + intensity * 35
    return `hsl(340, ${s}%, ${l}%)`
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array(4).fill(0).map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}</div>
      <div className="h-[500px] skeleton rounded-2xl" />
    </div>
  )

  const { totalVisits = 0, uniqueVisitors = 0, todayVisits = 0, stateWise = [], deviceWise = [], browserWise = [], topPages = [], dailyTrend = [], cityWise = [], recentVisitors = [] } = data || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Activity size={24} className="text-pink-500" /> Visitor Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">Real-time traffic insights & geographic distribution</p>
        </div>
        <select value={days} onChange={e => setDays(Number(e.target.value))} className="input w-40 py-2 text-sm">
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Eye, title: 'Total Page Views', value: totalVisits.toLocaleString('en-IN'), color: 'from-pink-500 to-rose-600', sub: `Last ${days} days` },
          { icon: Users, title: 'Unique Visitors', value: uniqueVisitors.toLocaleString('en-IN'), color: 'from-purple-500 to-indigo-600', sub: 'By session' },
          { icon: TrendingUp, title: "Today's Visits", value: todayVisits.toLocaleString('en-IN'), color: 'from-emerald-500 to-green-600', sub: 'Real-time' },
          { icon: MapPin, title: 'States Reached', value: stateWise.length, color: 'from-amber-500 to-orange-600', sub: 'Geographic reach' },
        ].map((stat, i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-5 group hover:shadow-lg transition-shadow">
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} rounded-bl-[2.5rem] opacity-10 group-hover:opacity-20 transition-opacity`} />
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon size={20} className="text-white" />
            </div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{stat.title}</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{stat.value}</p>
            <p className="text-[11px] text-gray-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* 3D India Map + State List */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* 3D Map */}
        <div className="lg:col-span-3 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6 relative overflow-hidden">
          {/* Background grid */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }} />

          <div className="relative z-10">
            <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
              <Globe size={20} className="text-pink-400" /> India Visitor Map
            </h3>
            <p className="text-slate-400 text-xs mb-4">Geographic distribution across states</p>

            {/* 3D Perspective Map */}
            <div className="flex justify-center" style={{ perspective: '800px', perspectiveOrigin: '50% 40%' }}>
              <div
                style={{
                  transform: `rotateX(${mapRotation.x}deg) rotateY(${mapRotation.y}deg)`,
                  transition: 'transform 0.3s ease',
                  transformStyle: 'preserve-3d',
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = ((e.clientY - rect.top) / rect.height - 0.5) * 20
                  const y = ((e.clientX - rect.left) / rect.width - 0.5) * -15
                  setMapRotation({ x: 10 + x, y: y })
                }}
                onMouseLeave={() => setMapRotation({ x: 15, y: -5 })}
              >
                <svg viewBox="0 0 600 560" className="w-full max-w-[500px]" style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))' }}>
                  <defs>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="shadow">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.3" />
                    </filter>
                  </defs>

                  {/* State Paths */}
                  {geoFeatures.map((feature: any, i: number) => {
                    const stateName = feature.properties?.st_nm || ''
                    const d = pathGen(feature) || ''
                    const isHovered = hoveredState === stateName
                    const count = stateCountMap[stateName]?.count || 0
                    const fill = getStateColor(stateName)
                    const centroid = pathGen.centroid(feature)

                    return (
                      <g key={`${stateName}-${i}`}>
                        {/* Shadow underneath for 3D depth */}
                        <path
                          d={d}
                          fill="rgba(0,0,0,0.2)"
                          transform="translate(2, 3)"
                        />
                        {/* Main state shape */}
                        <path
                          d={d}
                          fill={isHovered ? '#E91E63' : fill}
                          stroke={isHovered ? '#fff' : 'rgba(255,255,255,0.2)'}
                          strokeWidth={isHovered ? 2 : 0.5}
                          opacity={isHovered ? 1 : 0.9}
                          style={{
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            filter: isHovered ? 'url(#glow)' : 'none',
                          }}
                          onMouseEnter={() => setHoveredState(stateName)}
                          onMouseLeave={() => setHoveredState(null)}
                        />
                        {/* Pulsing dot for states with visitors */}
                        {count > 0 && centroid[0] && centroid[1] && (
                          <circle cx={centroid[0]} cy={centroid[1]} r={Math.max(2, Math.min(7, (count / maxCount) * 8))}
                            fill="#E91E63" opacity="0.85" filter="url(#glow)">
                            <animate attributeName="r" values={`${Math.max(2, (count / maxCount) * 5)};${Math.max(3, (count / maxCount) * 8)};${Math.max(2, (count / maxCount) * 5)}`} dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.85;0.35;0.85" dur="2s" repeatCount="indefinite" />
                          </circle>
                        )}
                      </g>
                    )
                  })}

                  {/* Hover tooltip */}
                  {hoveredState && (() => {
                    const feat = geoFeatures.find((f: any) => f.properties?.st_nm === hoveredState)
                    if (!feat) return null
                    const centroid = pathGen.centroid(feat)
                    if (!centroid[0] || !centroid[1]) return null
                    const count = stateCountMap[hoveredState]?.count || 0
                    const tx = centroid[0] - 55
                    const ty = centroid[1] - 42
                    return (
                      <g style={{ pointerEvents: 'none' }}>
                        <rect x={tx} y={ty} width="110" height="35" rx="8" fill="rgba(0,0,0,0.9)" />
                        <text x={tx + 55} y={ty + 14} textAnchor="middle" fill="white" fontSize="10" fontWeight="700">{hoveredState}</text>
                        <text x={tx + 55} y={ty + 27} textAnchor="middle" fill="#E91E63" fontSize="11" fontWeight="800">{count.toLocaleString('en-IN')} visits</text>
                      </g>
                    )
                  })()}
                </svg>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-600" /><span className="text-[10px] text-slate-400">No data</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-pink-300" /><span className="text-[10px] text-slate-400">Low</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-pink-500" /><span className="text-[10px] text-slate-400">Medium</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-pink-700" /><span className="text-[10px] text-slate-400">High</span></div>
            </div>
          </div>
        </div>

        {/* State-wise List */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-pink-50 to-white">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><MapPin size={16} className="text-pink-500" /> Top States</h3>
          </div>
          <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
            {stateWise.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">No visitor data yet.<br />Visitors will appear once traffic starts.</div>
            ) : stateWise.map((s: any, i: number) => (
              <div key={s._id} className="px-4 py-3 flex items-center gap-3 hover:bg-pink-50/50 transition-colors cursor-pointer"
                onMouseEnter={() => setHoveredState(s._id)}
                onMouseLeave={() => setHoveredState(null)}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">{s._id}</p>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                    <div className="bg-gradient-to-r from-pink-500 to-rose-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, (s.count / (stateWise[0]?.count || 1)) * 100)}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-gray-800">{s.count}</p>
                  <p className="text-[10px] text-gray-400">{s.unique} unique</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Trend Chart */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-pink-500" /> Daily Traffic Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={dailyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="_id" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: string) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}` }} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
            <Line type="monotone" dataKey="views" stroke="#E91E63" strokeWidth={2.5} dot={{ fill: '#E91E63', r: 3 }} activeDot={{ r: 6 }} name="Page Views" />
            <Line type="monotone" dataKey="unique" stroke="#9C27B0" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Unique Visitors" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Device, Browser, Top Pages */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Device */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Monitor size={16} className="text-pink-500" /> Devices</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={deviceWise.map((d: any) => ({ name: d._id, value: d.count }))} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={5} dataKey="value">
                {deviceWise.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => v.toLocaleString('en-IN')} contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {deviceWise.map((d: any, i: number) => {
              const Icon = DEVICE_ICONS[d._id] || Monitor
              return (
                <div key={d._id} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <Icon size={14} className="text-gray-400" />
                  <span className="capitalize flex-1">{d._id}</span>
                  <span className="font-bold">{d.count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Browser */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Globe size={16} className="text-pink-500" /> Browsers</h3>
          <div className="space-y-3">
            {browserWise.map((b: any, i: number) => (
              <div key={b._id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{b._id || 'Unknown'}</span>
                  <span className="font-bold text-gray-900">{b.count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{
                    width: `${Math.min(100, (b.count / (browserWise[0]?.count || 1)) * 100)}%`,
                    background: COLORS[i % COLORS.length]
                  }} />
                </div>
              </div>
            ))}
            {browserWise.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No data yet</p>}
          </div>
        </div>

        {/* Top Pages */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Eye size={16} className="text-pink-500" /> Top Pages</h3>
          <div className="space-y-2">
            {topPages.map((p: any, i: number) => (
              <div key={p._id} className="flex items-center gap-2 py-1.5">
                <span className={`w-5 h-5 rounded text-[10px] flex items-center justify-center font-bold ${i < 3 ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span>
                <span className="text-sm text-gray-700 flex-1 truncate font-mono">{p._id}</span>
                <span className="font-bold text-sm text-gray-900">{p.count}</span>
              </div>
            ))}
            {topPages.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No page data yet</p>}
          </div>
        </div>
      </div>

      {/* Top Cities + Recent Visitors */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cities */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><MapPin size={16} className="text-pink-500" /> Top Cities</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {cityWise.map((c: any, i: number) => (
              <div key={c._id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50">
                <span className={`text-xs font-bold ${i < 3 ? 'text-pink-500' : 'text-gray-400'}`}>#{i + 1}</span>
                <span className="text-sm font-medium text-gray-700 flex-1">{c._id}</span>
                <span className="font-bold text-sm">{c.count}</span>
              </div>
            ))}
            {cityWise.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No city data yet</div>}
          </div>
        </div>

        {/* Recent Visitors */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Clock size={16} className="text-pink-500" /> Recent Visitors</h3>
          </div>
          <div className="divide-y divide-gray-50 max-h-[350px] overflow-y-auto">
            {recentVisitors.map((v: any, i: number) => (
              <div key={i} className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 text-sm">
                <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-700 truncate">{v.city}, {v.state}</p>
                  <p className="text-[10px] text-gray-400 font-mono truncate">{v.page}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">{v.device} · {v.browser}</p>
                  <p className="text-[10px] text-gray-400">{new Date(v.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
            {recentVisitors.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No visitors yet</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage
