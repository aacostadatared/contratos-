import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { ExtractionResult } from '../types';
import { findCanonicalClient } from './clientAliases';

// Set up pdf.js worker with reliable CDN fallback
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;
  } catch {
    // Fallback if worker setup throws
  }
}

export async function extractTextFromFile(
  file: File,
  onProgress?: (message: string) => void
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'pdf') {
    if (onProgress) onProgress('Leyendo documento PDF...');
    try {
      const buffer = await file.arrayBuffer();
      let fullText = '';

      // Ensure worker src is configured
      if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;
      }

      let pdf;
      try {
        const loadingTask = pdfjsLib.getDocument({ data: buffer });
        pdf = await loadingTask.promise;
      } catch (workerErr) {
        console.warn('Error inicial cargando worker PDF.js, intentando alternativa CDN:', workerErr);
        if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;
        }
        try {
          const loadingTask = pdfjsLib.getDocument({ data: buffer });
          pdf = await loadingTask.promise;
        } catch (err2) {
          console.warn('No se pudo inicializar lector de PDF, usando metadatos del archivo:', err2);
          return `Contrato de servicios en archivo PDF: ${file.name}`;
        }
      }

      const numPages = Math.min(pdf.numPages, 20);

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        if (onProgress) onProgress(`Procesando página ${pageNum} de ${numPages}...`);
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageItems = textContent.items.map((item: any) => item.str || '').join(' ');
          fullText += `\n--- PÁGINA ${pageNum} ---\n` + pageItems;
        } catch (pageErr) {
          console.warn(`Error al leer página ${pageNum}:`, pageErr);
        }
      }

      if (fullText.trim().length < 50 && onProgress) {
        onProgress('ADVERTENCIA: El PDF tiene poco texto reconocible. Se procesará por nombre y contenido disponible.');
      }

      return fullText.trim() || `Contrato de servicios PDF: ${file.name}`;
    } catch (err) {
      console.error('Error al extraer texto del archivo PDF:', err);
      return `Contrato PDF: ${file.name}`;
    }
  } else if (ext === 'docx' || ext === 'doc') {
    if (onProgress) onProgress('Leyendo documento de Word...');
    try {
      const buffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      return result.value || `Documento Word: ${file.name}`;
    } catch (err) {
      console.warn('Error al leer DOCX/DOC:', err);
      return `Documento Word: ${file.name}`;
    }
  } else if (ext === 'txt') {
    try {
      return await file.text();
    } catch {
      return `Archivo de texto: ${file.name}`;
    }
  }

  return `Archivo ${file.name}`;
}

export async function analyzeContractText(
  text: string,
  filename: string,
  onProgress?: (msg: string) => void
): Promise<ExtractionResult> {
  if (onProgress) onProgress('Analizando cláusulas, plazos y montos con Gemini AI...');

  try {
    const response = await fetch('/api/analyze-contract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text || '', filename }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      console.warn('Backend API devolvió error HTTP, usando analizador fallback:', errJson?.error);
      return heuristicFallbackExtraction(text, filename);
    }

    const resData = await response.json().catch(() => null);
    if (!resData || !resData.success || !resData.data) {
      console.warn('Respuesta de API inválida, usando analizador fallback');
      return heuristicFallbackExtraction(text, filename);
    }

    const data: ExtractionResult = resData.data;

    // Clean numeric types if returned as strings
    if (typeof data.monthly_fee === 'string') {
      data.monthly_fee = parseFloat((data.monthly_fee as string).replace(/[^0-9.]/g, '')) || null;
    }
    if (typeof data.contract_value === 'string') {
      data.contract_value = parseFloat((data.contract_value as string).replace(/[^0-9.]/g, '')) || null;
    }
    if (typeof data.duration_months === 'string') {
      data.duration_months = parseInt((data.duration_months as string).replace(/[^0-9]/g, ''), 10) || null;
    }

    // Heuristic supplementation if Gemini missed specific fields
    if (!data.start_date) {
      const dates = extractDatesFromText(text, filename);
      if (dates.start_date) data.start_date = dates.start_date;
      if (!data.end_date && dates.end_date) data.end_date = dates.end_date;
    }

    if (!data.duration_months) {
      data.duration_months = extractDurationFromText(text);
    }

    if (!data.monthly_fee || !data.contract_value) {
      const amounts = extractAmountsFromText(text);
      if (!data.monthly_fee && amounts.monthly_fee) data.monthly_fee = amounts.monthly_fee;
      if (!data.contract_value && amounts.contract_value) data.contract_value = amounts.contract_value;
    }

    // Client normalization & fallback
    const rawName = data.client_name || data.raw_client_name || filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
    const { canonicalName } = findCanonicalClient(rawName);
    data.client_name = canonicalName || rawName;

    // Date / duration calculation check
    if (data.start_date && data.duration_months && !data.end_date) {
      data.end_date = calculateEndDate(data.start_date, data.duration_months);
    }

    // Value calculation if monthly fee & duration exist
    if (data.monthly_fee && data.duration_months && !data.contract_value) {
      data.contract_value = Math.round(data.monthly_fee * data.duration_months * 100) / 100;
    }

    if (data.contract_value && data.duration_months && !data.monthly_fee && data.duration_months > 0) {
      data.monthly_fee = Math.round((data.contract_value / data.duration_months) * 100) / 100;
    }

    return data;
  } catch (err: any) {
    console.warn('Error en la llamada al backend Gemini, usando analizador heurístico fallback:', err?.message);
    if (onProgress) onProgress('Procesando datos con analizador alternativo...');
    return heuristicFallbackExtraction(text, filename);
  }
}

