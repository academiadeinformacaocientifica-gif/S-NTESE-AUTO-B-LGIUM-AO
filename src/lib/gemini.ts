import { GoogleGenAI, Type } from "@google/genai";

/**
 * CONFIGURAÇÃO DA CHAVE DE API
 * Priorizamos a chave fornecida pelo utilizador para garantir o funcionamento na Vercel e no Preview.
 */
const getApiKey = (): string => {
  // 1. Chave fornecida pelo utilizador (Garantia de funcionamento imediato)
  const userKey = 'AIzaSyAQUhS24aYkqGtdTViGzsAtNCL1GWKuK9U';
  
  // 2. Tentar variáveis de ambiente para flexibilidade futura
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  
  const viteKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (viteKey) return viteKey;

  return userKey;
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
 * Realiza a pesquisa e síntese de notícias.
 */
export async function generateSintese(date: string): Promise<SinteseItem[]> {
  const prompt = `
    Como um analista diplomático sênior, realize uma síntese de imprensa para o dia ${date}.
    
    TAREFA:
    Localize notícias REAIS e VERIFICÁVEIS sobre Bélgica e Luxemburgo publicadas em ${date}.
    Concentre-se em: Política, Economia e Relações Diplomáticas.
    
    FONTES: Belga.be, LeSoir.be, RTBF, Luxembourg Times, Wort.lu.
    
    REQUISITOS OBRIGATÓRIOS:
    - Utilize a pesquisa do Google para encontrar URLs REAIS.
    - O idioma deve ser Português com a Norma Ortográfica de 1945 (ex: acção, projecto, actual).
    - Mantenha um tom institucional e sofisticado.
    
    Retorne os dados estritamente em formato JSON seguindo o esquema definido.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Modelo rápido e eficiente para tarefas de texto
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

    if (!response.text) {
      throw new Error("Não foi possível obter dados da pesquisa. Tente novamente em instantes.");
    }

    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Falha na Síntese:", error);
    
    // Simplificar mensagens de erro para o utilizador
    let msg = "Falha ao processar notícias.";
    if (error.message?.includes("key")) msg = "Erro de autenticação com a API. Verifique a chave.";
    if (error.message?.includes("quota")) msg = "Limite de pesquisas diárias atingido.";
    if (error.message?.includes("JSON")) msg = "Erro na formatação dos dados. Tente outra data.";
    
    throw new Error(msg);
  }
}
