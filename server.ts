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

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "No text provided for analysis" });
      }

      const prompt = `Analiza el siguiente texto extraído de un contrato comercial o de servicios para las marcas DataRed e INTELFON / RED en El Salvador.
Información del archivo: ${filename || "desconocido"}.

INSTRUCCIONES DE EXTRACCIÓN Y CÁLCULO:
1. "client_name": Identifica el nombre legal o comercial del CLIENTE.
   - Si el cliente aparece mencionado con variaciones como "Bandesal", "BANCO DE DESARROLLO DE LA REPÚBLICA DE EL SALVADOR" o "Banco de Desarrollo de El Salvador", normaliza el campo "canonical_client_name" a la versión institucional más reconocida (ej. "BANCO DE DESARROLLO DE LA REPÚBLICA DE EL SALVADOR (BANDESAL)").
   - Indica en "raw_client_name" el texto exacto tal como aparece.

2. "brand":
   - "datared": Si ofrece Arrendamiento de Servidor Virtual, Colocation, Data Center, Custodia de Cintas, Enlaces de Datos, Internet empresarial, Cloud.
   - "red": Si ofrece servicios de Radiocomunicación Trunking, PTT, terminales de radio, GPS, flota.

3. "contract_type": "cliente", "proveedor" o "interno".

4. "service_category": "radiocomunicacion", "colocation", "conectividad" u "otro".

5. "units_quantity":
   - Para colocation: Número de U's (unidades de rack) o bastidores.
   - Para radiocomunicación: Número de terminales / radios.
   - Si no aplica, null.

6. "bandwidth_mbps":
   - Para enlaces de datos o internet: Ancho de banda en Mbps. Si viene en KB o MB, conviértelo a número en Mbps.

7. "contract_value" y "monthly_fee":
   - "monthly_fee": Cuota mensual pactada en dólares (USD), sin incluir IVA a menos que sea la única cifra.
   - "contract_value": MONTO TOTAL del contrato en dólares (USD).
     CRÍTICO: Si el contrato especifica la cuota mensual y el plazo en meses (ej. $250/mes por 18 meses), el monto total es $250 * 18 = $4,500.00. Si el contrato dice "CUATRO MIL QUINIENTOS DOLARES ($4,500.00)", este es el valor total. Si solo tiene la cuota mensual de $250 y el plazo de 18 meses, calcula el valor total multiplicando cuota mensual * meses.

8. FECHAS Y PLAZO:
   - "duration_months": Plazo o vigencia expresado en número de meses (ej. 18, 24, 12, 36).
   - "start_date": Fecha de inicio del contrato en formato YYYY-MM-DD.
     ATENCIÓN AL CÁLCULO DE FECHA FINAL: A veces la fecha de inicio se menciona al final en el acta notarial o anexo (ej. " San Salvador, 11 de febrero de 2021" o "15 de Febrero de 2021").
   - "end_date": Fecha de finalización en formato YYYY-MM-DD.
     REGLA DE CÁLCULO IMPORTANTE: Si el contrato establece un plazo de N meses (ej. 18 meses) contados a partir de la fecha de inicio (ej. 15 de febrero de 2021), calcula la fecha de vencimiento sumando exactamente esos meses.
     Ejemplo: 15 de febrero de 2021 + 18 meses = 15 de agosto de 2022 (o fin de mes según aplique). Si el plazo es 12 meses desde 1 de marzo de 2024 -> 1 de marzo de 2025.

9. "summary": Un resumen claro de 2-3 oraciones explicando el objeto del contrato y los servicios contratados.

10. "key_terms": Términos relevantes (SLA de disponibilidad como 99.74%, penalidades, renovación automática, mantenimiento, custodia, etc.).

Devuelve UNICAMENTE un objeto JSON válido con la siguiente estructura:
{
  "client_name": "Nombre normalizado del cliente",
  "raw_client_name": "Nombre tal cual aparece en el contrato",
  "aliases": ["variante 1", "variante 2"],
  "contract_type": "cliente",
  "brand": "datared" | "red",
  "title": "Título sugerido para el contrato",
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
  "summary": "Resumen...",
  "key_terms": "Términos..."
}

TEXTO DEL CONTRATO:
${text.slice(0, 30000)}
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
      const parsedData = JSON.parse(cleanText);

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
