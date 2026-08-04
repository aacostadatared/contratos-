import React, { useState } from 'react';
import { Contract } from '../types';
import { Folder, FolderOpen, ChevronDown, ChevronRight, Calendar, Eye, Edit2, Trash2, Server, Radio } from 'lucide-react';

interface FolderViewProps {
  contracts: Contract[];
  onViewContract: (contract: Contract) => void;
  onEditContract: (contract: Contract) => void;
  onDeleteContract: (contractId: string) => void;
}

export const FolderView: React.FC<FolderViewProps> = ({
  contracts,
  onViewContract,
  onEditContract,
  onDeleteContract,
}) => {
  // Group contracts by normalized client name
  const groupedContracts = React.useMemo(() => {
    const groups: { [clientName: string]: Contract[] } = {};

    contracts.forEach((contract) => {
      const name = contract.client_name || 'Sin Cliente Asignado';
      if (!groups[name]) {
        groups[name] = [];
      }
      groups[name].push(contract);
    });

    return groups;
  }, [contracts]);

  // Keep track of open folders
  const [openFolders, setOpenFolders] = useState<{ [clientName: string]: boolean }>(
    Object.keys(groupedContracts).reduce((acc, name) => ({ ...acc, [name]: true }), {})
  );

  const toggleFolder = (clientName: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [clientName]: !prev[clientName],
    }));
  };

  const clientNames = Object.keys(groupedContracts).sort();

  if (clientNames.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-sm">
        <Folder className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
        <p className="text-base font-semibold text-slate-800">No se encontraron carpetas de clientes</p>
        <p className="text-xs text-slate-500 mt-1">Prueba con otros términos de búsqueda o filtros.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {clientNames.map((clientName) => {
        const clientContracts = groupedContracts[clientName];
        const isOpen = !!openFolders[clientName];

        const totalValue = clientContracts.reduce((sum, c) => sum + (c.contract_value || 0), 0);
        
        const hasDataRed = clientContracts.some((c) => c.brand === 'datared');
        const hasRed = clientContracts.some((c) => c.brand === 'red');

        // Extract any distinct raw names / aliases used in these contracts
        const rawAliases = Array.from(
          new Set(clientContracts.map((c) => c.raw_client_name).filter(Boolean) as string[])
        );

        return (
          <div
            key={clientName}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition hover:border-slate-300"
          >
            {/* Folder Header Banner */}
            <div
              onClick={() => toggleFolder(clientName)}
              className="p-4 bg-white hover:bg-slate-50 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none border-b border-slate-100"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <button className="text-indigo-600 hover:text-indigo-700 transition">
                  {isOpen ? (
                    <FolderOpen className="w-7 h-7 text-indigo-600 shrink-0" />
                  ) : (
                    <Folder className="w-7 h-7 text-indigo-500 shrink-0" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-slate-900 tracking-tight truncate">
                      {clientName}
                    </h2>
                    <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-indigo-100 shrink-0">
                      {clientContracts.length} {clientContracts.length === 1 ? 'contrato' : 'contratos'}
                    </span>
                  </div>

                  {/* Known aliases tag */}
                  {rawAliases.length > 0 && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      Alias reconocidos: {rawAliases.join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Client Metrics & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                
                {/* Brand badges */}
                <div className="flex items-center gap-1.5">
                  {hasDataRed && (
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      DataRed
                    </span>
                  )}
                  {hasRed && (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      RED
                    </span>
                  )}
                </div>

                {/* Total Value for this folder */}
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Cliente</p>
                  <p className="text-sm font-bold text-emerald-600 font-mono">
                    ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="text-slate-400">
                  {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </div>
            </div>

            {/* Expanded Folder Content (Contracts List inside Client Folder) */}
            {isOpen && (
              <div className="p-3.5 bg-slate-50/60 space-y-3">
                {clientContracts.map((contract) => {
                  const isVigente = contract.status === 'vigente';
                  const isExpirado = contract.status === 'vencido';

                  return (
                    <div
                      key={contract.id}
                      className="bg-white border border-slate-200 hover:border-indigo-300 rounded-lg p-3.5 transition shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      {/* Contract Core Info */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              contract.brand === 'datared' ? 'bg-indigo-600' : 'bg-emerald-600'
                            }`}
                            title={contract.brand === 'datared' ? 'Marca DataRed' : 'Marca RED'}
                          />
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {contract.title}
                          </h3>

                          {/* Status badge */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isVigente
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : isExpirado
                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                : 'bg-amber-50 border-amber-200 text-amber-700'
                            }`}
                          >
                            {contract.status.toUpperCase()}
                          </span>

                          {/* Service Capacity badge */}
                          {contract.service_category === 'colocation' && contract.units_quantity && (
                            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
                              <Server className="w-3 h-3 text-indigo-600" />
                              {contract.units_quantity} U's Rack
                            </span>
                          )}
                          {contract.service_category === 'radiocomunicacion' && contract.units_quantity && (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                              <Radio className="w-3 h-3 text-emerald-600" />
                              {contract.units_quantity} Radios
                            </span>
                          )}
                          {contract.service_category === 'conectividad' && contract.bandwidth_mbps && (
                            <span className="bg-amber-50 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-200">
                              📶 {contract.bandwidth_mbps} Mbps
                            </span>
                          )}
                        </div>

                        {/* Summary & Service details */}
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {contract.summary || contract.service_name || 'Sin resumen registrado'}
                        </p>

                        {/* Date and duration row */}
                        <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Inicio: <strong className="text-slate-800">{contract.start_date || '-'}</strong>
                          </span>
                          <span>
                            Vence: <strong className={isExpirado ? 'text-rose-600 font-bold' : 'text-slate-800'}>{contract.end_date || '-'}</strong>
                          </span>
                          {contract.duration_months && (
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                              Plazo: {contract.duration_months} meses
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amounts & Action buttons */}
                      <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-900 font-mono">
                            ${(contract.contract_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                          {contract.monthly_fee && (
                            <p className="text-[10px] text-slate-500">
                              ${contract.monthly_fee.toLocaleString('en-US')}/mes
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onViewContract(contract)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditContract(contract)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                            title="Editar contrato"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteContract(contract.id)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

