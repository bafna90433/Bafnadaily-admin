import React, { useState, useEffect } from 'react'
import { Download, Calendar, User, Search, RefreshCw, ImageIcon, ExternalLink, FileDown, Package, X, CheckSquare, Square, Folder, FolderPlus, ChevronRight, MoreVertical, Move, Copy, Trash2, ArrowLeft, MessageSquare, Send, Mic, Trash, Circle } from 'lucide-react'
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
  
  // Upload State
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadStaffName, setUploadStaffName] = useState('Admin')
  const [uploadProductCode, setUploadProductCode] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [showMoveModal, setShowMoveModal] = useState(false)
  const [isCopyMode, setIsCopyMode] = useState(false)
  const [allFoldersForPicker, setAllFoldersForPicker] = useState<StaffFolder[]>([])

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deleteFolderTargetId, setDeleteFolderTargetId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [showRenameModal, setShowRenameModal] = useState(false)
  const [renameFolder, setRenameFolder] = useState<StaffFolder | null>(null)
  const [renameName, setRenameName] = useState('')
  const [renaming, setRenaming] = useState(false)
  
  // Chat / Feedback States
  const [messages, setMessages] = useState<any[]>([])
  const [showChat, setShowChat] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [feedbackReportId, setFeedbackReportId] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const chatEndRef = React.useRef<HTMLDivElement>(null)

  // Recording states
  const [isRecording, setIsRecording] = useState(false)
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null)
  const [recordDuration, setRecordDuration] = useState(0)
  const [isUploadingVoice, setIsUploadingVoice] = useState(false)
  const recordInterval = React.useRef<any>(null)

  useEffect(() => {
    fetchData()
  }, [currentFolderId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const folderParam = currentFolderId || 'root'
      const [reportsRes, foldersRes, feedbackRes] = await Promise.all([
        api.get(`/staff-reports?folderId=${folderParam}`),
        api.get(`/staff-reports/folders?parentId=${folderParam}`),
        api.get(`/staff-reports/feedback/${folderParam}`)
      ])
      
      if (reportsRes.data.success) setReports(reportsRes.data.reports)
      if (foldersRes.data.success) setFolders(foldersRes.data.folders)
      if (feedbackRes.data?.success) {
        const msgs = feedbackRes.data.messages || []
        setMessages(msgs)
        setUnreadCount(msgs.filter((m: any) => !m.isRead && m.sender === 'staff').length)
      }
    } catch (err: any) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChat = async () => {
    setShowChat(true)
    if (unreadCount > 0) {
      try {
        await api.patch(`/staff-reports/feedback/read/${currentFolderId || 'root'}`)
        setUnreadCount(0)
        setMessages(prev => prev.map(m => ({ ...m, isRead: true })))
      } catch (err) { console.log(err) }
    }
  }

  const handleSendMessage = async (e?: React.FormEvent, audioBlob?: Blob, duration?: number) => {
    if (e) e.preventDefault()
    if (!chatMessage.trim() && !audioBlob) return

    try {
      const folderParam = currentFolderId || 'root'
      let payload: any = {
        folderId: folderParam,
        reportId: feedbackReportId,
        message: chatMessage,
        sender: 'admin',
        audioDuration: duration
      }

      let headers: any = {}

      if (audioBlob) {
        payload = new FormData()
        payload.append('folderId', folderParam)
        if (feedbackReportId) payload.append('reportId', feedbackReportId)
        payload.append('message', chatMessage)
        payload.append('sender', 'admin')
        payload.append('audioDuration', duration?.toString() || '0')
        payload.append('audio', audioBlob, 'admin_voice.webm')
        headers = { 'Content-Type': 'multipart/form-data' }
      }

      const res = await api.post('/staff-reports/feedback', payload, { headers })
      if (res.data.success) {
        setMessages(prev => [...prev, res.data.feedback])
        setChatMessage('')
        setFeedbackReportId(null)
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }
    } catch (err) {
      toast.error('Failed to send message')
    }
  }

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const newRecorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      newRecorder.ondataavailable = (e) => chunks.push(e.data)
      newRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        handleSendMessage(undefined, blob, recordDuration)
        stream.getTracks().forEach(track => track.stop())
      }

      newRecorder.start()
      setRecorder(newRecorder)
      setIsRecording(true)
      setRecordDuration(0)
      recordInterval.current = setInterval(() => {
        setRecordDuration(curr => curr + 1)
      }, 1000)
    } catch (err) {
      toast.error('Microphone access denied')
    }
  }

  const handleStopRecording = () => {
    if (recorder && isRecording) {
      recorder.stop()
      setIsRecording(false)
      clearInterval(recordInterval.current)
    }
  }

  const handleCancelRecording = () => {
    if (recorder) {
      recorder.onstop = null
      recorder.stop()
      recorder.stream.getTracks().forEach(track => track.stop())
    }
    setIsRecording(false)
    clearInterval(recordInterval.current)
    setRecorder(null)
  }

  const startFeedback = (reportId: string) => {
    setFeedbackReportId(reportId)
    setShowChat(true)
    setChatMessage('Re-upload requested for this image: ')
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setShowUploadModal(true)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    const formData = new FormData()
    formData.append('image', selectedFile)
    formData.append('staffName', uploadStaffName)
    if (uploadProductCode) formData.append('productCode', uploadProductCode)
    formData.append('folderId', currentFolderId || 'root')

    try {
      await api.post('/staff-reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Report uploaded successfully')
      setShowUploadModal(false)
      setSelectedFile(null)
      fetchData()
    } catch (err) {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const navigateToFolder = (folder: StaffFolder) => {
    setCurrentFolderId(folder._id)
    setPath([...path, { id: folder._id, name: folder.name }])
  }

  const handleBack = () => {
    if (path.length > 1) {
      navigateBack(path.length - 2)
    }
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
    const { data } = await api.get('/staff-reports/folders?all=true')
    setAllFoldersForPicker(data.folders || [])
    setShowMoveModal(true)
  }

  const toggleSelect = (id: string, isFolder: boolean = false) => {
    if (isFolder) {
      setSelectedFolderIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    } else {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }
  }

  const openDeleteConfirm = (singleId?: string) => {
    setDeleteTargetId(singleId || null)
    setDeleteFolderTargetId(null)
    setShowDeleteConfirm(true)
  }

  const openFolderDeleteConfirm = (folderId: string) => {
    setDeleteFolderTargetId(folderId)
    setDeleteTargetId(null)
    setShowDeleteConfirm(true)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      if (deleteFolderTargetId) {
        // Delete single folder
        await api.delete(`/staff-reports/folders/${deleteFolderTargetId}`)
        setFolders(prev => prev.filter(f => f._id !== deleteFolderTargetId))
        toast.success('Folder deleted')
      } else if (selectedIds.length > 0 && selectedFolderIds.length > 0) {
        // Mixed selection: delete both images and folders
        await Promise.all([
          ...selectedIds.map(id => api.delete(`/staff-reports/${id}`)),
          ...selectedFolderIds.map(id => api.delete(`/staff-reports/folders/${id}`))
        ])
        setReports(prev => prev.filter(r => !selectedIds.includes(r._id)))
        setFolders(prev => prev.filter(f => !selectedFolderIds.includes(f._id)))
        toast.success(`${selectedIds.length + selectedFolderIds.length} items deleted`)
        setSelectedIds([])
        setSelectedFolderIds([])
      } else if (selectedFolderIds.length > 0) {
        // Only folders selected
        await Promise.all(selectedFolderIds.map(id => api.delete(`/staff-reports/folders/${id}`)))
        setFolders(prev => prev.filter(f => !selectedFolderIds.includes(f._id)))
        toast.success(`${selectedFolderIds.length} folder${selectedFolderIds.length > 1 ? 's' : ''} deleted`)
        setSelectedFolderIds([])
      } else {
        // Only images
        const idsToDelete = deleteTargetId ? [deleteTargetId] : selectedIds
        await Promise.all(idsToDelete.map(id => api.delete(`/staff-reports/${id}`)))
        setReports(prev => prev.filter(r => !idsToDelete.includes(r._id)))
        toast.success(`${idsToDelete.length} image${idsToDelete.length > 1 ? 's' : ''} deleted`)
        setSelectedIds([])
      }
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
      setDeleteTargetId(null)
      setDeleteFolderTargetId(null)
    }
  }

  const openRenameModal = (folder: StaffFolder) => {
    setRenameFolder(folder)
    setRenameName(folder.name)
    setShowRenameModal(true)
  }

  const handleRename = async () => {
    if (!renameFolder || !renameName.trim()) return
    setRenaming(true)
    try {
      await api.patch(`/staff-reports/folders/${renameFolder._id}`, { name: renameName.trim() })
      setFolders(prev => prev.map(f => f._id === renameFolder._id ? { ...f, name: renameName.trim() } : f))
      toast.success('Folder renamed')
      setShowRenameModal(false)
    } catch {
      toast.error('Rename failed')
    } finally {
      setRenaming(false)
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
          {path.length > 1 && (
            <button 
              onClick={handleBack}
              className="p-2.5 bg-gray-50 text-gray-400 hover:text-primary hover:bg-pink-50 rounded-xl transition-all"
              title="Go Back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
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
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileSelect} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-pink-700 transition-all text-xs font-bold shadow-sm"
          >
            <ImageIcon size={14} />
            Upload Report
          </button>
          <button 
            onClick={() => setShowFolderModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold shadow-sm"
          >
            <FolderPlus size={18} className="text-green-500" />
            New Folder
          </button>
          <button 
            onClick={handleOpenChat}
            className="p-2.5 bg-pink-50 text-primary rounded-xl hover:bg-pink-100 transition-colors shadow-sm relative"
            title="Folder Chat"
          >
            <MessageSquare size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white font-bold">
                {unreadCount}
              </span>
            )}
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
            <button onClick={() => openDeleteConfirm()} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-xl text-sm font-bold transition-all"><Trash2 size={16}/> Delete</button>
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
      ) : (
        <div className="space-y-8">
            {/* Folder Selection (Distinct List) */}
            {filteredFolders.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Sub-Directories</h3>
                    <div className="flex flex-wrap gap-4">
                        {filteredFolders.map((folder) => (
                            <div
                                key={folder._id}
                                onDoubleClick={() => navigateToFolder(folder)}
                                className={`group min-w-[220px] flex items-center justify-between bg-white rounded-xl p-3 border transition-all cursor-pointer ${selectedFolderIds.includes(folder._id) ? 'ring-2 ring-primary border-primary bg-pink-50' : 'border-gray-100 hover:border-pink-200 hover:shadow-md'}`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-500 flex-shrink-0">
                                        <Folder size={18} fill="currentColor" fillOpacity={0.2} />
                                    </div>
                                    <p className="font-bold text-gray-700 truncate">{folder.name}</p>
                                </div>
                                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setCurrentFolderId(folder._id); setPath([...path, { id: folder._id, name: folder.name }]); fileInputRef.current?.click(); }}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-pink-50 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Upload to this folder"
                                    >
                                        <ImageIcon size={13} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openRenameModal(folder); }}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Rename"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openFolderDeleteConfirm(folder._id); }}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Delete folder"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleSelect(folder._id, true); }}
                                        className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${selectedFolderIds.includes(folder._id) ? 'bg-primary border-primary opacity-100' : 'bg-white border-gray-200 opacity-0 group-hover:opacity-100'}`}
                                    >
                                        {selectedFolderIds.includes(folder._id) && <CheckSquare size={12} className="text-white" />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Media/Reports Section */}
            <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Media Files</h3>
                {filteredReports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-200 border-dashed animate-in fade-in duration-500">
                        <div className="p-4 bg-gray-50 rounded-3xl mb-4">
                            <ImageIcon size={48} className="text-gray-300" />
                        </div>
                        <p className="text-gray-500 text-lg font-bold mb-2">No files in directory</p>
                        <p className="text-sm text-gray-400 mb-6">Start by uploading a report to this folder</p>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-95"
                        >
                            <ImageIcon size={18} />
                            Upload First Report
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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
                        <button
                            onClick={(e) => { e.stopPropagation(); openDeleteConfirm(report._id); }}
                            className="absolute top-3 right-3 z-10 w-7 h-7 rounded-lg bg-red-500 text-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110"
                            title="Delete image"
                        >
                            <Trash2 size={13} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); startFeedback(report._id); }}
                            className="absolute top-12 right-3 z-10 w-7 h-7 rounded-lg bg-pink-600 text-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-pink-700 hover:scale-110"
                            title="Request Re-upload"
                        >
                            <MessageSquare size={13} />
                        </button>
                        
                        <div className="aspect-square bg-gray-50 overflow-hidden cursor-zoom-in relative" onClick={() => setPreviewImage(report.imageUrl)}>
                            <img src={report.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" loading="lazy" />
                            {report.productCode && (
                            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[10px] font-black border border-white/20">
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
            </div>
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
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-pink-100 group-hover:text-primary transition-colors"><Package size={20}/></div>
                  <span className="font-bold text-gray-700 group-hover:text-primary">Root Directory</span>
                </button>
                {allFoldersForPicker.map(f => (
                  <button 
                    key={f._id}
                    onClick={() => handleMoveCopy(f._id)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-pink-50 rounded-2xl text-left group transition-all"
                  >
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500 group-hover:bg-pink-100 group-hover:text-primary transition-colors"><Folder size={20}/></div>
                    <div>
                        <span className="font-bold text-gray-700 group-hover:text-primary">{f.name}</span>
                        <p className="text-[10px] text-gray-400 uppercase font-black">Directory</p>
                    </div>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Trash2 size={26} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              {deleteFolderTargetId ? 'Delete Folder?' : `Delete ${selectedIds.length + selectedFolderIds.length > 1 || (!deleteTargetId && !deleteFolderTargetId) ? 'Items' : 'Image'}?`}
            </h3>
            <p className="text-gray-500 text-center text-sm mb-8">
              {deleteFolderTargetId
                ? 'This folder and all its contents will be permanently deleted.'
                : deleteTargetId
                  ? 'This image will be permanently deleted from the server.'
                  : `${selectedIds.length + selectedFolderIds.length} item${selectedIds.length + selectedFolderIds.length > 1 ? 's' : ''} will be permanently deleted.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteTargetId(null); setDeleteFolderTargetId(null); }}
                disabled={deleting}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {deleting ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Folder Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Rename Folder</h3>
            <input
              type="text"
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-50 focus:border-primary transition-all font-medium"
              placeholder="New folder name"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              autoFocus
            />
            <div className="flex items-center justify-end gap-3 mt-8">
              <button onClick={() => setShowRenameModal(false)} disabled={renaming} className="px-6 py-3 text-gray-500 font-bold hover:text-gray-700 transition-colors">Cancel</button>
              <button
                onClick={handleRename}
                disabled={renaming || !renameName.trim()}
                className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg shadow-pink-200 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-60"
              >
                {renaming && <RefreshCw size={14} className="animate-spin" />}
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Report Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ImageIcon className="text-primary" /> Upload Report
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Staff Name</label>
                <input
                  type="text"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-50 focus:border-primary transition-all font-medium"
                  placeholder="Enter staff name"
                  value={uploadStaffName}
                  onChange={(e) => setUploadStaffName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Product Code (Optional)</label>
                <input
                  type="text"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-50 focus:border-primary transition-all font-medium"
                  placeholder="e.g. P101, CH-001"
                  value={uploadProductCode}
                  onChange={(e) => setUploadProductCode(e.target.value.toUpperCase())}
                />
              </div>
              
              {selectedFile && (
                <div className="p-4 bg-pink-50 rounded-2xl border border-pink-100 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                    <img src={URL.createObjectURL(selectedFile)} className="w-full h-full object-cover" alt="preview" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-700 truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-8">
              <button 
                onClick={() => { setShowUploadModal(false); setSelectedFile(null); }} 
                disabled={uploading}
                className="px-6 py-3 text-gray-500 font-bold hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !uploadStaffName.trim()}
                className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg shadow-pink-200 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-60"
              >
                {uploading && <RefreshCw size={14} className="animate-spin" />}
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Sidebar */}
      {showChat && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-[100] flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b flex items-center justify-between bg-pink-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Folder Instructions</h3>
                <p className="text-[10px] text-pink-600 font-bold uppercase tracking-wider">{path[path.length-1].name}</p>
              </div>
            </div>
            <button onClick={() => setShowChat(false)} className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                  <MessageSquare size={40} className="text-slate-200" />
                </div>
                <p className="text-sm font-medium">No instructions sent yet.</p>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isAdmin = m.sender === 'admin'
                return (
                  <div key={idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                      isAdmin 
                        ? 'bg-pink-600 text-white rounded-br-none' 
                        : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                    }`}>
                      {m.reportId && (
                        <div className={`flex items-center gap-2 p-2 rounded-lg mb-2 text-xs border ${
                          isAdmin ? 'bg-pink-700/50 border-pink-500/50' : 'bg-slate-50 border-slate-100'
                        }`}>
                          <img src={m.reportId.imageUrl} className="w-8 h-8 rounded object-cover shadow-sm" alt="ref" />
                          <span className="font-bold opacity-80 truncate">Ref: {m.reportId.productCode || 'Image'}</span>
                        </div>
                      )}
                      {m.audioUrl ? (
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          <audio controls className="w-full h-8 custom-audio-player">
                            <source src={m.audioUrl} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                          <p className="text-[10px] font-bold opacity-60">
                            Voice Message • {Math.floor((m.audioDuration || 0) / 60)}:{(m.audioDuration || 0) % 60 < 10 ? '0' : ''}{(m.audioDuration || 0) % 60}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed">{m.message}</p>
                      )}
                      <div className={`text-[10px] mt-2 font-medium opacity-60 ${isAdmin ? 'text-pink-100' : 'text-slate-400'}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {!isAdmin && ` • ${m.staffName}`}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
            {feedbackReportId && (
              <div className="bg-pink-50 p-2 rounded-lg mb-3 flex items-center justify-between border border-pink-100 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-pink-200 overflow-hidden flex-shrink-0">
                    <img src={reports.find(r => r._id === feedbackReportId)?.imageUrl} className="w-full h-full object-cover" alt="ref" />
                  </div>
                  <span className="text-xs font-bold text-pink-700">Linking message to this photo</span>
                </div>
                <button type="button" onClick={() => setFeedbackReportId(null)} className="text-pink-400 hover:text-pink-600">
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="relative flex items-center gap-2">
              <button 
                type="button"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={`p-3 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={18} />}
              </button>
              
              {isRecording ? (
                <div className="flex-1 flex items-center justify-between px-4 py-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    <span className="text-sm font-bold text-red-600">Recording... {Math.floor(recordDuration / 60)}:{(recordDuration % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <button type="button" onClick={handleCancelRecording} className="text-red-400 hover:text-red-600">
                    <Trash size={16} />
                  </button>
                </div>
              ) : (
                <input 
                  type="text"
                  placeholder="Type your instructions..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                />
              )}

              {!isRecording && (
                <button 
                  type="submit"
                  disabled={!chatMessage.trim()}
                  className="absolute right-2 p-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-all font-bold"
                >
                  <Send size={18} />
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default StaffReportsPage
