import React from 'react';
import { Contract } from '../types';
import { Eye, Edit2, Trash2, Server, Radio } from 'lucide-react';

interface ContractCardsProps {
  contracts: Contract[];
  onViewContract: (contract: Contract) => void;
  onEditContract: (contract: Contract) => void;
  onDeleteContract: (contractId: string) => void;
}

export const ContractCards: React.FC<ContractCardsProps> = ({
  contracts,
  onViewContract,
  onEditContract,
  onDeleteContract,
}) => {
  if (contracts.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-sm">
        <p className="text-base font-semibold text-slate-800">No hay contratos para mostrar</p>
        <p className="text-xs text-slate-500 mt-1">Intenta ajustar la búsqueda o los filtros seleccionados.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {contracts.map((contract) => {
        const isVigente = contract.status === 'vigente';
        const isExpirado = contract.status === 'vencido';

        return (
          <div
            key={contract.id}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4.5 flex flex-col justify-between transition shadow-sm hover:shadow-md"
          >
            <div>
              {/* Top Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                      contract.brand === 'datared'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {contract.brand === 'datared' ? 'DataRed' : 'RED'}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 truncate max-w-[140px]">
                    {contract.client_name}
                  </span>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    isVigente
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : isExpirado
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}
                >
                  {contract.status.toUpperCase()}
                </span>
              </div>

              {/* Title */}
              <h3
                onClick={() => onViewContract(contract)}
                className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition cursor-pointer line-clamp-2 mb-2"
              >
                {contract.title}
              </h3>

              {/* Service & Capacity details */}
              <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                {contract.summary || contract.service_name || 'Sin descripción'}
              </p>

              {/* Specific Category Badges */}
              <div className="flex flex-wrap gap-1.5 mb-3 text-[11px]">
                {contract.service_category === 'colocation' && contract.units_quantity && (
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1 font-medium">
                    <Server className="w-3 h-3 text-indigo-600" />
                    {contract.units_quantity} U's Rack
                  </span>
                )}
                {contract.service_category === 'radiocomunicacion' && contract.units_quantity && (
                  <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1 font-medium">
                    <Radio className="w-3 h-3 text-emerald-600" />
                    {contract.units_quantity} Terminales
                  </span>
                )}
                {contract.service_category === 'conectividad' && contract.bandwidth_mbps && (
                  <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 font-medium">
                    📶 {contract.bandwidth_mbps} Mbps
                  </span>
                )}
              </div>

              {/* Dates */}
              <div className="bg-slate-50 rounded-lg p-2.5 space-y-1 text-[11px] border border-slate-200 mb-3">
                <div className="flex justify-between text-slate-500">
                  <span>Inicio:</span>
                  <span className="text-slate-800 font-semibold">{contract.start_date || '-'}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Vencimiento:</span>
                  <span className={`font-semibold ${isExpirado ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                    {contract.end_date || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Footer & Pricing */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Monto Total</p>
                <p className="text-sm font-extrabold text-emerald-600 font-mono">
                  ${(contract.contract_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onViewContract(contract)}
                  className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition"
                  title="Ver detalles"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onEditContract(contract)}
                  className="p-1.5 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md transition"
                  title="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteContract(contract.id)}
                  className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-md transition"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
};

