
import React, { useRef, useState } from 'react';
import { FileDocument } from '../types';
import { UploadCloud, File, Image as ImageIcon, Trash2, Download, HardDrive, LayoutGrid, List, AlertTriangle } from 'lucide-react';

interface FileManagerProps {
  files: FileDocument[];
  setFiles: (files: FileDocument[]) => void;
  t: (key: any) => string;
}

const FileManager: React.FC<FileManagerProps> = ({ files, setFiles, t }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (uploadedFile: File) => {
    const newDoc: FileDocument = {
      id: Date.now().toString(),
      name: uploadedFile.name,
      type: uploadedFile.type,
      size: uploadedFile.size,
      uploadDate: new Date().toISOString(),
      url: URL.createObjectURL(uploadedFile),
      isPersisted: uploadedFile.size <= 500 * 1024 
    };
    
    setFiles([newDoc, ...files]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      processFile(droppedFile);
    }
  };

  const deleteFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100dvh-8rem)] md:h-full flex flex-col">
       <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">{t('documents')}</h2>
           <p className="text-slate-500">Store reports, contracts, and certificates.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200">
           <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-slate-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            title="List View"
           >
             <List size={20} />
           </button>
           <button 
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            title="Grid View"
           >
             <LayoutGrid size={20} />
           </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group mb-8 shrink-0 relative overflow-hidden active:scale-95
          ${isDragging 
            ? 'border-blue-500 bg-blue-50/80 scale-[1.01] shadow-lg' 
            : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/30'}
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden" 
        />
        <div className={`
          w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform duration-300
          ${isDragging ? 'bg-blue-200 text-blue-700 scale-110' : 'bg-blue-100 text-blue-600 group-hover:scale-110'}
        `}>
          <UploadCloud size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-700 text-center">
          {isDragging ? 'Drop file here' : t('uploadTitle')}
        </h3>
        <p className="text-slate-400 text-sm mt-1 text-center">{t('uploadSubtitle')}</p>
        
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 pointer-events-none backdrop-blur-[1px]"></div>
        )}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        {files.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-slate-400">
             <HardDrive size={48} className="mb-4 opacity-20" />
             <p>{t('noDocs')}</p>
           </div>
        ) : (
          viewMode === 'list' ? (
            <div className="space-y-1">
              {files.map((file) => (
                <div key={file.id} className="flex items-center p-3 hover:bg-slate-50 rounded-lg group transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 shrink-0 ${file.type.startsWith('image') ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                      {file.type.startsWith('image') ? <ImageIcon size={20} /> : <File size={20} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                        {!file.isPersisted && (
                          <span title="File too large to save offline" className="text-amber-500">
                            <AlertTriangle size={12} />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{formatSize(file.size)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    {file.url && (
                      <a 
                        href={file.url} 
                        download={file.name} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-blue-600"
                      >
                        <Download size={18} />
                      </a>
                    )}
                    <button onClick={() => deleteFile(file.id)} className="p-2 text-slate-400 hover:text-red-600">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {files.map((file) => (
                 <div key={file.id} className="group relative border border-slate-100 rounded-xl p-4 hover:shadow-md transition-all flex flex-col items-center text-center bg-white">
                    <div className={`w-16 h-16 rounded-xl mb-3 flex items-center justify-center ${file.type.startsWith('image') ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                      {file.type.startsWith('image') ? <ImageIcon size={32} /> : <File size={32} />}
                    </div>
                    <p className="text-sm font-medium text-slate-700 w-full truncate">{file.name}</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <p className="text-xs text-slate-400">{formatSize(file.size)}</p>
                      {!file.isPersisted && (
                          <span title="File too large to save offline" className="text-amber-500">
                            <AlertTriangle size={10} />
                          </span>
                        )}
                    </div>
                    
                    <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur rounded-lg shadow-sm border border-slate-100">
                      {file.url && (
                        <a 
                          href={file.url} 
                          download={file.name} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-500 hover:text-blue-600"
                        >
                          <Download size={14} />
                        </a>
                      )}
                      <button onClick={() => deleteFile(file.id)} className="p-1.5 text-slate-500 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                 </div>
               ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default FileManager;
