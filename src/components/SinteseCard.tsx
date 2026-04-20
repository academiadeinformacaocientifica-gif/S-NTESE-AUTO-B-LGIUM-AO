import React from 'react';
import { ExternalLink, Newspaper, Tag, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface SinteseCardProps {
  sintese: {
    title: string;
    leed: string;
    body: string;
    link: string;
    source: string;
    category: string;
  };
}

export const SinteseCard: React.FC<SinteseCardProps> = ({ sintese }) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    const text = `Título: ${sintese.title}\nLEED: ${sintese.leed}\nCorpo da Notícia: ${sintese.body}\nLink: ${sintese.link}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-b border-gray-200 pb-10 sm:pb-12 mb-10 sm:mb-12 last:border-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase rounded ${
            sintese.category === 'Economia' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {sintese.category}
          </span>
          <span className="text-[9px] sm:text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Newspaper size={12} className="shrink-0" />
            {sintese.source}
          </span>
        </div>
        <button 
          onClick={copyToClipboard}
          className="text-gray-400 hover:text-[#c8a84b] transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-gray-50 px-2 py-1 rounded sm:bg-transparent sm:p-0"
          title="Copiar em formato Google Doc"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>

      <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#1a3a5c] font-bold leading-tight mb-6 hover:text-[#c8a84b] transition-colors">
        <a href={sintese.link || '#'} target="_blank" rel="noopener noreferrer">
          {sintese.title || 'Sem Título'}
        </a>
      </h2>

      <div className="border-l-4 border-[#c8a84b] pl-4 sm:pl-6 mb-8 italic text-gray-600 leading-relaxed font-serif text-base sm:text-lg">
        <p>{sintese.leed || 'Resumo indisponível.'}</p>
      </div>

      <div className="space-y-4 sm:space-y-6 text-gray-800 leading-relaxed text-base sm:text-lg font-sans">
        {(sintese.body || '').split('\n').map((paragraph, idx) => (
          <p key={idx}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col xs:flex-row justify-between items-start xs:items-center gap-4">
        {sintese.link && (
          <a 
            href={sintese.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-bold text-[#1a3a5c] hover:text-[#c8a84b] transition-colors uppercase tracking-wider"
          >
            <ExternalLink size={16} />
            Ler notícia original
          </a>
        )}
      </div>
    </motion.div>
  );
};