export function calculateEndDate(startDateStr: string, months: number): string {
  try {
    const startDate = new Date(startDateStr + 'T00:00:00');
    if (isNaN(startDate.getTime())) return '';

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);

    return endDate.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

const MONTH_MAP: Record<string, string> = {
  enero: '01', febrero: '02', marzo: '03', abril: '04',
  mayo: '05', junio: '06', julio: '07', agosto: '08',
  septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12'
};

export function extractDatesFromText(text: string, filename: string = ''): { start_date: string | null; end_date: string | null } {
  const combined = (text + ' ' + filename).toLowerCase();
  
  // Spanish date pattern: "11 de febrero de 2021" or "11 de febrero del 2021"
  const spanishDateRegex = /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de[l\s]+(\d{4})/gi;
  const matches = [...combined.matchAll(spanishDateRegex)];
  const datesFound: string[] = [];

  for (const match of matches) {
    const day = match[1].padStart(2, '0');
    const month = MONTH_MAP[match[2].toLowerCase()] || '01';
    const year = match[3];
    datesFound.push(`${year}-${month}-${day}`);
  }

  // ISO pattern: 2021-02-11
  const isoRegex = /\b(20[1-3][0-9])[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12][0-9]|3[01])\b/g;
  for (const match of combined.matchAll(isoRegex)) {
    datesFound.push(`${match[1]}-${match[2]}-${match[3]}`);
  }

  // DMY pattern: 11/02/2021
  const dmyRegex = /\b(0[1-9]|[12][0-9]|3[01])[-/](0[1-9]|1[0-2])[-/](20[1-3][0-9])\b/g;
  for (const match of combined.matchAll(dmyRegex)) {
    datesFound.push(`${match[3]}-${match[2]}-${match[1]}`);
  }

  if (datesFound.length > 0) {
    datesFound.sort();
    return {
      start_date: datesFound[0],
      end_date: datesFound.length > 1 ? datesFound[datesFound.length - 1] : null,
    };
  }

  return { start_date: null, end_date: null };
}

