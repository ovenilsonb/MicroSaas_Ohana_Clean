import { useState, useEffect, useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Highlighter, 
  List, 
  Type, 
  Trash2,
  Plus,
  StickyNote,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

const TEXT_COLORS = [
  { label: 'Preto', value: '#000000' },
  { label: 'Cinza Escuro', value: '#4B5563' },
  { label: 'Cinza Claro', value: '#9CA3AF' },
  { label: 'Branco', value: '#FFFFFF' },
  { label: 'Vermelho', value: '#EF4444' },
  { label: 'Laranja', value: '#F97316' },
  { label: 'Amarelo', value: '#EAB308' },
  { label: 'Verde', value: '#22C55E' },
  { label: 'Azul', value: '#3B82F6' },
  { label: 'Roxo', value: '#A855F7' },
  { label: 'Rosa', value: '#EC4899' },
];

const HIGHLIGHT_COLORS = [
  { label: 'Transparente', value: 'transparent' },
  { label: 'Amarelo', value: '#FEF08A' },
  { label: 'Verde', value: '#BBF7D0' },
  { label: 'Azul', value: '#BFDBFE' },
  { label: 'Rosa', value: '#FBCFE8' },
  { label: 'Roxo', value: '#E9D5FF' },
  { label: 'Laranja', value: '#FED7AA' },
  { label: 'Cinza', value: '#E5E7EB' },
];

function ColorMenu({ icon: Icon, title, colors, onSelect }: { icon: any, title: string, colors: {label: string, value: string}[], onSelect: (color: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-1" 
        title={title}
      >
        <Icon size={18} />
        <ChevronDown size={12} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10 w-48 grid grid-cols-4 gap-2">
          {colors.map(c => (
            <button
              key={c.value}
              onClick={() => {
                onSelect(c.value);
                setIsOpen(false);
              }}
              className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:scale-110 transition-transform"
              style={{ backgroundColor: c.value }}
              title={c.label}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Anotacoes() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('ohana_notes');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeNoteId, setActiveNoteId] = useState<string | null>(
    notes.length > 0 ? notes[0].id : null
  );

  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list');

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('ohana_notes', JSON.stringify(notes));
  }, [notes]);

  const activeNote = notes.find(n => n.id === activeNoteId);
  const isUpdatingRef = useRef(false);

  // Update editor content only when active note changes
  useEffect(() => {
    if (editorRef.current && activeNote && !isUpdatingRef.current) {
      if (editorRef.current.innerHTML !== activeNote.content) {
        editorRef.current.innerHTML = activeNote.content;
      }
    }
  }, [activeNoteId, activeNote?.content]);

  const handleCreateNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Nova Anotação',
      content: '',
      updatedAt: new Date().toISOString()
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    setMobileView('editor');
  };

  const handleDeleteNote = (id: string) => {
    const newNotes = notes.filter(n => n.id !== id);
    setNotes(newNotes);
    if (activeNoteId === id) {
      setActiveNoteId(newNotes.length > 0 ? newNotes[0].id : null);
    }
  };

  const handleUpdateNote = (field: 'title' | 'content', value: string) => {
    if (!activeNoteId) return;
    
    if (field === 'content') {
      isUpdatingRef.current = true;
    }

    setNotes(notes.map(note => 
      note.id === activeNoteId 
        ? { ...note, [field]: value, updatedAt: new Date().toISOString() }
        : note
    ));

    if (field === 'content') {
      // Reset after a short delay to allow React to process the state update
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    
    // Update the content state after formatting
    const editor = document.getElementById('editor');
    if (editor) {
      handleUpdateNote('content', editor.innerHTML);
    }
  };

  return (
    <div className="h-[calc(100vh-10rem)] lg:h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4 lg:gap-6">
      {/* Sidebar de Anotações */}
      <div className={`w-full lg:w-64 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50 flex flex-col shadow-sm ${
        mobileView === 'editor' ? 'hidden lg:flex' : 'flex'
      }`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700/50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900 dark:text-white">Anotações</h2>
          <button 
            onClick={handleCreateNote}
            className="p-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {notes.length === 0 ? (
            <div className="text-center p-4 text-gray-500 dark:text-gray-400 text-sm">
              Nenhuma anotação criada.
            </div>
          ) : (
            notes.map(note => (
              <div 
                key={note.id}
                onClick={() => {
                  setActiveNoteId(note.id);
                  setMobileView('editor');
                }}
                className={`p-3 rounded-xl cursor-pointer transition-colors group flex justify-between items-start ${
                  activeNoteId === note.id 
                    ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/30 border border-transparent'
                }`}
              >
                <div className="overflow-hidden">
                  <h3 className={`font-medium truncate ${
                    activeNoteId === note.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {note.title || 'Sem título'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {new Date(note.updatedAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNote(note.id);
                  }}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className={`flex-1 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50 flex flex-col shadow-sm overflow-hidden ${
        mobileView === 'list' ? 'hidden lg:flex' : 'flex'
      }`}>
        {activeNote ? (
          <>
            {/* Toolbar */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700/50 flex flex-wrap gap-1 bg-gray-50 dark:bg-gray-800/80">
              {/* Mobile Back Button */}
              <button 
                onClick={() => setMobileView('list')}
                className="lg:hidden p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors mr-1"
                title="Voltar"
              >
                <ArrowLeft size={18} />
              </button>

              <select 
                onChange={(e) => execCommand('fontName', e.target.value)}
                className="px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 outline-none"
              >
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
              </select>
              
              <select 
                onChange={(e) => execCommand('fontSize', e.target.value)}
                className="px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 outline-none"
              >
                <option value="1">Pequeno</option>
                <option value="3">Normal</option>
                <option value="5">Grande</option>
                <option value="7">Muito Grande</option>
              </select>

              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 self-center"></div>

              <button onClick={() => execCommand('bold')} className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors" title="Negrito">
                <Bold size={18} />
              </button>
              <button onClick={() => execCommand('italic')} className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors" title="Itálico">
                <Italic size={18} />
              </button>
              <button onClick={() => execCommand('underline')} className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors" title="Sublinhado">
                <Underline size={18} />
              </button>
              
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 self-center"></div>

              <button onClick={() => execCommand('insertUnorderedList')} className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors" title="Marcadores">
                <List size={18} />
              </button>
              
              <ColorMenu 
                icon={Type} 
                title="Cor do Texto" 
                colors={TEXT_COLORS} 
                onSelect={(color) => execCommand('foreColor', color)} 
              />

              <ColorMenu 
                icon={Highlighter} 
                title="Marcador de Texto" 
                colors={HIGHLIGHT_COLORS} 
                onSelect={(color) => execCommand('hiliteColor', color)} 
              />
            </div>

            {/* Title Input */}
            <input
              type="text"
              value={activeNote.title}
              onChange={(e) => handleUpdateNote('title', e.target.value)}
              placeholder="Título da anotação..."
              className="w-full px-6 py-4 text-2xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />

            {/* Content Editor */}
            <div 
              id="editor"
              ref={editorRef}
              contentEditable
              onInput={(e) => handleUpdateNote('content', e.currentTarget.innerHTML)}
              onBlur={(e) => handleUpdateNote('content', e.currentTarget.innerHTML)}
              className="flex-1 px-6 pb-6 outline-none text-gray-800 dark:text-gray-200 overflow-y-auto prose dark:prose-invert max-w-none"
              style={{ minHeight: '200px' }}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <StickyNote size={48} className="mb-4 opacity-50" />
            <p>Selecione uma anotação ou crie uma nova.</p>
          </div>
        )}
      </div>
    </div>
  );
}
