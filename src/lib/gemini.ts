import { GoogleGenAI, Type } from "@google/genai";

/**
 * CONFIGURAÇÃO DA API GEMINI
 * Seguindo as diretrizes de segurança: usamos process.env.GEMINI_API_KEY.
 */
const getApiKey = (): string => {
  // Em ambientes Vite (como Vercel/Local), as variáveis públicas devem ter o prefixo VITE_
  const viteKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (viteKey) return viteKey;

  // Fallback para process.env caso esteja num ambiente Node/SSR
  const envKey = (process as any).env?.GEMINI_API_KEY;
  if (envKey) return envKey;

  return '';
};

export const apiKey = getApiKey();

const ai = new GoogleGenAI({ 
  apiKey: apiKey
});

export interface SinteseItem {
  title: string;
  leed: string;
  body: string;
  link: string;
  source: string;
  category: "Política" | "Economia";
}

/**
 * Realiza a pesquisa e síntese de notícias com rigor diplomático e factual.
 */
export async function generateSintese(date: string): Promise<SinteseItem[]> {
  try {
    if (!apiKey) {
      throw new Error("A chave de API (GEMINI_API_KEY) não está configurada no ambiente.");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Realize uma síntese de imprensa EXCLUSIVAMENTE para o dia ${date}.`,
      config: {
        systemInstruction: `
          IDENTIDADE: Analista de Inteligência de Fontes Abertas (OSINT) e Especialista em Diplomacia.
          OBJETIVO: Síntese de imprensa para o dia solicitado.
          LOCALIZAÇÃO: Reino da Bélgica e Grão-Ducado de Luxemburgo.
          PESQUISA: Use 'site:lesoir.be "${date}"', 'site:luxtimes.lu "${date}"', 'Belga news ${date}'.
          REGRAS:
          1. DATA: Apenas notícias de ${date}.
          2. LINKS: URLs REAIS e funcionais. Proibido inventar.
          3. TRADUÇÃO: Português (Portugal) norma 1945.
          4. TONALIDADE: Institucional.
          RETORNO: Lista JSON [ {title, leed, body, link, source, category: "Política"|"Economia"} ]
        `,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              leed: { type: Type.STRING },
              body: { type: Type.STRING },
              link: { type: Type.STRING },
              source: { type: Type.STRING },
              category: { 
                type: Type.STRING,
                enum: ["Política", "Economia"]
              }
            },
            required: ["title", "leed", "body", "link", "source", "category"]
          }
        }
      }
    });

    if (!response.text) return [];
    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Erro na Chamada Gemini:", error);
    const detail = error.message || "Erro desconhecido";
    throw new Error(`Falha na IA: ${detail.substring(0, 100)}`);
  }
}
