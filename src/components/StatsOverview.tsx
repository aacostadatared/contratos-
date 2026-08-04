import React from 'react';
import { Contract } from '../types';
import { ShieldCheck, AlertTriangle, DollarSign, Radio, Server, Layers } from 'lucide-react';

interface StatsOverviewProps {
  contracts: Contract[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ contracts }) => {
  const totalCount = contracts.length;
  const activeCount = contracts.filter(c => c.status === 'vigente').length;
  
  const today = new Date().toISOString().split('T')[0];
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  const in30DaysStr = in30Days.toISOString().split('T')[0];

  const expiringSoon = contracts.filter(
    c => c.status === 'vigente' && c.end_date && c.end_date >= today && c.end_date <= in30DaysStr
  );

  const totalValue = contracts.reduce((acc, c) => acc + (c.contract_value || 0), 0);
  const monthlyTotal = contracts.reduce((acc, c) => acc + (c.monthly_fee || 0), 0);

  const dataRedCount = contracts.filter(c => c.brand === 'datared').length;
  const redCount = contracts.filter(c => c.brand === 'red').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* Total Active Contracts */}
      <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Contratos Activos</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{activeCount}</span>
            <span className="text-xs text-slate-500 font-medium">/ {totalCount} totales</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px]">
            <span className="text-indigo-600 font-semibold">{dataRedCount} DataRed</span>
            <span className="text-slate-300">·</span>
            <span className="text-emerald-600 font-semibold">{redCount} RED</span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      {/* Valor Total Contratado */}
      <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Valor Contratado Total</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-emerald-600 tracking-tight font-mono">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Ingreso recurrente: <strong className="text-slate-800">${monthlyTotal.toLocaleString('en-US')}/mes</strong>
          </p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
          <DollarSign className="w-5 h-5" />
        </div>
      </div>

      {/* Próximos a Vencer */}
      <div className={`border rounded-xl p-4.5 flex items-center justify-between shadow-sm transition ${
        expiringSoon.length > 0
          ? 'bg-amber-50/80 border-amber-200'
          : 'bg-white border-slate-200'
      }`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Próximos a Vencer (30 días)</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold tracking-tight ${
              expiringSoon.length > 0 ? 'text-amber-700' : 'text-slate-900'
            }`}>
              {expiringSoon.length}
            </span>
            <span className="text-xs text-slate-500">requieren revisión</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {expiringSoon.length > 0 ? 'Atención prioritaria para renovación' : 'Sin contratos por vencer este mes'}
          </p>
        </div>
        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${
          expiringSoon.length > 0
            ? 'bg-amber-100 border-amber-200 text-amber-700'
            : 'bg-slate-50 border-slate-200 text-slate-400'
        }`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      {/* Servicios por Marca */}
      <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Capacidad & Equipos</p>
          <div className="flex items-center gap-2.5 mt-2">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <Server className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">
                {contracts.reduce((acc, c) => acc + (c.service_category === 'colocation' ? (c.units_quantity || 0) : 0), 0)} U's
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <Radio className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">
                {contracts.reduce((acc, c) => acc + (c.service_category === 'radiocomunicacion' ? (c.units_quantity || 0) : 0), 0)} Radios
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">U's de Rack y Terminales activas</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
          <Layers className="w-5 h-5" />
        </div>
      </div>

    </div>
  );
};

