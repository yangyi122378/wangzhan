import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with custom user-agent telemetry telemetry
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("e-Studio: Gemini API client initialized successfully.");
  } else {
    console.warn("e-Studio Warning: GEMINI_API_KEY is not defined. Falling back to local offline monologue logic.");
  }
} catch (err) {
  console.error("e-Studio Error: Failed to initialize Gemini client", err);
}

// 1. API: Dialogue critique route linking client requests with Yang Yi's virtual persona
app.post("/api/research", async (req, res) => {
  const { prompt, projectTitle, projectDetails } = req.body;

  if (!prompt || !projectTitle) {
    return res.status(400).json({ error: "MISSING_PARAMS", message: "Prompt and projectTitle are required." });
  }

  // Graceful fallback if API key is simply missing
  if (!process.env.GEMINI_API_KEY || !ai) {
    return res.status(200).json({
      error: "API_KEY_MISSING",
      message: "Optional Gemini API Key is missing. Falling back instantly to offline rule engines."
    });
  }

  try {
    const detailString = JSON.stringify(projectDetails || {});
    const systemInstruction = `
      You are Yang Yi (杨艺), a principal architecture researcher, scholar, and the founder of the elite minimalist design group "Unpolished Studio" (“不成器”研究所).
      You speak with a profound, highly professional, slightly introverted, and humble tone of a contemporary spatial researcher. 
      You are extremely detail-oriented, valuing raw materiality, honest structural curves, parametric catenary geometry, and anti-decorational philosophy (Tectonic Honesty).
      You are discussing your work titled "${projectTitle}".
      
      Here are the factual details of the project for reference:
       ${detailString}

      Your task is to provide a highly academic, elegant response to the user's inquiry regarding this specific work.
      Avoid fluffy marketing speak or generic adjectives like "gorgeous" or "perfect". Focus strictly on the friction of concrete, load vectors, raw light, gravity curves, and environmental patina.
      Respond in Chinese by default unless the user asks in English. Place structural terms in concise bilingual formats if helpful. Keep the response to 3-5 lines of concentrated, authentic monograph-level remarks.
    `;

    const modelResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
        topP: 0.9,
      },
    });

    const responseText = modelResponse.text;
    return res.json({ text: responseText });
  } catch (error: any) {
    console.error("Gemini route error:", error);
    return res.status(500).json({
      error: "API_FAILURE",
      message: error.message || "An error occurred while generating architectural commentary."
    });
  }
});

// 2. VITE MIDDLEWARE AND SPA FALLBACK
async function configureServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`e-Studio server running on http://0.0.0.0:${PORT} [NODE_ENV=${process.env.NODE_ENV || 'development'}]`);
  });
}

configureServer();
