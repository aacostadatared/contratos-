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
      const { text, filename } = req.body;
      const textToAnalyze = typeof text === "string" ? text : "";

      const prompt = `Analiza el siguiente texto extraído de un contrato comercial o de servicios para las marcas DataRed e INTELFON / RED en El Salvador.
Información del archivo: ${filename || "desconocido"}.

INSTRUCCIONES DE EXTRACCIÓN Y CÁLCULO CRÍTICAS:
1. "client_name": Identifica el nombre legal o comercial del CLIENTE.
   - Si no lo encuentras explícito en el texto, deduce del nombre del archivo ("${filename}").
   - Si el cliente es "Bandesal", "BANCO DE DESARROLLO DE LA REPÚBLICA DE EL SALVADOR" o "Banco de Desarrollo", normalízalo a "BANCO DE DESARROLLO DE LA REPÚBLICA DE EL SALVADOR (BANDESAL)".
   - Indica en "raw_client_name" la versión exacta encontrada.

2. "monthly_fee" y "contract_value":
   - "monthly_fee": Busca cualquier cifra en dólares ($) asociada a "cuota", "monto mensual", "canon", "pago mensual", "precio mensual", "alquiler". Ej: $250.00, $1,200.00, etc.
   - "contract_value": MONTO TOTAL. Si la cuota es $250 y el plazo es 18 meses, el valor es 250 * 18 = 4500. Si dice "por un valor total de $4,500.00", ese es el contract_value.
   - NUNCA lo dejes null si aparece cualquier cifra o número en dólares en el documento o en el nombre de archivo.

3. FECHAS Y PLAZO ("start_date", "duration_months", "end_date"):
   - "start_date": Busca fechas de otorgamiento, suscripción o firma (ej. "11 de febrero de 2021", "15/02/2021", "San Salvador, 11 de febrero de 2021", o la fecha inicial expresada en el texto o anexo). Devuélvela en YYYY-MM-DD.
   - "duration_months": Plazo en meses (ej. 12, 18, 24, 36, 48). Si dice "un año" es 12, "dos años" es 24, "dieciocho meses" es 18.
   - "end_date": Calcula sumando duration_months a start_date si no aparece explícitamente. Ej: 2021-02-11 + 18 meses = 2022-08-11.

4. "brand":
   - "datared": Si ofrece Servidor Virtual, Colocation, Data Center, Enlaces de Datos, Internet, Cloud.
   - "red": Si ofrece Radiocomunicación, Trunking, PTT, Radios.

5. "service_category": "radiocomunicacion", "colocation", "conectividad" u "otro".

6. "units_quantity" y "bandwidth_mbps": Extrae número de U's, radios, o Mbps de velocidad si están presentes.

7. "title": Asigna un título representativo, por ejemplo "Contrato de Servicios - " + Nombre del Cliente.

Devuelve UNICAMENTE un objeto JSON válido con la siguiente estructura:
{
  "client_name": "Nombre normalizado del cliente",
  "raw_client_name": "Nombre tal cual aparece en el contrato",
  "aliases": ["variante 1", "variante 2"],
  "contract_type": "cliente",
  "brand": "datared" | "red",
  "title": "Título del contrato",
  "service_name": "Descripción del servicio",
  "service_category": "colocation" | "conectividad" | "radiocomunicacion" | "otro",
  "units_quantity": number | null,
  "bandwidth_mbps": number | null,
  "monthly_fee": number | null,
  "contract_value": number | null,
  "currency": "USD",
  "duration_months": number | null,
  "start_date": "YYYY-MM-DD" | null,
  "end_date": "YYYY-MM-DD" | null,
  "summary": "Resumen claro de 2 oraciones",
  "key_terms": "Términos..."
}

TEXTO DEL CONTRATO O NOMBRE DE ARCHIVO:
${textToAnalyze ? textToAnalyze.slice(0, 30000) : filename || "Sin contenido"}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
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
