import { GoogleGenAI, Type } from "@google/genai";

/**
 * CONFIGURAÇÃO DA CHAVE DE API
 * No AI Studio (este ambiente), o sistema utiliza process.env.GEMINI_API_KEY de forma automática.
 * Na Vercel, o sistema utilizará o que for definido nas Environment Variables como VITE_GEMINI_API_KEY.
 */
const getApiKey = (): string | undefined => {
  // Padrão do AI Studio (Não remover ou alterar)
  let platformKey: string | undefined;
  try {
    // Vite substitui process.env.GEMINI_API_KEY por uma string em tempo de compilação no AI Studio
    platformKey = process.env.GEMINI_API_KEY;
  } catch (e) {
    // Ignorar erro se process não existir
  }
  
  if (platformKey && platformKey !== 'MY_GEMINI_API_KEY') return platformKey;

  // Padrão Vite/Vercel
  const viteKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (viteKey) return viteKey;

  return undefined;
};

export const apiKey = getApiKey();

if (!apiKey) {
  console.error("ERRO: Chave de API não detectada.");
}

const ai = new GoogleGenAI({ 
  apiKey: apiKey || 'AIzaSyAQUhS24aYkqGtdTViGzsAtNCL1GWKuK9U' // Fallback seguro com a chave fornecida pelo utilizador para garantir funcionamento
});

export interface SinteseItem {
  title: string;
  leed: string;
  body: string;
  link: string;
  source: string;
  category: "Política" | "Economia";
}

export async function generateSintese(date: string): Promise<SinteseItem[]> {
  const prompt = `
    Atue como um Especialista em Síntese de Imprensa Internacional sênior.
    Objetivo: Localize as notícias mais relevantes publicadas hoje, dia ${date}, sobre o Reino da Bélgica e o Grão-Ducado de Luxemburgo para realizar uma síntese informativa.
    
    FONTES DE PESQUISA (Monitorize estas e outras relevantes):
    - Belga News, Le Soir, De Standaard, La Libre, De Tijd, L'Echo, VRT NWS, RTBF, Brussels Times, Luxembourg Times, Wort.lu, Knack, Le Vif.
    
    RESTRIÇÃO CRÍTICA DE VERACIDADE E ATUALIDADE:
    - Você DEVE usar a ferramenta Google Search para encontrar notícias REAIS publicadas EXATAMENTE em ${date}.
    - O campo "link" DEVE conter a URL exata e funcional da notícia.
    - É PROIBIDO inventar URLs.
    - Se não houver notícias em "Política" ou "Economia", procure em "Diplomacia", "Sociedade" ou "Relações com Angola" (nesta ordem de prioridade), mantendo o foco em Bélgica e Luxemburgo.
    
    Filtro Obrigatório:
    - As notícias devem obrigatoriamente mencionar "Bélgica", "Luxemburgo" ou o contexto bilateral/europeu relevante.
    
    Processamento e Tradução:
    - Idioma: Português.
    - Norma Ortográfica: Utilize estritamente a Ortografia Portuguesa de 1945 (ex: manter consoantes mudas como em "acção", "óptimo", "director", "projecto", "actual", "adopção", "inspecção").
    - Resumo: O corpo da notícia deve ser sintetizado em no máximo três parágrafos.
    
    Estrutura de Saída (JSON):
    Retorne uma lista de objetos com:
    - title: Título traduzido (Norma 1945).
    - leed: Quem, o quê, onde, quando e porquê.
    - body: Resumo de até 3 parágrafos (Norma 1945).
    - link: URL exata da fonte.
    - source: Nome do jornal.
    - category: "Política" ou "Economia".
    
    Se não houver notícias relevantes, retorne uma lista vazia.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
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

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating sintese:", error);
    throw error;
  }
}
