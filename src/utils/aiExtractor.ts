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

    // Client normalization
    if (data.client_name || data.raw_client_name) {
      const nameToMatch = data.client_name || data.raw_client_name || '';
      const { canonicalName } = findCanonicalClient(nameToMatch);
      data.client_name = canonicalName;
    }

    // Date / duration calculation check
    if (data.start_date && data.duration_months && !data.end_date) {
      data.end_date = calculateEndDate(data.start_date, data.duration_months);
    }

    // Value calculation if monthly fee & duration exist
    if (data.monthly_fee && data.duration_months && !data.contract_value) {
      data.contract_value = Math.round(data.monthly_fee * data.duration_months * 100) / 100;
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
  let duration_months: number | null = null;
  const durationMatch = clean.match(/(\d+)\s*meses/i) || clean.match(/(dieciocho|veinticuatro|doce|treinta y seis)\s*\(\d+\)\s*meses/i);
  if (durationMatch) {
    if (clean.includes('dieciocho') || clean.includes('18')) duration_months = 18;
    else if (clean.includes('veinticuatro') || clean.includes('24')) duration_months = 24;
    else if (clean.includes('doce') || clean.includes('12')) duration_months = 12;
    else if (clean.includes('treinta y seis') || clean.includes('36')) duration_months = 36;
  }

  // Look for values
  let contract_value: number | null = null;
  let monthly_fee: number | null = null;

  const valueMatch = clean.match(/\$\s*([\d,]+(?:\.\d{2})?)/g);
  if (valueMatch && valueMatch.length > 0) {
    const numbers = valueMatch.map(v => parseFloat(v.replace('$', '').replace(/,/g, ''))).filter(n => !isNaN(n));
    if (numbers.length > 0) {
      contract_value = Math.max(...numbers);
      if (numbers.length > 1) {
        monthly_fee = Math.min(...numbers);
      }
    }
  }

  // Brand detection
  const brand: 'datared' | 'red' = clean.toLowerCase().includes('radiocomunicacion') || clean.toLowerCase().includes(' radio') ? 'red' : 'datared';

  return {
    client_name: canonicalName,
    raw_client_name: client_name,
    title: `Contrato ${canonicalName}`,
    brand,
    contract_type: 'cliente',
    service_category: brand === 'red' ? 'radiocomunicacion' : 'colocation',
    duration_months,
    contract_value,
    monthly_fee,
    currency: 'USD',
    summary: 'Contrato extraído mediante procesador de documentos.',
    key_terms: 'Revisar cláusulas contractuales e importes asignados.',
  };
}