export function extractAmountsFromText(text: string): { monthly_fee: number | null; contract_value: number | null } {
  let monthly_fee: number | null = null;
  let contract_value: number | null = null;

  // Monthly regex: "cuota de $250.00", "canon mensual $1,200", "$250 mensuales"
  const monthlyRegex = /(?:cuota|canon|pago|alquiler|monto|monto mensual|cuota mensual|precio|tarifa)\s*(?:mensual)?\s*(?:de)?\s*\$\s*([\d,]+(?:\.\d{1,2})?)/gi;
  const monthlyMatch = monthlyRegex.exec(text);
  if (monthlyMatch && monthlyMatch[1]) {
    const val = parseFloat(monthlyMatch[1].replace(/,/g, ''));
    if (!isNaN(val) && val > 0) monthly_fee = val;
  }

  // Total regex: "monto total de $4,500.00", "valor $4,500"
  const totalRegex = /(?:monto total|valor total|suma total|precio total)\s*(?:de)?\s*\$\s*([\d,]+(?:\.\d{1,2})?)/gi;
  const totalMatch = totalRegex.exec(text);
  if (totalMatch && totalMatch[1]) {
    const val = parseFloat(totalMatch[1].replace(/,/g, ''));
    if (!isNaN(val) && val > 0) contract_value = val;
  }

  // General Dollar regex fallback
  const allDollarMatches = text.match(/\$\s*([\d,]+(?:\.\d{1,2})?)/g);
  if (allDollarMatches && allDollarMatches.length > 0) {
    const nums = allDollarMatches
      .map(s => parseFloat(s.replace('$', '').replace(/,/g, '').trim()))
      .filter(n => !isNaN(n) && n > 0);

    if (nums.length > 0) {
      if (!contract_value) contract_value = Math.max(...nums);
      if (!monthly_fee && nums.length > 1) {
        const minVal = Math.min(...nums);
        if (minVal < (contract_value || 0)) {
          monthly_fee = minVal;
        }
      }
    }
  }

  return { monthly_fee, contract_value };
}

export function extractDurationFromText(text: string): number | null {
  const clean = text.toLowerCase();

  const numMonths = clean.match(/(\d{1,2})\s*meses/i);
  if (numMonths && numMonths[1]) {
    const months = parseInt(numMonths[1], 10);
    if (months > 0 && months <= 120) return months;
  }

  if (clean.includes('dieciocho meses') || clean.includes('18 meses')) return 18;
  if (clean.includes('veinticuatro meses') || clean.includes('24 meses') || clean.includes('dos años')) return 24;
  if (clean.includes('doce meses') || clean.includes('12 meses') || clean.includes('un año')) return 12;
  if (clean.includes('treinta y seis meses') || clean.includes('36 meses') || clean.includes('tres años')) return 36;
  if (clean.includes('cuarenta y ocho meses') || clean.includes('48 meses') || clean.includes('cuatro años')) return 48;
  if (clean.includes('sesenta meses') || clean.includes('60 meses') || clean.includes('cinco años')) return 60;

  return null;
}

function heuristicFallbackExtraction(text: string, filename: string): ExtractionResult {
  const clean = text.replace(/\s+/g, ' ');

  // Look for client name
  let client_name = filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
  const clientMatch = clean.match(/sociedad\s+([A-ZÁÉÍÓÚÑ\s,]{4,60})/i) || clean.match(/cliente[:\s]+([A-ZÁÉÍÓÚÑ\s,]{4,60})/i);
  if (clientMatch && clientMatch[1]) {
    client_name = clientMatch[1].trim();
  }

  const { canonicalName } = findCanonicalClient(client_name);

  // Look for duration
  const duration_months = extractDurationFromText(text);

  // Look for values
  const { monthly_fee, contract_value } = extractAmountsFromText(text);

  // Look for dates
  const { start_date, end_date } = extractDatesFromText(text, filename);

  // Brand detection
  const brand: 'datared' | 'red' = clean.toLowerCase().includes('radiocomunicacion') || clean.toLowerCase().includes(' radio') ? 'red' : 'datared';

  let calculatedEnd = end_date;
  if (start_date && duration_months && !calculatedEnd) {
    calculatedEnd = calculateEndDate(start_date, duration_months);
  }

  let finalContractValue = contract_value;
  if (monthly_fee && duration_months && !finalContractValue) {
    finalContractValue = Math.round(monthly_fee * duration_months * 100) / 100;
  }

  let finalMonthlyFee = monthly_fee;
  if (finalContractValue && duration_months && !finalMonthlyFee && duration_months > 0) {
    finalMonthlyFee = Math.round((finalContractValue / duration_months) * 100) / 100;
  }

  return {
    client_name: canonicalName,
    raw_client_name: client_name,
    title: `Contrato ${canonicalName}`,
    brand,
    contract_type: 'cliente',
    service_category: brand === 'red' ? 'radiocomunicacion' : 'colocation',
    duration_months,
    contract_value: finalContractValue,
    monthly_fee: finalMonthlyFee,
    start_date: start_date || '',
    end_date: calculatedEnd || '',
    currency: 'USD',
    summary: 'Contrato extraído mediante procesador de documentos.',
    key_terms: 'Revisar cláusulas contractuales e importes asignados.',
  };
}
