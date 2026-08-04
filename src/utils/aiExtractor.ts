import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { ExtractionResult } from '../types';
import { findCanonicalClient } from './clientAliases';

// Set up pdf.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export async function extractTextFromFile(
  file: File,
  onProgress?: (message: string) => void
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'pdf') {
    if (onProgress) onProgress('Leyendo documento PDF...');
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    let fullText = '';
    const numPages = Math.min(pdf.numPages, 15);

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      if (onProgress) onProgress(`Procesando página ${pageNum} de ${numPages}...`);
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageItems = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `\n--- PÁGINA ${pageNum} ---\n` + pageItems;
    }

    if (fullText.trim().length < 50 && onProgress) {
      onProgress('ADVERTENCIA: El PDF parece ser una imagen o escaneo con poco texto reconocible.');
    }

    return fullText;
  } else if (ext === 'docx' || ext === 'doc') {
    if (onProgress) onProgress('Leyendo documento de Word...');
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value || '';
  } else if (ext === 'txt') {
    return await file.text();
  }

  throw new Error(`Formato de archivo .${ext} no soportado. Usa PDF, DOCX o TXT.`);
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
      body: JSON.stringify({ text, filename }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson?.error || `Error HTTP ${response.status}`);
    }

    const resData = await response.json();
    if (!resData.success || !resData.data) {
      throw new Error('Respuesta inválida del servidor de análisis');
    }

    const data: ExtractionResult = resData.data;

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
    console.warn('Error en la llamada al backend Gemini, usando analizador heurístico fallback:', err.message);
    if (onProgress) onProgress('Llamando analizador alternativo...');
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
