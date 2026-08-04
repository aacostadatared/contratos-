import React from 'react';
import { Upload, FolderKanban, Users, Search, LayoutGrid, Table } from 'lucide-react';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedBrand: 'all' | 'datared' | 'red';
  onBrandChange: (brand: 'all' | 'datared' | 'red') => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  viewMode: 'folders' | 'cards' | 'table';
  onViewModeChange: (mode: 'folders' | 'cards' | 'table') => void;
  onOpenBatchUpload: () => void;
  onOpenClientManager: () => void;
  totalContractsCount: number;
}

export const LOGO_DATARED = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=120&q=80';
export const LOGO_RED = 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=120&q=80';

export const Header: React.FC<HeaderProps> = ({
  searchTerm,
  onSearchChange,
  selectedBrand,
  onBrandChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  viewMode,
  onViewModeChange,
  onOpenBatchUpload,
  onOpenClientManager,
  totalContractsCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 text-slate-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-1 overflow-hidden">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                  DR
                </div>
                <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-xs shadow-sm border border-white">
                  RED
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  Contratos Intelfon
                  <span className="bg-indigo-50 text-indigo-700 text-[11px] px-2 py-0.5 rounded-md font-semibold border border-indigo-200/80">
                    DataRed & RED
                  </span>
                </h1>
                <p className="text-xs text-slate-500">
                  {totalContractsCount} contratos registrados · Búsqueda en tiempo real
                </p>
              </div>
            </div>

            {/* Action Buttons (Mobile) */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={onOpenBatchUpload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                Subir
              </button>
            </div>
          </div>

          {/* Action Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-2.5">
            <button
              onClick={onOpenClientManager}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold transition shadow-sm"
              title="Gestión de Clientes y Aliases"
            >
              <Users className="w-4 h-4 text-indigo-600" />
              Gestión de Clientes
            </button>

            <button
              onClick={onOpenBatchUpload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm hover:shadow active:scale-95"
            >
              <Upload className="w-4 h-4" />
              Subir Múltiples PDFs
              <span className="bg-indigo-700/80 text-indigo-100 text-[10px] px-1.5 py-0.5 rounded font-mono">
                Lote
              </span>
            </button>
          </div>
        </div>

        {/* Search, Filter Bar and View Toggles */}
        <div className="mt-3.5 pt-3 border-t border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Character-by-Character Search Input */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar cliente o contrato (ej: Bandesal, Telecom)..."
              className="w-full pl-9 pr-8 py-2 bg-slate-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-lg text-sm text-slate-900 placeholder-slate-400 transition outline-none"
              autoComplete="off"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5 rounded hover:bg-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters & Brands */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            
            {/* Brand Filter Chips */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => onBrandChange('all')}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  selectedBrand === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas las Marcas
              </button>
              <button
                onClick={() => onBrandChange('datared')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition ${
                  selectedBrand === 'datared'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                <span className={`w-2 h-2 rounded-full inline-block ${selectedBrand === 'datared' ? 'bg-white' : 'bg-indigo-500'}`}></span>
                DataRed
              </button>
              <button
                onClick={() => onBrandChange('red')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition ${
                  selectedBrand === 'red'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-emerald-600'
                }`}
              >
                <span className={`w-2 h-2 rounded-full inline-block ${selectedBrand === 'red' ? 'bg-white' : 'bg-emerald-500'}`}></span>
                RED
              </button>
            </div>

            {/* Category Filter Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
            >
              <option value="all">Todas las Categorías</option>
              <option value="colocation">🗄️ Colocation (U's Rack)</option>
              <option value="conectividad">📶 Conectividad (Mbps)</option>
              <option value="radiocomunicacion">📻 Radiocomunicación (RED)</option>
              <option value="otro">📄 Custodia / Otros</option>
            </select>

            {/* Status Filter Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
            >
              <option value="all">Todos los Estados</option>
              <option value="vigente">🟢 Vigente</option>
              <option value="en_revision">🟡 En Revisión</option>
              <option value="vencido">🔴 Vencido</option>
              <option value="cancelado">⚪ Cancelado</option>
            </select>

            {/* View Mode Toggle Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 ml-auto">
              <button
                onClick={() => onViewModeChange('folders')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${
                  viewMode === 'folders'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vista de Carpetas por Cliente"
              >
                <FolderKanban className="w-3.5 h-3.5" />
                Carpetas
              </button>
              <button
                onClick={() => onViewModeChange('cards')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${
                  viewMode === 'cards'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vista de Tarjetas"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Tarjetas
              </button>
              <button
                onClick={() => onViewModeChange('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vista de Tabla"
              >
                <Table className="w-3.5 h-3.5" />
                Tabla
              </button>
            </div>

          </div>
        </div>

      </div>
    </header>
  );
};

