import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Type, Image, Trash2, Save, Eye, ArrowLeft, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Move, Maximize2 } from 'lucide-react';
import { ReportElement, ReportElementStyle, ReportTemplateConfig } from '../types';

interface HeaderFooterEditorProps {
  template: ReportTemplateConfig;
  onSave: (template: ReportTemplateConfig) => void;
  onClose: () => void;
  companyLogo?: string;
}

const DEFAULT_STYLE: ReportElementStyle = {
  fontFamily: 'Arial',
  fontSize: 14,
  color: '#000000',
  bold: false,
  italic: false,
  underline: false,
  align: 'left',
};

const FONTS = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New',
  'Verdana', 'Trebuchet MS', 'Tahoma', 'Impact', 'Comic Sans MS',
  'Palatino', 'Garamond', 'Bookman', 'Roboto', 'Open Sans',
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];

const A4_WIDTH_PX = 794;

type CanvasSection = 'header' | 'footer';

export const HeaderFooterEditor: React.FC<HeaderFooterEditorProps> = ({ template, onSave, onClose, companyLogo }) => {
  const [headerHeight, setHeaderHeight] = useState(template.headerHeight || 120);
  const [footerHeight, setFooterHeight] = useState(template.footerHeight || 80);
  const [headerElements, setHeaderElements] = useState<ReportElement[]>(template.headerElements || []);
  const [footerElements, setFooterElements] = useState<ReportElement[]>(template.footerElements || []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<CanvasSection>('header');
  const [showPreview, setShowPreview] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const headerCanvasRef = useRef<HTMLDivElement>(null);
  const footerCanvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number; type: 'move' | 'resize'; resizeDir?: string } | null>(null);

  const currentElements = activeSection === 'header' ? headerElements : footerElements;
  const setCurrentElements = activeSection === 'header' ? setHeaderElements : setFooterElements;
  const currentHeight = activeSection === 'header' ? headerHeight : footerHeight;

  const selectedElement = currentElements.find(el => el.id === selectedId) || null;

  const updateElement = useCallback((id: string, updates: Partial<ReportElement>) => {
    setCurrentElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  }, [setCurrentElements]);

  const updateElementStyle = useCallback((id: string, styleUpdates: Partial<ReportElementStyle>) => {
    setCurrentElements(prev => prev.map(el =>
      el.id === id ? { ...el, style: { ...el.style, ...styleUpdates } } : el
    ));
  }, [setCurrentElements]);

  const addTextBox = () => {
    const newEl: ReportElement = {
      id: `el_${Date.now()}`,
      type: 'text',
      x: 20,
      y: 20,
      width: 200,
      height: 40,
      content: 'Texto aqui',
      style: { ...DEFAULT_STYLE },
    };
    setCurrentElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
  };

  const addImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/svg+xml';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const img = new window.Image();
        img.onload = () => {
          const maxW = 200;
          const ratio = img.width / img.height;
          const w = Math.min(img.width, maxW);
          const h = w / ratio;
          const newEl: ReportElement = {
            id: `el_${Date.now()}`,
            type: 'image',
            x: 20,
            y: 10,
            width: w,
            height: h,
            content: dataUrl,
            style: { ...DEFAULT_STYLE },
          };
          setCurrentElements(prev => [...prev, newEl]);
          setSelectedId(newEl.id);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setCurrentElements(prev => prev.filter(el => el.id !== selectedId));
    setSelectedId(null);
  };

  const handleSave = () => {
    onSave({
      ...template,
      headerHeight,
      footerHeight,
      headerElements,
      footerElements,
    });
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string, type: 'move' | 'resize', resizeDir?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(elementId);
    const el = currentElements.find(el => el.id === elementId);
    if (!el) return;
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: el.x,
      origY: el.y,
      type,
      resizeDir,
    };

    const origW = el.width;
    const origH = el.height;
    const canvasRef = activeSection === 'header' ? headerCanvasRef : footerCanvasRef;
    const canvasRect = canvasRef.current?.getBoundingClientRect();

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragState.current || !canvasRect) return;
      const dx = ev.clientX - dragState.current.startX;
      const dy = ev.clientY - dragState.current.startY;

      if (dragState.current.type === 'move') {
        const scale = canvasRect.width / A4_WIDTH_PX;
        const newX = Math.max(0, Math.min(A4_WIDTH_PX - origW, dragState.current.origX + dx / scale));
        const newY = Math.max(0, Math.min(currentHeight - origH, dragState.current.origY + dy / scale));
        updateElement(elementId, { x: newX, y: newY });
      } else if (dragState.current.type === 'resize') {
        const scale = canvasRect.width / A4_WIDTH_PX;
        const scaledDx = dx / scale;
        const scaledDy = dy / scale;
        let newW = origW;
        let newH = origH;
        let newX = dragState.current.origX;
        let newY = dragState.current.origY;

        if (dragState.current.resizeDir?.includes('e')) newW = Math.max(30, origW + scaledDx);
        if (dragState.current.resizeDir?.includes('w')) {
          newW = Math.max(30, origW - scaledDx);
          newX = dragState.current.origX + scaledDx;
        }
        if (dragState.current.resizeDir?.includes('s')) newH = Math.max(20, origH + scaledDy);
        if (dragState.current.resizeDir?.includes('n')) {
          newH = Math.max(20, origH - scaledDy);
          newY = dragState.current.origY + scaledDy;
        }
        updateElement(elementId, { width: newW, height: newH, x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      dragState.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const renderElement = (el: ReportElement, isPreview = false) => {
    const isSelected = el.id === selectedId && !isPreview;
    const isEditing = el.id === editingTextId && !isPreview;

    return (
      <div
        key={el.id}
        style={{
          position: 'absolute',
          left: el.x,
          top: el.y,
          width: el.width,
          height: el.height,
          cursor: isPreview ? 'default' : 'move',
          outline: isSelected ? '2px solid #3b82f6' : isPreview ? 'none' : '1px dashed #cbd5e1',
          zIndex: isSelected ? 10 : 1,
          userSelect: isEditing ? 'text' : 'none',
        }}
        onMouseDown={isPreview ? undefined : (e) => handleMouseDown(e, el.id, 'move')}
        onClick={isPreview ? undefined : (e) => { e.stopPropagation(); setSelectedId(el.id); }}
        onDoubleClick={isPreview ? undefined : () => { if (el.type === 'text') setEditingTextId(el.id); }}
      >
        {el.type === 'text' ? (
          isEditing ? (
            <textarea
              autoFocus
              value={el.content}
              onChange={e => updateElement(el.id, { content: e.target.value })}
              onBlur={() => setEditingTextId(null)}
              onKeyDown={e => { if (e.key === 'Escape') setEditingTextId(null); }}
              style={{
                width: '100%',
                height: '100%',
                fontFamily: el.style.fontFamily,
                fontSize: el.style.fontSize,
                color: el.style.color,
                fontWeight: el.style.bold ? 'bold' : 'normal',
                fontStyle: el.style.italic ? 'italic' : 'normal',
                textDecoration: el.style.underline ? 'underline' : 'none',
                textAlign: el.style.align,
                border: 'none',
                outline: '2px solid #3b82f6',
                background: 'rgba(255,255,255,0.9)',
                resize: 'none',
                padding: '2px 4px',
                lineHeight: 1.3,
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                fontFamily: el.style.fontFamily,
                fontSize: el.style.fontSize,
                color: el.style.color,
                fontWeight: el.style.bold ? 'bold' : 'normal',
                fontStyle: el.style.italic ? 'italic' : 'normal',
                textDecoration: el.style.underline ? 'underline' : 'none',
                textAlign: el.style.align,
                overflow: 'hidden',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.3,
                padding: '2px 4px',
              }}
            >
              {el.content}
            </div>
          )
        ) : (
          <img
            src={el.content}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
            draggable={false}
          />
        )}

        {isSelected && !isPreview && (
          <>
            {['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'].map(dir => {
              const style: React.CSSProperties = {
                position: 'absolute',
                width: dir.length === 1 ? 8 : 10,
                height: dir.length === 1 ? 8 : 10,
                background: '#3b82f6',
                borderRadius: '50%',
                zIndex: 20,
                cursor: `${dir}-resize`,
              };
              if (dir.includes('n')) style.top = -5;
              if (dir.includes('s')) style.bottom = -5;
              if (dir === 'n' || dir === 's') { style.left = '50%'; style.transform = 'translateX(-50%)'; }
              if (dir.includes('w')) style.left = -5;
              if (dir.includes('e')) style.right = -5;
              if (dir === 'e' || dir === 'w') { style.top = '50%'; style.transform = 'translateY(-50%)'; }
              return (
                <div
                  key={dir}
                  style={style}
                  onMouseDown={(e) => handleMouseDown(e, el.id, 'resize', dir)}
                />
              );
            })}
          </>
        )}
      </div>
    );
  };

  const renderCanvas = (section: CanvasSection, elements: ReportElement[], height: number, canvasRef: React.RefObject<HTMLDivElement | null>, isPreview = false) => (
    <div
      ref={isPreview ? undefined : canvasRef}
      style={{
        width: A4_WIDTH_PX,
        height,
        position: 'relative',
        background: isPreview
          ? '#ffffff'
          : 'repeating-conic-gradient(#e5e7eb 0% 25%, #f9fafb 0% 50%) 0 0 / 20px 20px',
        border: isPreview ? 'none' : '1px solid #e2e8f0',
        overflow: 'hidden',
      }}
      onClick={isPreview ? undefined : () => { setSelectedId(null); setEditingTextId(null); }}
    >
      {elements.map(el => renderElement(el, isPreview))}
    </div>
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedId && editingTextId !== selectedId) {
        deleteSelected();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, editingTextId]);

  if (showPreview) {
    return (
      <div className="fixed inset-0 z-[9999] bg-gray-100 dark:bg-gray-900 flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <button onClick={() => setShowPreview(false)} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors">
            <ArrowLeft size={20} />
            Voltar ao Editor
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pré-visualização do Relatório</h2>
          <div />
        </div>
        <div className="flex-1 overflow-auto p-8 flex justify-center">
          <div style={{ width: A4_WIDTH_PX, background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ borderBottom: template.showSeparator ? '2px solid #e2e8f0' : 'none' }}>
              {renderCanvas('header', headerElements, headerHeight, headerCanvasRef, true)}
            </div>
            <div style={{ minHeight: 400, padding: 32, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
              Conteúdo do relatório será exibido aqui
            </div>
            <div style={{ borderTop: template.showSeparator ? '1px solid #e2e8f0' : 'none' }}>
              {renderCanvas('footer', footerElements, footerHeight, footerCanvasRef, true)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Editor de Cabeçalho e Rodapé</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">— {template.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPreview(true)} className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium">
            <Eye size={16} />
            Pré-visualizar
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
            <Save size={16} />
            Salvar
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-wrap">
        <button onClick={addTextBox} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors" title="Adicionar Caixa de Texto">
          <Type size={15} />
          Texto
        </button>
        <button onClick={addImage} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors" title="Adicionar Imagem">
          <Image size={15} />
          Imagem
        </button>
        {companyLogo && (
          <button
            onClick={() => {
              const newEl: ReportElement = {
                id: `el_${Date.now()}`,
                type: 'image',
                x: 20,
                y: 10,
                width: 80,
                height: 80,
                content: companyLogo,
                style: { ...DEFAULT_STYLE },
              };
              setCurrentElements(prev => [...prev, newEl]);
              setSelectedId(newEl.id);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded-lg transition-colors"
            title="Inserir Logo da Empresa"
          >
            <Image size={15} />
            Logo
          </button>
        )}
        {selectedId && (
          <button onClick={deleteSelected} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors" title="Excluir Selecionado">
            <Trash2 size={15} />
            Excluir
          </button>
        )}

        <div className="w-px h-7 bg-gray-200 dark:bg-gray-700 mx-1" />

        {selectedElement && selectedElement.type === 'text' && (
          <>
            <select
              value={selectedElement.style.fontFamily}
              onChange={e => updateElementStyle(selectedId!, { fontFamily: e.target.value })}
              className="px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-gray-700 dark:text-gray-200"
              style={{ fontFamily: selectedElement.style.fontFamily }}
            >
              {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
            </select>

            <select
              value={selectedElement.style.fontSize}
              onChange={e => updateElementStyle(selectedId!, { fontSize: parseInt(e.target.value) })}
              className="px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none w-16 text-gray-700 dark:text-gray-200"
            >
              {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <input
              type="color"
              value={selectedElement.style.color}
              onChange={e => updateElementStyle(selectedId!, { color: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border border-gray-200 dark:border-gray-700"
              title="Cor do Texto"
            />

            <div className="w-px h-7 bg-gray-200 dark:bg-gray-700 mx-1" />

            <button
              onClick={() => updateElementStyle(selectedId!, { bold: !selectedElement.style.bold })}
              className={`p-1.5 rounded-lg transition-colors ${selectedElement.style.bold ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              title="Negrito"
            >
              <Bold size={16} />
            </button>
            <button
              onClick={() => updateElementStyle(selectedId!, { italic: !selectedElement.style.italic })}
              className={`p-1.5 rounded-lg transition-colors ${selectedElement.style.italic ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              title="Itálico"
            >
              <Italic size={16} />
            </button>
            <button
              onClick={() => updateElementStyle(selectedId!, { underline: !selectedElement.style.underline })}
              className={`p-1.5 rounded-lg transition-colors ${selectedElement.style.underline ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              title="Sublinhado"
            >
              <Underline size={16} />
            </button>

            <div className="w-px h-7 bg-gray-200 dark:bg-gray-700 mx-1" />

            <button
              onClick={() => updateElementStyle(selectedId!, { align: 'left' })}
              className={`p-1.5 rounded-lg transition-colors ${selectedElement.style.align === 'left' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              title="Alinhar à Esquerda"
            >
              <AlignLeft size={16} />
            </button>
            <button
              onClick={() => updateElementStyle(selectedId!, { align: 'center' })}
              className={`p-1.5 rounded-lg transition-colors ${selectedElement.style.align === 'center' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              title="Centralizar"
            >
              <AlignCenter size={16} />
            </button>
            <button
              onClick={() => updateElementStyle(selectedId!, { align: 'right' })}
              className={`p-1.5 rounded-lg transition-colors ${selectedElement.style.align === 'right' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              title="Alinhar à Direita"
            >
              <AlignRight size={16} />
            </button>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          {/* Section Tabs */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setActiveSection('header'); setSelectedId(null); }}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeSection === 'header' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'}`}
            >
              Cabeçalho
            </button>
            <button
              onClick={() => { setActiveSection('footer'); setSelectedId(null); }}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeSection === 'footer' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'}`}
            >
              Rodapé
            </button>

            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Maximize2 size={14} className="text-gray-400" />
                <label className="text-sm text-gray-600 dark:text-gray-300 font-medium">Altura (px):</label>
                <input
                  type="number"
                  min={40}
                  max={400}
                  value={activeSection === 'header' ? headerHeight : footerHeight}
                  onChange={e => {
                    const v = parseInt(e.target.value) || 80;
                    if (activeSection === 'header') setHeaderHeight(v);
                    else setFooterHeight(v);
                  }}
                  className="w-20 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-gray-200"
                />
              </div>
              <input
                type="range"
                min={40}
                max={400}
                value={activeSection === 'header' ? headerHeight : footerHeight}
                onChange={e => {
                  const v = parseInt(e.target.value);
                  if (activeSection === 'header') setHeaderHeight(v);
                  else setFooterHeight(v);
                }}
                className="w-32 accent-blue-600"
              />
            </div>
          </div>

          {/* Canvas */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Move size={14} className="text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Clique para selecionar • Arraste para mover • Use as alças para redimensionar • Clique duplo no texto para editar • Delete para excluir
              </span>
            </div>
            <div className="flex justify-center overflow-auto pb-2">
              <div style={{ transform: 'scale(1)', transformOrigin: 'top center' }}>
                {renderCanvas(
                  activeSection,
                  currentElements,
                  currentHeight,
                  activeSection === 'header' ? headerCanvasRef : footerCanvasRef
                )}
              </div>
            </div>
          </div>

          {/* Element Properties (when image selected) */}
          {selectedElement && selectedElement.type === 'image' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Propriedades da Imagem</h4>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Posição X</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.x)}
                    onChange={e => updateElement(selectedId!, { x: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-gray-700 dark:text-gray-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Posição Y</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.y)}
                    onChange={e => updateElement(selectedId!, { y: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-gray-700 dark:text-gray-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Largura</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.width)}
                    onChange={e => updateElement(selectedId!, { width: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-gray-700 dark:text-gray-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Altura</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.height)}
                    onChange={e => updateElement(selectedId!, { height: parseInt(e.target.value) || 20 })}
                    className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-gray-700 dark:text-gray-200"
                  />
                </div>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/png,image/jpeg,image/svg+xml';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => updateElement(selectedId!, { content: ev.target?.result as string });
                      reader.readAsDataURL(file);
                    };
                    input.click();
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Trocar Imagem
                </button>
              </div>
            </div>
          )}

          {/* Element Properties (when text selected) */}
          {selectedElement && selectedElement.type === 'text' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Propriedades do Texto</h4>
              <div className="grid grid-cols-4 gap-4 mb-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Posição X</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.x)}
                    onChange={e => updateElement(selectedId!, { x: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-gray-700 dark:text-gray-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Posição Y</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.y)}
                    onChange={e => updateElement(selectedId!, { y: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-gray-700 dark:text-gray-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Largura</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.width)}
                    onChange={e => updateElement(selectedId!, { width: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-gray-700 dark:text-gray-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Altura</label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.height)}
                    onChange={e => updateElement(selectedId!, { height: parseInt(e.target.value) || 20 })}
                    className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-gray-700 dark:text-gray-200"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Conteúdo</label>
                <textarea
                  value={selectedElement.content}
                  onChange={e => updateElement(selectedId!, { content: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none resize-none text-gray-700 dark:text-gray-200"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
