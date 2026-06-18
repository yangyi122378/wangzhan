import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {GoogleGenAI} from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const geminiApiPlugin = () => {
  return {
    name: 'gemini-api-server',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url === '/api/research' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { prompt, projectTitle, projectDetails } = JSON.parse(body);
              const apiKey = process.env.GEMINI_API_KEY;
              
              if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                  error: 'API_KEY_MISSING',
                  message: 'GEMINI_API_KEY is not configured in Secrets. Reverting to local architectural briefing state.' 
                }));
                return;
              }

              const ai = new GoogleGenAI({
                apiKey,
                httpOptions: {
                  headers: {
                    'User-Agent': 'aistudio-build',
                  }
                }
              });

              const systemInstruction = `You are a visionary principal research architect and critics panel leader at the Preliminary Research Office (PRO / 基础研究所). 
The user is asking a deep research question about the design, tectonic logic, materials, or theoretical background of our project: "${projectTitle}".
Here are the official specifications of our project:
- Title: ${projectTitle}
- Location: ${projectDetails.location}
- Year/Status: ${projectDetails.year}
- Category: ${projectDetails.category}
- Area/Scale: ${projectDetails.area || 'Variable'}
- Structural System & Materials: ${projectDetails.material || 'Experimental'}
- Core Tectonic Thesis: ${projectDetails.tectonics}

Provide a breathtakingly insightful, intellectual, and descriptive response. Engage with contemporary architectural theory (e.g., modularity, brutalist poetry, parametric tectonics, light/shadow play, structural honesty). Keep the tone highly sophisticated, academic, calm, and articulate. Respond in the language of the prompt (Chinese if written in Chinese, English if in English). Do not use casual emojis or generic corporate phrases. Ensure your response feels worthy of an elite architecture monograph or research jury.`;

              const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: prompt,
                config: {
                  systemInstruction,
                  temperature: 0.75,
                }
              });

              const generatedText = response.text || 'No response compiled.';
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ text: generatedText }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'SERVER_ERROR', message: err.message || 'Error executing Gemini API research.' }));
            }
          });
          return;
        }
        next();
      });
    }
  };
};

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), geminiApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
