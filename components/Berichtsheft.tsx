
import React, { useState, useMemo } from 'react';
import { TodoItem } from '../types';
import { Calendar, Wand2, CheckCircle2, AlertCircle, BookOpen, Briefcase, GraduationCap, SlidersHorizontal, Hash, Key, Download, Upload, FileText } from 'lucide-react';
import { generateWeeklyReport, ReportData } from '../services/geminiService';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

interface BerichtsheftProps {
  todos: TodoItem[];
  completedReports: string[];
  onToggleReport: (id: string) => void;
  onOpenSettings: () => void;
  t: (key: any) => string;
}

const Berichtsheft: React.FC<BerichtsheftProps> = ({ todos, completedReports, onToggleReport, onOpenSettings, t }) => {
  // ISO 8601 Week Number calculation
  const getISOWeek = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  // Default to the start of the current week (Monday)
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  };

  const [selectedDate, setSelectedDate] = useState(getStartOfWeek(new Date()).toISOString().split('T')[0]);
  const [reportNumber, setReportNumber] = useState('');
  const [tone, setTone] = useState<'Formal' | 'Concise' | 'Detailed'>('Formal');
  
  // Data State
  const [reportData, setReportData] = useState<ReportData>({
    betrieblicheTaetigkeiten: '',
    unterweisung: '',
    berufsschule: '',
    gesamtstunden: '40'
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // PDF State
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  // Calculate Calendar Week based on selected date
  const calendarWeek = useMemo(() => {
    if (!selectedDate) return 0;
    return getISOWeek(new Date(selectedDate));
  }, [selectedDate]);

  const reportId = useMemo(() => {
    const year = new Date(selectedDate).getFullYear();
    return `${year}-W${calendarWeek}`;
  }, [selectedDate, calendarWeek]);

  const isCompleted = completedReports.includes(reportId);

  // Calculate Header Dates
  const dateRangeString = useMemo(() => {
    const start = new Date(selectedDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 5); 
    const dateOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return `${start.toLocaleDateString('de-DE', dateOptions)} - ${end.toLocaleDateString('de-DE', dateOptions)}`;
  }, [selectedDate]);

  // Filter completed todos for the selected week
  const relevantTodos = useMemo(() => {
    if (!selectedDate) return [];
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return todos.filter(t => {
      if (!t.completed) return false;
      if (t.completedAt) {
        const d = new Date(t.completedAt);
        return d >= start && d < end;
      }
      return false; 
    });
  }, [todos, selectedDate]);

  const betriebTodos = relevantTodos.filter(t => t.category === 'Betrieb' || t.category === 'Sonstiges');
  const schoolTodos = relevantTodos.filter(t => t.category === 'Berufsschule');

  const handleGenerate = async () => {
    if (relevantTodos.length === 0) return;
    
    setIsGenerating(true);
    setError(null);
    try {
      const betriebTasks = betriebTodos.map(t => t.text);
      const schuleTasks = schoolTodos.map(t => t.text);

      const tasksPayload = {
        betrieb: betriebTasks,
        berufsschule: schuleTasks
      };

      const data = await generateWeeklyReport(
        tasksPayload, 
        selectedDate, 
        tone, 
        reportNumber, 
        calendarWeek
      );
      setReportData(data);
    } catch (error: any) {
      console.error("Failed to generate report", error);
      if (error.message?.includes("API Key")) {
        setError("API Key missing");
      } else {
        setError("Error generating report. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setTemplateFile(file);
      } else {
        alert("Please upload a PDF file.");
      }
    }
  };

  const sanitizeText = (text: string | null | undefined) => {
    if (!text) return '';
    // Replace characters not supported by WinAnsi (StandardFonts.Helvetica)
    return String(text)
      .replace(/•/g, '-')       // Bullet -> Hyphen
      .replace(/–/g, '-')       // En-dash -> Hyphen
      .replace(/—/g, '-')       // Em-dash -> Hyphen
      .replace(/“/g, '"')       // Smart Quotes
      .replace(/”/g, '"')
      .replace(/‘/g, "'")
      .replace(/’/g, "'")
      .replace(/…/g, '...')
      .replace(/[^\x20-\x7E\xA0-\xFF\n\r]/g, ''); // Strip non-Latin1 chars except newlines
  };

  const generateAndDownloadPDF = async () => {
    if (!templateFile) {
      alert("Please upload a PDF template first (the blank Berichtsheft form).");
      return;
    }

    setIsPdfGenerating(true);
    try {
      const existingPdfBytes = await templateFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { height } = firstPage.getSize();

      // --- Layout Configuration ---
      // (0,0) is Bottom-Left.
      // minY acts as a boundary; if text goes below this Y, it stops rendering.
      
      const layout = {
        padding: 12,
        lineHeight: 14,
        fontSize: 10,
        
        // Section 1: Betriebliche Tätigkeit (Top Box)
        section1: { 
          x: 60, 
          y: height - 170, 
          width: 430, // Reduced width to avoid right overflow
          minY: height - 350 
        },

        // Section 2: Unterweisung / Arbeitsvorgang (Middle Box)
        // Moved down to height - 375 to avoid top overflow
        section2: { 
          x: 60, 
          y: height - 375, 
          width: 430, // Reduced width
          minY: height - 570 
        },

        // Section 3: Berufsschule (Bottom Box)
        // Moved down to height - 595 to avoid top overflow
        section3: { 
          x: 60, 
          y: height - 595, 
          width: 430, // Reduced width
          minY: 130 
        },
        
        // Footer: Gesamtstunden
        footerHours: { x: 520, y: 55 }
      };

      const drawText = (text: string, x: number, startY: number, width: number, minY: number) => {
        const cleanContent = sanitizeText(text);
        const paragraphs = cleanContent.split(/\r?\n/);
        
        // Apply initial padding
        let currentY = startY - layout.padding;
        const startX = x + (layout.padding / 2);
        const maxLineWidth = width - layout.padding;

        for (const paragraph of paragraphs) {
          // Check boundary before processing paragraph
          if (currentY < minY) break;

          const words = paragraph.split(' ');
          let line = '';

          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = line + (line ? ' ' : '') + word;
            
            let w = 0;
            try {
              w = helveticaFont.widthOfTextAtSize(testLine, layout.fontSize);
            } catch (e) {
              w = helveticaFont.widthOfTextAtSize(line, layout.fontSize) + 10;
            }

            if (w > maxLineWidth && line !== '') {
              // Draw existing line
              if (currentY >= minY) {
                 firstPage.drawText(line, { x: startX, y: currentY, size: layout.fontSize, font: helveticaFont, color: rgb(0, 0, 0) });
              }
              currentY -= layout.lineHeight;
              line = word;

              // Check boundary after newline
              if (currentY < minY) return; 
            } else {
              line = testLine;
            }
          }
          
          if (line) {
             if (currentY >= minY) {
               firstPage.drawText(line, { x: startX, y: currentY, size: layout.fontSize, font: helveticaFont, color: rgb(0, 0, 0) });
             }
             currentY -= layout.lineHeight;
          }
          
          // Extra spacing for paragraphs
          if (paragraph.trim() === '') {
             currentY -= (layout.lineHeight / 2);
          }
          
          if (currentY < minY) break;
        }
      };

      // NOTE: Header fields (Report Nr, Week, Date) are NOT drawn to allow manual entry.

      // 1. Text Sections (Betrieb, Unterweisung, Schule)
      drawText(
        reportData.betrieblicheTaetigkeiten, 
        layout.section1.x, 
        layout.section1.y, 
        layout.section1.width, 
        layout.section1.minY
      );

      drawText(
        reportData.unterweisung, 
        layout.section2.x, 
        layout.section2.y, 
        layout.section2.width,
        layout.section2.minY
      );

      drawText(
        reportData.berufsschule, 
        layout.section3.x, 
        layout.section3.y, 
        layout.section3.width,
        layout.section3.minY
      );
      
      // 2. Footer Hours (kept as it is a calculated field, but can be removed if needed)
      firstPage.drawText(reportData.gesamtstunden, { x: layout.footerHours.x, y: layout.footerHours.y, size: 12, font: helveticaFont });

      // Serialize and download
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Berichtsheft_KW${calendarWeek}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      console.error("PDF Generation Error", e);
      alert(`Failed to generate PDF. Error: ${e.message}`);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100dvh-9rem)] min-h-[600px]">
      
      {/* Left Panel: Inputs */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4 h-full overflow-hidden">
        <div className="shrink-0">
           <h2 className="text-2xl font-bold text-slate-800">{t('reportBook')} Generator</h2>
           <p className="text-slate-500">Auto-fill your official PDF template.</p>
        </div>

        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 pb-2">
          {/* Controls */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-2 gap-3 shrink-0">
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-1">
                <Calendar size={14} /> Week
              </label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
               <label className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-1">
                <Hash size={14} /> Nr.
              </label>
              <input 
                type="text"
                value={reportNumber}
                onChange={(e) => setReportNumber(e.target.value)}
                placeholder="#"
                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
             <div>
               <label className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-1">
                <SlidersHorizontal size={14} /> Style
              </label>
              <select 
                value={tone} 
                onChange={(e) => setTone(e.target.value as any)}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="Formal">Formal</option>
                <option value="Concise">Short</option>
                <option value="Detailed">Detailed</option>
              </select>
            </div>
          </div>

          {/* AI Generation Box */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 shrink-0">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-slate-800">1. Generate Content</h3>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                {relevantTodos.length} Tasks
              </span>
            </div>
            
            {error === "API Key missing" ? (
               <button onClick={onOpenSettings} className="w-full bg-red-50 text-red-600 border border-red-200 py-2 rounded-lg text-sm font-medium flex justify-center gap-2">
                 <Key size={16} /> Set API Key
               </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={relevantTodos.length === 0 || isGenerating}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? "Writing..." : <><Wand2 size={16} /> Generate Text</>}
              </button>
            )}
            {relevantTodos.length === 0 && <p className="text-xs text-center text-slate-400 mt-2">Mark tasks as complete to generate.</p>}
          </div>

          {/* PDF Upload Box */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 shrink-0">
             <h3 className="text-sm font-bold text-slate-800 mb-3">2. Upload Template</h3>
             <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
               <input 
                 type="file" 
                 accept="application/pdf"
                 onChange={handleFileChange}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               />
               <div className="flex flex-col items-center gap-2 pointer-events-none">
                 {templateFile ? (
                   <>
                     <FileText size={24} className="text-red-500" />
                     <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{templateFile.name}</span>
                   </>
                 ) : (
                   <>
                     <Upload size={24} className="text-slate-400" />
                     <span className="text-sm text-slate-500">Upload blank PDF</span>
                   </>
                 )}
               </div>
             </div>
          </div>

          {/* Download Button */}
          <button
            onClick={generateAndDownloadPDF}
            disabled={!templateFile || !reportData.betrieblicheTaetigkeiten}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2 shrink-0"
          >
            {isPdfGenerating ? "Processing..." : <><Download size={20} /> Download Filled PDF</>}
          </button>
        </div>
      </div>

      {/* Right Panel: Content Preview/Edit */}
      <div className="w-full lg:w-2/3 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
         <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
            <span className="font-bold text-slate-700 flex items-center gap-2">
              <FileText size={18} className="text-blue-500" />
              Preview & Edit Content
            </span>
         </div>

         <div className="flex-1 overflow-y-auto p-6 space-y-6">
           {/* Section 1 */}
           <div>
             <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
               Betriebliche Tätigkeiten
             </label>
             <textarea 
               value={reportData.betrieblicheTaetigkeiten}
               onChange={(e) => setReportData({...reportData, betrieblicheTaetigkeiten: e.target.value})}
               className="w-full h-48 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none font-mono text-sm leading-relaxed"
               placeholder="Generated tasks will appear here..."
             />
           </div>

           {/* Section 2 */}
           <div>
             <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
               Unterweisung / Arbeitsvorgang
             </label>
             <textarea 
               value={reportData.unterweisung}
               onChange={(e) => setReportData({...reportData, unterweisung: e.target.value})}
               className="w-full h-40 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none font-mono text-sm leading-relaxed"
               placeholder="Detailed description will appear here..."
             />
           </div>

           {/* Section 3 */}
           <div>
             <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
               Berufsschule
             </label>
             <textarea 
               value={reportData.berufsschule}
               onChange={(e) => setReportData({...reportData, berufsschule: e.target.value})}
               className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none font-mono text-sm leading-relaxed"
               placeholder="School topics..."
             />
           </div>
         </div>
      </div>
    </div>
  );
};

export default Berichtsheft;
