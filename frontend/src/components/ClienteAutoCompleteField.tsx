import React, { useState, useRef, useEffect } from 'react';
import { User, Check, ChevronsUpDown, Search, X } from 'lucide-react';

interface Cliente {
  id: string;
  nome: string;
  apelido?: string;
}

interface ClienteAutocompleteProps {
  clientes: Cliente[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const ClienteAutoCompleteField: React.FC<ClienteAutocompleteProps> = ({
  clientes,
  value,
  onChange,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedCliente = clientes.find((c) => c.id === value);

  // Fecha o menu suspenso ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtra clientes pelo nome ou apelido
  const filteredClientes = clientes.filter((c) => {
    const term = searchTerm.toLowerCase();
    const nomeMatch = c.nome.toLowerCase().includes(term);
    const apelidoMatch = c.apelido ? c.apelido.toLowerCase().includes(term) : false;
    return nomeMatch || apelidoMatch;
  });

  const handleSelect = (clienteId: string) => {
    onChange(clienteId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {/* Input / Botão de Seleção Principal */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full pl-3 pr-8 py-2 bg-slate-50 border ${
          error ? 'border-rose-500' : 'border-slate-300'
        } rounded-lg text-xs text-slate-900 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 cursor-pointer flex items-center justify-between min-h-[38px] transition-all`}
      >
        <span className="truncate">
          {selectedCliente ? (
            <span className="font-medium text-slate-800">
              {selectedCliente.nome}{' '}
              {selectedCliente.apelido && (
                <span className="text-slate-500 text-[11px] font-normal">
                  ({selectedCliente.apelido})
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-400">Selecione ou digite o cliente...</span>
          )}
        </span>

        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
          {selectedCliente && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Menu Dropdown Suspenso com Campo de Busca */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col animate-in fade-in-50 duration-100">
          <div className="p-2 border-b border-slate-100 relative bg-slate-50">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Digite o nome ou apelido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div className="overflow-y-auto max-h-48 py-1">
            {filteredClientes.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 text-center italic">
                Nenhum cliente encontrado
              </div>
            ) : (
              filteredClientes.map((c) => {
                const isSelected = c.id === value;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelect(c.id)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-orange-50 text-orange-900 font-semibold'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {c.nome} {c.apelido ? `(${c.apelido})` : ''}
                      </span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
