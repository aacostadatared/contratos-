import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route for Gemini contract analysis
  app.post("/api/analyze-contract", async (req, res) => {
    try {
      const { text, filename, fileBase64, mimeType, pageImages } = req.body;
      const textToAnalyze = typeof text === "string" ? text : "";

      const prompt = `Analiza el documento adjunto (contrato, orden de compra o anexo) o el texto extraído para las empresas de telecomunicaciones DataRed e INTELFON / RED en El Salvador.
Nombre del archivo: ${filename || "desconocido"}.

INSTRUCCIONES DE EXTRACCIÓN CRÍTICAS (DEBES LEER TODO EL DOCUMENTO O IMAGEN Y EXTRAER):
1. "client_name": Identifica el CLIENTE (persona natural o jurídica que recibe el servicio o emite la orden de compra).
   - Ejemplos: "BANCO DE DESARROLLO DE LA REPÚBLICA DE EL SALVADOR", "BANDESAL", "Ministerio de Hacienda", "Banco Agrícola".
   - Si el cliente es BANDESAL o variaciones (como "BANCO DE DESARROLLO DE EL SALVADOR"), normalízalo a "BANCO DE DESARROLLO DE LA REPÚBLICA DE EL SALVADOR (BANDESAL)".
   - Guarda en "raw_client_name" el nombre exacto que aparece.

2. MONTOS ("monthly_fee" y "contract_value"):
   - "contract_value": MONTO TOTAL O VALOR TOTAL del contrato/orden de compra en USD.
     * Ejemplo 1: En una Orden de Compra ("ORDEN DE COMPRA DE OBRAS, BIENES, SERVICIOS..."), busca la columna "Valor Total (Iva Incluido)" o "Total USD $". Ej: 16724.00 ($16,724.00).
     * Ejemplo 2: "monto total de TRECE MIL CUATROCIENTOS CUARENTA DÓLARES (USD $13,440.00)".
     * Si sólo hay cuota mensual y plazo (ej: $250 x 18 meses), contract_value = 4500.
   - "monthly_fee": Cuota mensual pactada en USD.
     * Si el contrato dice "cuota mensual de $250.00", pon 250.
     * Si la orden de compra indica un valor total de $16,724.00 para un período de 12 meses (ej: 01/01/2024 al 31/12/2024), calcula monthly_fee = 16724 / 12 = 1393.67.
     * Si indica cuota anual de $13,440.00 para 12 meses, la cuota mensual es 13,440 / 12 = 1120.00.
   - REGLA: EXTRAE SIEMPRE los valores numéricos de cualquier cifra en dólares que aparezca en el documento.

3. FECHAS Y PLAZO ("start_date", "end_date", "duration_months"):
   - "start_date": Fecha de inicio en YYYY-MM-DD.
     * Ej: "Del 01 de enero al 31 de diciembre de 2024" -> "2024-01-01".
     * Ej: "desde el día uno enero de dos mil veintiuno..." -> "2021-01-01".
     * Ej: "15 de Diciembre de 2023" o fecha del contrato/orden.
   - "end_date": Fecha de vencimiento/finalización en YYYY-MM-DD.
     * Ej: "31 de diciembre de 2024" -> "2024-12-31".
     * Ej: "treinta y uno de diciembre de dos mil veintiuno" -> "2021-12-31".
   - "duration_months": Plazo en meses (ej. 12, 18, 24). Si va de 2024-01-01 a 2024-12-31, son 12 meses.

4. "brand":
   - "datared": Si ofrece Colocation, Espacio en Gabinete/Rack (U's), Data Center, Servidores, Arrendamiento de Inmueble para Data Center, Enlaces de Datos, Cloud, Internet Empresarial.
   - "red": Si ofrece Radiocomunicación Trunking, PTT, Flota de Radios, Terminales, GPS.

5. "service_category": "colocation" | "conectividad" | "radiocomunicacion" | "otro".

6. "units_quantity": Número de U's de rack (ej. 42U -> 42), o número de radios/equipos si aplica.

Devuelve UNICAMENTE un objeto JSON válido con esta estructura:
{
  "client_name": "Nombre normalizado del cliente",
  "raw_client_name": "Nombre tal cual aparece",
  "aliases": ["BANDESAL", "BANCO DE DESARROLLO DE LA REPUBLICA DE EL SALVADOR"],
  "contract_type": "cliente",
  "brand": "datared" | "red",
  "title": "Título del contrato / orden",
  "service_name": "Descripción breve del servicio",
  "service_category": "colocation" | "conectividad" | "radiocomunicacion" | "otro",
  "units_quantity": number | null,
  "bandwidth_mbps": number | null,
  "monthly_fee": number | null,
  "contract_value": number | null,
  "currency": "USD",
  "duration_months": number | null,
  "start_date": "YYYY-MM-DD" | null,
  "end_date": "YYYY-MM-DD" | null,
  "summary": "Resumen claro del objeto del contrato",
  "key_terms": "Términos..."
}
`;

      const contentsParts: any[] = [];

      // If page images from PDF rendering are provided, send them as JPEG inlineData
      if (pageImages && Array.isArray(pageImages) && pageImages.length > 0) {
        for (const imgBase64 of pageImages) {
          contentsParts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: imgBase64,
            },
          });
        }
      } else if (fileBase64 && typeof fileBase64 === "string") {
        let validMime = mimeType || "application/pdf";
        if (filename && filename.toLowerCase().endsWith(".pdf")) validMime = "application/pdf";
        else if (filename && filename.toLowerCase().endsWith(".png")) validMime = "image/png";
        else if (filename && (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg"))) validMime = "image/jpeg";

        contentsParts.push({
          inlineData: {
            mimeType: validMime,
            data: fileBase64,
          },
        });
      }

      contentsParts.push({
        text: prompt + (textToAnalyze ? `\n\nTEXTO EXTRAÍDO DEL DOCUMENTO:\n${textToAnalyze.slice(0, 30000)}` : ""),
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: contentsParts,
        config: {
          responseMimeType: "application/json",
        },
      });

      const rawText = response.text || "{}";
      const cleanText = rawText.replace(/```json|```/g, "").trim();
      let parsedData = {};
      try {
        parsedData = JSON.parse(cleanText);
      } catch {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedData = JSON.parse(jsonMatch[0]);
          } catch {
            parsedData = {};
          }
        }
      }

      res.json({ success: true, data: parsedData });
    } catch (error: any) {
      console.error("Error in /api/analyze-contract:", error);
      res.status(500).json({ error: error?.message || "Internal server error" });
    }
  });

  // Vite middleware for dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
