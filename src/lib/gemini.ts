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
 * Realiza a pesquisa e síntese de notícias com rigor diplomático e factual.
 */
export async function generateSintese(date: string): Promise<SinteseItem[]> {
  const prompt = `
    IDENTIDADE: Analista de Inteligência de Fontes Abertas (OSINT) e Especialista em Diplomacia.
    
    OBJETIVO: Realizar uma síntese de imprensa EXCLUSIVAMENTE para o dia ${date}.
    
    ESTRATÉGIA DE PESQUISA:
    Use operadores de pesquisa como 'site:lesoir.be "${date}"' ou 'site:luxtimes.lu "${date}"' para garantir que as notícias são do dia correcto.
    
    LOCALIZAÇÃO: Reino da Bélgica e Grão-Ducado de Luxemburgo.
    TEMAS: Política, Economia, Defesa, Assuntos Europeus.
    
    FONTES OBRIGATÓRIAS (Verifique estas primeiro via Google Search):
    - Bélgica: Le Soir (lesoir.be), La Libre (lalibre.be), De Standaard (standaard.be), Belga News Agency, Brussels Times.
    - Luxemburgo: Luxembourg Times (luxtimes.lu), Wort (wort.lu/en), Chronicle.lu, Delano.lu.
    
    REGRAS DE OURO (ESTRITAS):
    1. DATA CRÍTICA: As notícias DEVEM ter sido publicadas no dia ${date}. É terminantemente proibido incluir notícias de outros dias, meses ou anos. Se não houver notícias específicas para este dia, retorne uma lista vazia [].
    2. VERIFICAÇÃO DE LINKS: Você DEVE usar a ferramenta de pesquisa para obter a URL direta do artigo. URLs inventadas ou "dead links" são uma falha grave de segurança e integridade. Teste mentalmente se o caminho da URL segue o padrão real do site.
    3. PROIBIÇÃO DE ALUCINAÇÃO: Se não encontrar um link REAL e funcional para uma notícia específica, NÃO inclua essa notícia na lista. É melhor ter menos notícias (ou nenhuma) do que links quebrados.
    4. TRADUÇÃO E NORMA: Traduza para Português (Portugal) utilizando a Norma Ortográfica de 1945 (Ex: "concepção", "acção", "recepção", "projecto").
    4. TONALIDADE: Linguagem institucional, clara e desprovida de sensacionalismo.
    
    ESTRUTURA JSON:
    Retorne uma lista JSON de objetos com: title, leed, body (resumo executivo em 2-3 parágrafos), link (URL REAL), source (Nome da fonte), category ("Política" ou "Economia").
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview", // Modelo Pro para maior fidelidade factual e seguimento de instruções complexas
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
