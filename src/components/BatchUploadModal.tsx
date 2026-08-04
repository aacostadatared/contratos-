import React, { useState, useRef } from 'react';
import { Contract, ExtractionResult } from '../types';
import { extractTextFromFile, analyzeContractText } from '../utils/aiExtractor';
import { Upload, FileText, CheckCircle2, AlertCircle, Sparkles, X, Loader2, Save, Trash2, Calendar, DollarSign, Building } from 'lucide-react';

interface BatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBatch: (contracts: Omit<Contract, 'id' | 'created_at'>[]) => void;
}

interface BatchFileItem {
  id: string;
  file: File;
  status: 'pending' | 'extracting' | 'analyzed' | 'error';
  progressMsg?: string;
  errorMsg?: string;
  extraction?: ExtractionResult;
  // User editable overrides before saving
  title: string;
  client_name: string;
  brand: 'datared' | 'red';
  service_category: 'radiocomunicacion' | 'colocation' | 'conectividad' | 'otro';
  monthly_fee?: number | null;
  contract_value?: number | null;
  duration_months?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  summary?: string | null;
  key_terms?: string | null;
}

export const BatchUploadModal: React.FC<BatchUploadModalProps> = ({
  isOpen,
  onClose,
  onSaveBatch,
}) => {
  const [fileItems, setFileItems] = useState<BatchFileItem[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: BatchFileItem[] = Array.from(files).map((file, idx) => ({
      id: `file-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
      file,
      status: 'pending',
      progressMsg: 'En cola para análisis',
      title: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      client_name: '',
      brand: 'datared',
      service_category: 'colocation',
    }));

    setFileItems((prev) => [...prev, ...newItems]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFilesSelected(e.dataTransfer.files);
  };

  const removeItem = (id: string) => {
    setFileItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Start processing files in queue
  const processBatch = async () => {
    setIsProcessingBatch(true);

    for (let i = 0; i < fileItems.length; i++) {
      const item = fileItems[i];
      if (item.status === 'analyzed') continue; // skip already analyzed

      setFileItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: 'extracting', progressMsg: 'Iniciando lectura de documento...' } : it))
      );

      try {
        const text = await extractTextFromFile(item.file, (msg) => {
          setFileItems((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, progressMsg: msg } : it))
          );
        });

        const extraction = await analyzeContractText(text, item.file.name, (msg) => {
          setFileItems((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, progressMsg: msg } : it))
          );
        });

        setFileItems((prev) =>
          prev.map((it) => {
            if (it.id !== item.id) return it;
            const derivedClient = extraction.client_name || it.client_name || 'Cliente';
            return {
              ...it,
              status: 'analyzed',
              progressMsg: 'Análisis completado',
              extraction,
              title: extraction.title || it.title || `Contrato ${derivedClient}`,
              client_name: derivedClient,
              brand: extraction.brand || 'datared',
              service_category: extraction.service_category || 'colocation',
              monthly_fee: extraction.monthly_fee ?? null,
              contract_value: extraction.contract_value ?? null,
              duration_months: extraction.duration_months ?? null,
              start_date: extraction.start_date || '',
              end_date: extraction.end_date || '',
              summary: extraction.summary || 'Resumen extraído de documento',
              key_terms: extraction.key_terms || '',
            };
          })
        );
      } catch (err: any) {
        console.warn('Error al procesar archivo en lote:', item.file.name, err);
        setFileItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: 'analyzed',
                  progressMsg: 'Procesado con valores básicos',
                  errorMsg: 'No se extrajeron todos los datos automáticamente. Puedes editarlos manualmente.',
                  client_name: it.client_name || it.title.split(' ')[0] || 'Cliente',
                }
              : it
          )
        );
      }
    }

    setIsProcessingBatch(false);
  };

  const handleSaveAll = () => {
    const validContracts: Omit<Contract, 'id' | 'created_at'>[] = fileItems
      .filter((it) => it.status === 'analyzed')
      .map((it) => ({
        client_name: it.client_name.trim() || 'Cliente Sin Especificar',
        raw_client_name: it.extraction?.raw_client_name || it.client_name,
        client_aliases: it.extraction?.aliases || [],
        contract_type: it.extraction?.contract_type || 'cliente',
        brand: it.brand,
        title: it.title.trim() || 'Contrato Nuevo',
        service_name: it.extraction?.service_name || '',
        service_category: it.service_category,
        units_quantity: it.extraction?.units_quantity,
        bandwidth_mbps: it.extraction?.bandwidth_mbps,
        monthly_fee: it.monthly_fee,
        contract_value: it.contract_value,
        currency: 'USD',
        duration_months: it.duration_months,
        start_date: it.start_date,
        end_date: it.end_date,
        status: 'vigente',
        summary: it.summary,
        key_terms: it.key_terms,
        file_name: it.file.name,
      }));

    if (validContracts.length === 0) {
      alert('Debes analizar al menos un contrato antes de guardar.');
      return;
    }

    onSaveBatch(validContracts);
    onClose();
  };

  const analyzedCount = fileItems.filter((i) => i.status === 'analyzed').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Carga Masiva de Contratos PDF
                <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-md font-semibold border border-indigo-200">
                  Lote AI
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Sube 2, 3 o más PDFs juntos. La IA procesará en lote los plazos, montos y clientes.
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

        {/* Drag & Drop Dropzone */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-slate-100/80 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".pdf,.docx,.doc,.txt"
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
            <div className="w-12 h-12 rounded-full bg-indigo-50 group-hover:bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 transition">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Arrastra aquí varios PDFs o <span className="text-indigo-600 underline">haz clic para seleccionar</span>
            </p>
            <p className="text-xs text-slate-500">
              Soporta PDF, Word (.docx) · Sube todos los contratos de un cliente al mismo tiempo
            </p>
          </div>

          {/* Controls Bar */}
          {fileItems.length > 0 && (
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-700">
                <strong>{fileItems.length}</strong> {fileItems.length === 1 ? 'archivo en cola' : 'archivos en cola'} ·{' '}
                <span className="text-emerald-700 font-semibold">{analyzedCount} analizados</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={processBatch}
                  disabled={isProcessingBatch || fileItems.every((i) => i.status === 'analyzed')}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition shadow-sm"
                >
                  {isProcessingBatch ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Procesando con IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Analizar Lote
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Files List & Extracted Preview Cards */}
          <div className="space-y-3.5">
            {fileItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 shadow-sm space-y-3"
              >
                {/* File Header Row */}
                <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-900 truncate max-w-sm">
                      {item.file.name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ({(item.file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'pending' && (
                      <span className="text-xs text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                        Pendiente
                      </span>
                    )}
                    {item.status === 'extracting' && (
                      <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded flex items-center gap-1.5 font-medium">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {item.progressMsg || 'Analizando...'}
                      </span>
                    )}
                    {item.status === 'analyzed' && (
                      <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Listo
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Error
                      </span>
                    )}

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition"
                      title="Quitar de la lista"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Extraction Fields Grid (Editable) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
                  
                  {/* Title */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Título del Contrato
                    </label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) =>
                        setFileItems((prev) =>
                          prev.map((it) => (it.id === item.id ? { ...it, title: e.target.value } : it))
                        )
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:border-indigo-500"
                    />
                  </div>

                  {/* Client Name (Normalized) */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Cliente Normalizado
                    </label>
                    <input
                      type="text"
                      value={item.client_name}
                      onChange={(e) =>
                        setFileItems((prev) =>
                          prev.map((it) => (it.id === item.id ? { ...it, client_name: e.target.value } : it))
                        )
                      }
                      placeholder="Ej: Banco de Desarrollo de El Salvador (BANDESAL)"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:border-indigo-500"
                    />
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Marca
                    </label>
                    <select
                      value={item.brand}
                      onChange={(e) =>
                        setFileItems((prev) =>
                          prev.map((it) =>
                            it.id === item.id ? { ...it, brand: e.target.value as 'datared' | 'red' } : it
                          )
                        )
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:border-indigo-500"
                    >
                      <option value="datared">DataRed</option>
                      <option value="red">RED</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Categoría
                    </label>
                    <select
                      value={item.service_category}
                      onChange={(e) =>
                        setFileItems((prev) =>
                          prev.map((it) =>
                            it.id === item.id
                              ? { ...it, service_category: e.target.value as any }
                              : it
                          )
                        )
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:border-indigo-500"
                    >
                      <option value="colocation">Colocation (Rack U's)</option>
                      <option value="conectividad">Conectividad (Mbps)</option>
                      <option value="radiocomunicacion">Radiocomunicación</option>
                      <option value="otro">Custodia / Otro</option>
                    </select>
                  </div>

                  {/* Monthly Fee */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Cuota Mensual ($)
                    </label>
                    <input
                      type="number"
                      value={item.monthly_fee ?? ''}
                      onChange={(e) =>
                        setFileItems((prev) =>
                          prev.map((it) =>
                            it.id === item.id
                              ? { ...it, monthly_fee: parseFloat(e.target.value) || null }
                              : it
                          )
                        )
                      }
                      placeholder="0.00"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:border-indigo-500 font-mono"
                    />
                  </div>

                  {/* Total Value */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Monto Total ($)
                    </label>
                    <input
                      type="number"
                      value={item.contract_value ?? ''}
                      onChange={(e) =>
                        setFileItems((prev) =>
                          prev.map((it) =>
                            it.id === item.id
                              ? { ...it, contract_value: parseFloat(e.target.value) || null }
                              : it
                          )
                        )
                      }
                      placeholder="0.00"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-emerald-700 font-bold focus:border-indigo-500 font-mono"
                    />
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={item.start_date || ''}
                      onChange={(e) =>
                        setFileItems((prev) =>
                          prev.map((it) =>
                            it.id === item.id ? { ...it, start_date: e.target.value } : it
                          )
                        )
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:border-indigo-500"
                    />
                  </div>

                  {/* End Date (Calculated) */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Fecha Fin (Calculada)
                    </label>
                    <input
                      type="date"
                      value={item.end_date || ''}
                      onChange={(e) =>
                        setFileItems((prev) =>
                          prev.map((it) => (it.id === item.id ? { ...it, end_date: e.target.value } : it))
                        )
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:border-indigo-500"
                    />
                  </div>

                  {/* Duration */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Plazo en Meses
                    </label>
                    <input
                      type="number"
                      value={item.duration_months ?? ''}
                      onChange={(e) =>
                        setFileItems((prev) =>
                          prev.map((it) =>
                            it.id === item.id
                              ? { ...it, duration_months: parseInt(e.target.value, 10) || null }
                              : it
                          )
                        )
                      }
                      placeholder="Ej: 18, 24, 12"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:border-indigo-500"
                    />
                  </div>

                </div>

                {/* Summary & AI Key terms */}
                {item.summary && (
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-700">
                    <span className="text-[10px] uppercase font-bold text-indigo-600 block mb-0.5">
                      Resumen Generado
                    </span>
                    {item.summary}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
          >
            Cancelar
          </button>

          <button
            onClick={handleSaveAll}
            disabled={analyzedCount === 0}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition shadow-sm"
          >
            <Save className="w-4 h-4" />
            Guardar Todos los Contratos ({analyzedCount})
          </button>
        </div>

      </div>
    </div>
  );
};
