import React from 'react';
import { Contract } from '../types';
import { Eye, Edit2, Trash2, Server, Radio } from 'lucide-react';

interface ContractTableProps {
  contracts: Contract[];
  onViewContract: (contract: Contract) => void;
  onEditContract: (contract: Contract) => void;
  onDeleteContract: (contractId: string) => void;
}

export const ContractTable: React.FC<ContractTableProps> = ({
  contracts,
  onViewContract,
  onEditContract,
  onDeleteContract,
}) => {
  if (contracts.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-sm">
        <p className="text-base font-semibold text-slate-800">No hay contratos para mostrar</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-4">Marca</th>
              <th className="py-3 px-4">Título / Servicio</th>
              <th className="py-3 px-4">Cliente Normalizado</th>
              <th className="py-3 px-4">Capacidad / Tipo</th>
              <th className="py-3 px-4 text-right">Monto Total</th>
              <th className="py-3 px-4">Vencimiento</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {contracts.map((contract) => {
              const isVigente = contract.status === 'vigente';
              const isExpirado = contract.status === 'vencido';

              return (
                <tr key={contract.id} className="hover:bg-slate-50/80 transition">
                  {/* Brand */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                        contract.brand === 'datared'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {contract.brand === 'datared' ? 'DataRed' : 'RED'}
                    </span>
                  </td>

                  {/* Title & Service */}
                  <td className="py-3 px-4 max-w-xs">
                    <p
                      onClick={() => onViewContract(contract)}
                      className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer truncate"
                    >
                      {contract.title}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {contract.service_name || contract.summary || '-'}
                    </p>
                  </td>

                  {/* Client */}
                  <td className="py-3 px-4 font-semibold text-slate-800 max-w-[180px] truncate">
                    {contract.client_name}
                  </td>

                  {/* Capacity */}
                  <td className="py-3 px-4">
                    {contract.service_category === 'colocation' && contract.units_quantity && (
                      <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 inline-flex items-center gap-1 font-semibold">
                        <Server className="w-3 h-3 text-indigo-600" />
                        {contract.units_quantity} U's
                      </span>
                    )}
                    {contract.service_category === 'radiocomunicacion' && contract.units_quantity && (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-flex items-center gap-1 font-semibold">
                        <Radio className="w-3 h-3 text-emerald-600" />
                        {contract.units_quantity} Radios
                      </span>
                    )}
                    {contract.service_category === 'conectividad' && contract.bandwidth_mbps && (
                      <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                        📶 {contract.bandwidth_mbps} Mbps
                      </span>
                    )}
                    {(!contract.units_quantity && !contract.bandwidth_mbps) && (
                      <span className="text-slate-400 font-mono">-</span>
                    )}
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                    ${(contract.contract_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>

                  {/* End Date */}
                  <td className="py-3 px-4 font-medium text-slate-700">
                    {contract.end_date || '-'}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block ${
                        isVigente
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : isExpirado
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                      }`}
                    >
                      {contract.status.toUpperCase()}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
