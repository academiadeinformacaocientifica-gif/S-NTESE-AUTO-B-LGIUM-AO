import React, { useState, useEffect } from 'react';
import { generateSintese, SinteseItem, apiKey } from './lib/gemini';
import { SinteseCard } from './components/SinteseCard';
import { Loader2, RefreshCw, ChevronLeft, ChevronRight, Newspaper, FileText, Mail, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, saveSintese, SinteseDoc } from './firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

export default function App() {
  const [sinteses, setSinteses] = useState<SinteseDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'sinteses'),
      where('date', '==', selectedDate),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SinteseDoc));
      setSinteses(docs);
      setLoading(false);
    }, (err) => {
      console.error("Firestore error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedDate]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const data = await generateSintese(selectedDate);
      if (data.length === 0) {
        setError(`Nenhuma ocorrência encontrada para a data ${selectedDate}`);
      } else {
        for (const item of data) {
          await saveSintese(item, selectedDate);
        }
      }
    } catch (err) {
      setError('Erro ao gerar síntese. Por favor, tente novamente.');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const [searchTerm, setSearchTerm] = useState('');

  const filteredSinteses = sinteses.filter(s => {
    const search = searchTerm.toLowerCase();
    return (
      (s.title?.toLowerCase() || '').includes(search) ||
      (s.body?.toLowerCase() || '').includes(search) ||
      (s.leed?.toLowerCase() || '').includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-[#fdfcf9] text-[#1a1a1a] font-sans selection:bg-[#c8a84b] selection:text-white">
      {/* Header */}
      <header className="bg-[#1a3a5c] text-white py-12 px-4 sm:px-6 border-b-8 border-[#c8a84b]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4 text-[#c8a84b]">
            <FileText size={20} className="shrink-0" />
            <span className="text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase">Síntese de Imprensa</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-serif font-black tracking-tight leading-tight uppercase">
            NOTÍCIAS RELEVANTES NA IMPRENSA NO <span className="text-[#c8a84b]">REINO DA BÉLGICA E LUXEMBURGO</span>
          </h1>
          <p className="mt-4 text-blue-200 font-serif italic text-base sm:text-lg opacity-80 uppercase tracking-widest leading-snug">
            Análise de Política, Economia e Diplomacia
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Controls */}
        <div className="mb-12 flex flex-col gap-6 border-b border-gray-200 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex flex-col xs:flex-row items-stretch sm:items-center gap-4">
              <div className="flex items-center bg-white border border-gray-200 p-1 shadow-sm w-full xs:w-auto">
                <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 transition-colors text-[#1a3a5c]">
                  <ChevronLeft size={20} />
                </button>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1 w-full px-2 sm:px-4 py-1 text-sm font-bold text-[#1a3a5c] focus:outline-none min-w-0"
                />
                <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 transition-colors text-[#1a3a5c]">
                  <ChevronRight size={20} />
                </button>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-[#1a3a5c] text-white px-6 sm:px-8 py-3 rounded-none font-bold uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-3 hover:bg-[#2a4a6c] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 w-full xs:w-auto"
              >
                {generating ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                {generating ? 'Processando...' : 'Gerar Síntese'}
              </button>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-gray-100 pt-6 sm:pt-0">
              <button className="text-[#1a3a5c] hover:text-[#c8a84b] transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                <Mail size={16} />
                <span>Notificar</span>
              </button>
              <div className="flex items-center gap-2 text-gray-400 group cursor-help relative">
                <Info size={16} />
                <span className="text-[10px] uppercase tracking-wider font-bold">Info</span>
                <div className="hidden group-hover:block absolute right-0 top-full bg-white p-4 border border-gray-200 shadow-xl w-64 z-50 mt-2 text-xs leading-relaxed text-gray-600">
                  Monitoramento: Belga News, Le Soir, De Standaard, Luxembourg Times. 
                  Redação: Norma de 1945.
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input 
              type="text"
              placeholder="Pesquisar na síntese de hoje..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-b-2 border-gray-100 py-3 sm:py-4 px-0 text-lg sm:text-xl font-serif italic focus:outline-none focus:border-[#c8a84b] transition-colors placeholder:text-gray-200"
            />
          </div>
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 text-gray-400"
            >
              <Loader2 className="animate-spin mb-4" size={48} />
              <p className="font-serif italic text-xl text-center leading-relaxed">Carregando arquivos de imagem e texto...</p>
            </motion.div>
          ) : generating ? (
            <motion.div 
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 text-gray-400 text-center"
            >
              <Loader2 className="animate-spin mb-4" size={48} />
              <p className="font-serif italic text-xl">Processando síntese de imprensa internacional...</p>
              <p className="text-xs mt-2 uppercase tracking-widest">Redigindo em norma de 1945 para ${selectedDate}</p>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 border-l-4 border-red-500 p-8 text-red-800"
            >
              <p className="font-serif text-xl mb-2 italic">Aviso de Sistema</p>
              <div className="text-sm space-y-2">
                <p>{error}</p>
                {!apiKey && (
                  <p className="mt-2 font-bold p-2 bg-red-100 rounded">
                    ERRO: A chave de API (GEMINI_API_KEY) não foi detectada. Verifique as variáveis de ambiente na Vercel.
                  </p>
                )}
              </div>
              <button 
                onClick={handleGenerate}
                className="mt-4 text-sm font-bold underline uppercase tracking-widest"
              >
                Tentar novamente
              </button>
            </motion.div>
          ) : filteredSinteses.length > 0 ? (
            <motion.div key="results" className="space-y-12">
              {filteredSinteses.map((item) => (
                <SinteseCard key={item.id} sintese={item} />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-32 border-2 border-dashed border-gray-200"
            >
              <Newspaper size={48} className="mx-auto mb-4 text-gray-200" />
              <p className="font-serif italic text-2xl text-gray-400">
                {searchTerm ? 'Nenhum resultado para a pesquisa.' : 'Nenhuma síntese encontrada para esta data.'}
              </p>
              <p className="text-xs mt-2 text-gray-400 uppercase tracking-widest">
                {searchTerm ? 'Tente outros termos ou limpe a pesquisa' : 'Clique em "Gerar Síntese" para iniciar a pesquisa em tempo real'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer */}
      <footer className="bg-[#1a3a5c] text-white py-12 px-6 mt-32">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="col-span-2">
            <h3 className="font-serif text-2xl mb-4 text-[#c8a84b]">Informação Institucional</h3>
            <p className="text-blue-100 leading-relaxed font-serif italic text-lg opacity-95">
              Serviços de Comunicação Institucional e Imprensa (SCII) da Embaixada da República de Angola no Reino da Bélgica, no Grão-Ducado de Luxemburgo e Junto da União Europeia.
            </p>
          </div>
          <div className="flex flex-col justify-end">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#c8a84b] font-bold mb-4">Fontes Monitorizadas</p>
            <ul className="text-[11px] text-blue-100 opacity-70 grid grid-cols-2 gap-x-4 gap-y-2">
              <li>Belga News Agency</li>
              <li>Le Soir (BE)</li>
              <li>De Standaard (BE)</li>
              <li>Luxembourg Times</li>
              <li>L'Echo (BE)</li>
              <li>Wort.lu (LUX)</li>
              <li>RTBF / VRT</li>
              <li>The Brussels Times</li>
            </ul>
          </div>
        </div>
        <div className="max-w-4xl mx-auto mt-12 pt-8 border-t border-blue-900 text-[10px] uppercase tracking-widest text-[#c8a84b] text-center font-bold">
          © 2026 SCII Embaixada de Angola na Bélgica • Síntese Automática
        </div>
      </footer>
    </div>
  );
}

