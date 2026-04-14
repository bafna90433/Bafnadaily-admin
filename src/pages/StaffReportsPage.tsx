import React, { useState, useEffect } from 'react'
import { Download, Calendar, User, Search, RefreshCw, ImageIcon, ExternalLink, FileDown, Package, X, CheckSquare, Square, Folder, FolderPlus, ChevronRight, MoreVertical, Move, Copy, Trash2, ArrowLeft } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

interface StaffFolder {
  _id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

interface StaffReport {
  _id: string;
  imageUrl: string;
  staffName: string;
  productCode?: string;
  folderId?: string | null;
  createdAt: string;
}

const StaffReportsPage: React.FC = () => {
  const [reports, setReports] = useState<StaffReport[]>([])
  const [folders, setFolders] = useState<StaffFolder[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [path, setPath] = useState<{ id: string | null, name: string }[]>([{ id: null, name: 'Home' }])
  
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([])

  const [showFolderModal, setShowFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [isCopyMode, setIsCopyMode] = useState(false)
  const [allFolders, setAllFolders] = useState<StaffFolder[]>([])

  useEffect(() => {
    fetchData()
  }, [currentFolderId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const folderParam = currentFolderId || 'root'
      const [reportsRes, foldersRes] = await Promise.all([
        api.get(`/staff-reports?folderId=${folderParam}`),
        api.get(`/staff-reports/folders?parentId=${folderParam}`)
      ])
      
      if (reportsRes.data.success) setReports(reportsRes.data.reports)
      if (foldersRes.data.success) setFolders(foldersRes.data.folders)
    } catch (err: any) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      await api.post('/staff-reports/folders', {
        name: newFolderName,
        parentId: currentFolderId || 'root'
      })
      toast.success('Folder created')
      setShowFolderModal(false)
      setNewFolderName('')
      fetchData()
    } catch (err) {
      toast.error('Failed to create folder')
    }
  }

  const navigateToFolder = (folder: StaffFolder) => {
    setCurrentFolderId(folder._id)
    setPath([...path, { id: folder._id, name: folder.name }])
  }

  const navigateBack = (index: number) => {
    const newPath = path.slice(0, index + 1)
    setPath(newPath)
    setCurrentFolderId(newPath[newPath.length - 1].id)
    setSelectedIds([])
    setSelectedFolderIds([])
  }

  const handleMoveCopy = async (targetFolderId: string | null) => {
    try {
      if (isCopyMode) {
        await api.post('/staff-reports/copy', { reportIds: selectedIds, targetFolderId })
        toast.success('Items copied')
      } else {
        await api.patch('/staff-reports/move', { 
          reportIds: selectedIds, 
          folderIds: selectedFolderIds, 
          targetFolderId 
        })
        toast.success('Items moved')
      }
      setShowMoveModal(false)
      setSelectedIds([])
      setSelectedFolderIds([])
      fetchData()
    } catch (err) {
      toast.error('Action failed')
    }
  }

  const openMovePicker = async (copy: boolean = false) => {
    setIsCopyMode(copy)
    const { data } = await api.get('/staff-reports/folders')
    setAllFolders(data.folders || [])
    setShowMoveModal(true)
  }

  const toggleSelect = (id: string, isFolder: boolean = false) => {
    if (isFolder) {
      setSelectedFolderIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    } else {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }
  }

  const handleDownload = async (report: StaffReport, format: 'png' | 'webp') => {
    try {
      toast.loading(`Preparing ${format.toUpperCase()}...`)
      const response = await fetch(report.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${report.productCode || 'report'}_${report._id}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.dismiss()
    } catch (err) {
      toast.dismiss()
      toast.error('Download failed')
    }
  }

  const filteredReports = reports.filter(r => 
    r.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.productCode?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredFolders = folders.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-pink-50 rounded-xl text-primary">
            <Folder size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
               <h1 className="text-2xl font-bold text-gray-900">Staff Reports</h1>
               <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full font-bold">BETA</span>
            </div>
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1 mt-1 text-sm text-gray-400 overflow-x-auto pb-1">
              {path.map((p, i) => (
                <div key={i} className="flex items-center">
                  <button 
                    onClick={() => navigateBack(i)}
                    className={`hover:text-primary transition-colors whitespace-nowrap ${i === path.length - 1 ? 'text-gray-900 font-semibold' : ''}`}
                  >
                    {p.name}
                  </button>
                  {i < path.length - 1 && <ChevronRight size={14} className="mx-1" />}
                </div>
              ))}
            </nav>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowFolderModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold shadow-sm"
          >
            <FolderPlus size={18} className="text-green-500" />
            New Folder
          </button>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 bg-pink-50 text-primary rounded-xl hover:bg-pink-100 transition-colors shadow-sm"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Selection Toolbar */}
      {(selectedIds.length > 0 || selectedFolderIds.length > 0) && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-4">
            <button onClick={() => { setSelectedIds([]); setSelectedFolderIds([]); }} className="p-1 hover:bg-white/10 rounded-lg"><X size={20}/></button>
            <p className="font-bold text-sm">{selectedIds.length + selectedFolderIds.length} items selected</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => openMovePicker(false)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all"><Move size={16}/> Move</button>
            {selectedIds.length > 0 && selectedFolderIds.length === 0 && (
              <button onClick={() => openMovePicker(true)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all"><Copy size={16}/> Copy</button>
            )}
            <button className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl transition-all"><Trash2 size={18}/></button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search items in this folder..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-50 focus:border-primary transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm"><RefreshCw className="animate-spin text-primary mb-4" size={32} /><p className="text-gray-500 font-medium">Scanning Repository...</p></div>
      ) : (filteredReports.length === 0 && filteredFolders.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-200 border-dashed opacity-40"><ImageIcon size={64} className="text-gray-300 mb-4" /><p className="text-gray-500 text-lg font-medium">Empty Folder</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {/* Folders */}
          {filteredFolders.map((folder) => (
            <div 
              key={folder._id} 
              onDoubleClick={() => navigateToFolder(folder)}
              className={`group bg-white rounded-2xl p-4 border transition-all cursor-pointer relative ${selectedFolderIds.includes(folder._id) ? 'ring-2 ring-primary border-primary bg-pink-50/30' : 'border-gray-100 hover:border-pink-200 hover:shadow-lg hover:shadow-pink-500/5'}`}
            >
              <button 
                onClick={(e) => { e.stopPropagation(); toggleSelect(folder._id, true); }}
                className={`absolute top-3 right-3 z-10 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${selectedFolderIds.includes(folder._id) ? 'bg-primary border-primary' : 'bg-white border-gray-200 opacity-0 group-hover:opacity-100'}`}
              >
                {selectedFolderIds.includes(folder._id) && <CheckSquare size={14} className="text-white" />}
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                  <Folder size={24} fill="currentColor" fillOpacity={0.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{folder.name}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Directory</p>
                </div>
              </div>
            </div>
          ))}

          {/* Reports */}
          {filteredReports.map((report) => (
            <div 
              key={report._id} 
              className={`group bg-white rounded-2xl overflow-hidden border transition-all relative ${selectedIds.includes(report._id) ? 'ring-2 ring-primary border-primary' : 'border-gray-100 hover:border-pink-200 hover:shadow-xl shadow-sm'}`}
            >
              <button 
                onClick={() => toggleSelect(report._id)}
                className={`absolute top-3 left-3 z-10 w-6 h-6 rounded-lg shadow-md flex items-center justify-center border transition-all ${selectedIds.includes(report._id) ? 'bg-primary border-primary' : 'bg-white border-gray-100 opacity-0 group-hover:opacity-100'}`}
              >
                {selectedIds.includes(report._id) ? <CheckSquare size={16} className="text-white" /> : <Square size={16} className="text-gray-300" />}
              </button>
              
              <div className="aspect-square bg-gray-50 overflow-hidden cursor-zoom-in" onClick={() => setPreviewImage(report.imageUrl)}>
                <img src={report.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                {report.productCode && (
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black border border-white/20">
                    {report.productCode}
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-pink-50 rounded-full flex items-center justify-center text-primary"><User size={12}/></div>
                  <p className="text-xs font-bold text-gray-700 truncate">{report.staffName}</p>
                </div>
                <div className="flex items-center gap-1.5 pt-2 border-t border-gray-50">
                  <button onClick={() => handleDownload(report, 'webp')} className="flex-1 py-1.5 bg-primary text-white rounded-lg text-[10px] font-black hover:bg-pink-700 transition-colors">WEBP</button>
                  <button onClick={() => handleDownload(report, 'png')} className="px-2 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold hover:bg-gray-200 transition-colors">PNG</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Create New Directory</h3>
              <input 
                type="text" 
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-50 focus:border-primary transition-all font-medium"
                placeholder="Folder Name (e.g. Stock Items)"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
              />
              <div className="flex items-center justify-end gap-3 mt-8">
                <button onClick={() => setShowFolderModal(false)} className="px-6 py-3 text-gray-500 font-bold hover:text-gray-700 transition-colors">Cancel</button>
                <button onClick={handleCreateFolder} className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg shadow-pink-200 transition-all active:scale-95">Create Folder</button>
              </div>
           </div>
        </div>
      )}

      {/* Move/Copy UI Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">{isCopyMode ? 'Copy to...' : 'Move to...'}</h3>
                <button onClick={() => setShowMoveModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20}/></button>
              </div>
              <div className="max-h-[400px] overflow-y-auto p-2">
                <button 
                  onClick={() => handleMoveCopy(null)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-pink-50 rounded-2xl text-left group transition-all"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-pink-100 group-hover:text-primary transition-colors"><Folder size={20}/></div>
                  <span className="font-bold text-gray-700 group-hover:text-primary">Root Directory</span>
                </button>
                {allFolders.map(f => (
                  <button 
                    key={f._id}
                    onClick={() => handleMoveCopy(f._id)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-pink-50 rounded-2xl text-left group transition-all"
                  >
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500 group-hover:bg-pink-100 group-hover:text-primary transition-colors"><Folder size={20}/></div>
                    <span className="font-bold text-gray-700 group-hover:text-primary">{f.name}</span>
                  </button>
                ))}
              </div>
           </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} className="max-w-full max-h-full rounded-2xl shadow-2xl" alt="" />
        </div>
      )}
    </div>
  )
}

export default StaffReportsPage
