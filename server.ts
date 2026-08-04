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

      const prompt = `Analiza detenidamente el documento adjunto (contrato, orden de compra, anexo o oferta) y/o el texto extraído para las empresas de telecomunicaciones DataRed e INTELFON / RED en El Salvador.
Nombre del archivo: ${filename || "desconocido"}.

INSTRUCCIONES DE EXTRACCIÓN Y NORMALIZACIÓN OBLIGATORIAS:

1. CLIENTE ("client_name" y "raw_client_name"):
   - Identifica el cliente o contratante principal.
   - Si el cliente es BANDESAL (ej: "BANCO DE DESARROLLO DE EL SALVADOR", "BANCO DE DESARROLLO DE LA REPÚBLICA DE EL SALVADOR", "BANDESAL"), normalízalo EXACTAMENTE a: "BANCO DE DESARROLLO DE LA REPÚBLICA DE EL SALVADOR (BANDESAL)".
   - Si es TELEFÓNICA / MOVISTAR, normalízalo a: "Telefónica Móviles El Salvador, S.A. de C.V.".
   - Si es SSP / SOCIEDAD DE SEGURIDAD PRIVADA, normalízalo a: "SSP DE EL SALVADOR, S.A. DE C.V.".
   - Guarda en "raw_client_name" la versión textual exacta que aparece en el documento.

2. MONTOS EN USD ("monthly_fee" y "contract_value"):
   - Lee minuciosamente TODAS las cifras en dólares ($) del documento, tablas de precios, valor total y cuotas mensuales.
   - "contract_value": MONTO TOTAL O VALOR TOTAL del contrato u orden de compra.
     * Ejemplo: Si la orden de compra indica "Valor Total (Iva Incluido): $16,724.00" o "Monto Total $13,440.00", pon 16724.00 o 13440.00.
     * Si no hay monto total explícito, pero hay una cuota mensual de $250.00 por 12 meses, contract_value = 3000.00.
   - "monthly_fee": CUOTA O CANON MENSUAL en USD.
     * Ejemplo: Si el monto total es $16,724.00 para un período de 12 meses, calcula monthly_fee = 16724 / 12 = 1393.67.
     * Ejemplo: Si el monto total es $13,440.00 para 12 meses, calcula monthly_fee = 13440 / 12 = 1120.00.
     * Si el contrato establece cuota mensual de $614.16, pon 614.16.

3. FECHAS Y DURACIÓN ("start_date", "end_date", "duration_months"):
   - FORMATO DE FECHA OBLIGATORIO: "YYYY-MM-DD" estricto. (Ejemplo: 2021-01-01).
   - "start_date": Fecha de inicio en YYYY-MM-DD.
     * Ej: "01 de enero de 2021" -> "2021-01-01".
     * Ej: "15/12/2023" -> "2023-12-15".
   - "duration_months": Plazo en meses (ej. 12, 18, 24). Si dice "un año" o "12 meses" pon 12.
   - "end_date": Fecha de vencimiento/finalización en YYYY-MM-DD.
     * Si start_date es "2021-01-01" y duration_months es 12, end_date DEBE SER "2021-12-31".
     * Si start_date es "2024-01-01" y duration_months es 12, end_date DEBE SER "2024-12-31".

4. MARCA Y CATEGORÍA ("brand" y "service_category"):
   - "brand": "datared" si es Colocation, Gabinete/Rack (U's), Data Center, Servidores, Arrendamiento de Espacio o Sitio Alterno, Enlaces de Datos, Cloud, Internet. "red" si es Radiocomunicación Trunking, Flota de Radios, Terminales, GPS.
   - "service_category": "colocation" | "conectividad" | "radiocomunicacion" | "otro".

Devuelve ÚNICAMENTE un objeto JSON estructurado con estas claves:
{
  "client_name": "Nombre normalizado del cliente",
  "raw_client_name": "Nombre literal en el documento",
  "aliases": ["BANDESAL", "BANCO DE DESARROLLO DE LA REPUBLICA DE EL SALVADOR"],
  "contract_type": "cliente",
  "brand": "datared" | "red",
  "title": "Título del contrato u orden de compra",
  "service_name": "Servicio contratado",
  "service_category": "colocation" | "conectividad" | "radiocomunicacion" | "otro",
  "units_quantity": number | null,
  "bandwidth_mbps": number | null,
  "monthly_fee": number | null,
  "contract_value": number | null,
  "currency": "USD",
  "duration_months": number | null,
  "start_date": "YYYY-MM-DD" | null,
  "end_date": "YYYY-MM-DD" | null,
  "summary": "Resumen claro del contrato y servicio",
  "key_terms": "Términos relevantes"
}
`;

      const contentsParts: any[] = [];

      // Include either rendered page images OR raw fileBase64 (never both, to prevent exceeding payload limits)
      if (pageImages && Array.isArray(pageImages) && pageImages.length > 0) {
        const maxImgs = pageImages.slice(0, 6);
        for (const imgBase64 of maxImgs) {
          contentsParts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: imgBase64,
            },
          });
        }
      } else if (fileBase64 && typeof fileBase64 === "string" && fileBase64.length < 15000000) {
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

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: contentsParts,
          config: {
            responseMimeType: "application/json",
          },
        });
      } catch (gemErr: any) {
        console.warn("Reintentando con gemini-2.0-flash debido a:", gemErr?.message || gemErr);
        try {
          response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: contentsParts,
            config: {
              responseMimeType: "application/json",
            },
          });
        } catch (gemErr2: any) {
          console.warn("Reintentando con texto plano debido a:", gemErr2?.message || gemErr2);
          response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
              {
                text: prompt + (textToAnalyze ? `\n\nTEXTO EXTRAÍDO DEL DOCUMENTO:\n${textToAnalyze.slice(0, 30000)}` : ""),
              },
            ],
            config: {
              responseMimeType: "application/json",
            },
          });
        }
      }

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
