import React, { useState } from 'react';
import { Contract } from '../types';
import { X, Calendar, DollarSign, Server, Radio, Save, ShieldCheck, FileText, Building, Sparkles } from 'lucide-react';

interface ContractDetailModalProps {
  contract: Contract | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedContract: Contract) => void;
}

export const ContractDetailModal: React.FC<ContractDetailModalProps> = ({
  contract,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !contract) return null;

  const [form, setForm] = useState<Contract>({ ...contract });

  const handleChange = (field: keyof Contract, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Detalles del Contrato
              </h2>
              <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-md">
                {form.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* Title */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              Título del Contrato *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Client & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Cliente Normalizado
              </label>
              <input
                type="text"
                required
                value={form.client_name}
                onChange={(e) => handleChange('client_name', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Marca / Empresa
              </label>
              <select
                value={form.brand}
                onChange={(e) => handleChange('brand', e.target.value as 'datared' | 'red')}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="datared">DataRed</option>
                <option value="red">RED</option>
              </select>
            </div>
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Categoría de Servicio
              </label>
              <select
                value={form.service_category}
                onChange={(e) => handleChange('service_category', e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="colocation">🗄️ Colocation (Rack U's)</option>
                <option value="conectividad">📶 Conectividad (Mbps)</option>
                <option value="radiocomunicacion">📻 Radiocomunicación (RED)</option>
                <option value="otro">📄 Custodia / Otro</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Estado del Contrato
              </label>
              <select
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="vigente">🟢 Vigente</option>
                <option value="en_revision">🟡 En Revisión</option>
                <option value="vencido">🔴 Vencido</option>
                <option value="cancelado">⚪ Cancelado</option>
              </select>
            </div>
          </div>

          {/* Quantities / Mbps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Cantidad (U's / Radios)
              </label>
              <input
                type="number"
                value={form.units_quantity ?? ''}
                onChange={(e) => handleChange('units_quantity', parseFloat(e.target.value) || null)}
                placeholder="Ej: 7, 35, 1"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Ancho de Banda (Mbps)
              </label>
              <input
                type="number"
                value={form.bandwidth_mbps ?? ''}
                onChange={(e) => handleChange('bandwidth_mbps', parseFloat(e.target.value) || null)}
                placeholder="Ej: 10, 15, 100"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Pricing & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Cuota Mensual ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.monthly_fee ?? ''}
                onChange={(e) => handleChange('monthly_fee', parseFloat(e.target.value) || null)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Monto Total ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.contract_value ?? ''}
                onChange={(e) => handleChange('contract_value', parseFloat(e.target.value) || null)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-emerald-700 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Plazo (Meses)
              </label>
              <input
                type="number"
                value={form.duration_months ?? ''}
                onChange={(e) => handleChange('duration_months', parseInt(e.target.value, 10) || null)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Fecha de Inicio
              </label>
              <input
                type="date"
                value={form.start_date || ''}
                onChange={(e) => handleChange('start_date', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                value={form.end_date || ''}
                onChange={(e) => handleChange('end_date', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              Resumen del Contrato
            </label>
            <textarea
              rows={3}
              value={form.summary || ''}
              onChange={(e) => handleChange('summary', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Key Terms & SLA */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              Términos Clave & SLA
            </label>
            <textarea
              rows={3}
              value={form.key_terms || ''}
              onChange={(e) => handleChange('key_terms', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
            >
              <Save className="w-4 h-4" />
              Guardar Cambios
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
