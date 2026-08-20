import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Heading3, Eraser, Code, Eye } from 'lucide-react';
import { sanitizeHtml } from '../utils/sanitizeHtml';

interface RichTextEditorProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = 'Escreva seu texto formatado aqui...',
  disabled = false
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showCode, setShowCode] = useState(false);
  const [rawHtml, setRawHtml] = useState(value || '');

  // Keep internal state synced with external value prop
  useEffect(() => {
    setRawHtml(value || '');
    if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const execCommand = (command: string, arg: string | undefined = undefined) => {
    if (disabled) return;
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setRawHtml(html);
      onChange(html);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setRawHtml(html);
      onChange(html);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newHtml = e.target.value;
    setRawHtml(newHtml);
    onChange(newHtml);
    if (editorRef.current) {
      editorRef.current.innerHTML = newHtml;
    }
  };

  return (
    <div className="space-y-1.5" id={id ? `${id}-container` : undefined}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          {label}
        </label>
      )}

      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-all">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-1 p-2 bg-slate-100 border-b border-slate-200 text-slate-700 text-xs">
          <div className="flex items-center flex-wrap gap-1">
            <button
              type="button"
              onClick={() => execCommand('bold')}
              disabled={disabled || showCode}
              title="Negrito (Ctrl+B)"
              className="p-1.5 hover:bg-slate-200 rounded text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCommand('italic')}
              disabled={disabled || showCode}
              title="Itálico (Ctrl+I)"
              className="p-1.5 hover:bg-slate-200 rounded text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCommand('underline')}
              disabled={disabled || showCode}
              title="Sublinhado (Ctrl+U)"
              className="p-1.5 hover:bg-slate-200 rounded text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-300 mx-1" />

            <button
              type="button"
              onClick={() => execCommand('insertUnorderedList')}
              disabled={disabled || showCode}
              title="Lista com Marcadores"
              className="p-1.5 hover:bg-slate-200 rounded text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCommand('insertOrderedList')}
              disabled={disabled || showCode}
              title="Lista Numerada"
              className="p-1.5 hover:bg-slate-200 rounded text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-300 mx-1" />

            <button
              type="button"
              onClick={() => execCommand('formatBlock', '<h3>')}
              disabled={disabled || showCode}
              title="Título de Seção (H3)"
              className="p-1.5 hover:bg-slate-200 rounded text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Heading3 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => execCommand('removeFormat')}
              disabled={disabled || showCode}
              title="Remover Formatação"
              className="p-1.5 hover:bg-slate-200 rounded text-slate-700 hover:text-rose-600 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowCode(!showCode)}
            className="p-1.5 hover:bg-slate-200 rounded text-slate-600 font-mono text-[10px] flex items-center gap-1 cursor-pointer"
            title={showCode ? 'Ver Editor Visual' : 'Ver Código HTML'}
          >
            {showCode ? (
              <>
                <Eye className="w-3.5 h-3.5 text-orange-600" />
                <span className="font-semibold text-slate-800">Visual</span>
              </>
            ) : (
              <>
                <Code className="w-3.5 h-3.5 text-slate-600" />
                <span className="font-medium text-slate-600">HTML</span>
              </>
            )}
          </button>
        </div>

        {/* Editor Body */}
        {showCode ? (
          <textarea
            id={id}
            value={rawHtml}
            onChange={handleCodeChange}
            rows={5}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full p-3 font-mono text-xs text-slate-800 bg-slate-50 focus:outline-none resize-y"
          />
        ) : (
          <div
            ref={editorRef}
            id={id}
            contentEditable={!disabled}
            onInput={handleInput}
            onBlur={handleInput}
            suppressContentEditableWarning
            className="w-full min-h-[110px] p-3 text-xs text-slate-900 bg-white focus:outline-none overflow-y-auto prose prose-slate prose-xs max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:mb-1"
            data-placeholder={placeholder}
          />
        )}
      </div>
    </div>
  );
};
