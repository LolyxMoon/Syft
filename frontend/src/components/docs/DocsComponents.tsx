import { motion } from 'framer-motion';
import { ChevronRight, Check, Copy } from 'lucide-react';
import { useState } from 'react';

export const PageHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-3 mb-8"
  >
    <div className="w-12 h-12 bg-[#dce85d]/10 border border-[#dce85d]/30 rounded-xl flex items-center justify-center text-[#dce85d]">
      {icon}
    </div>
    <h1 className="text-4xl font-bold text-white">{title}</h1>
  </motion.div>
);

export const Section = ({ id, title, children }: { id?: string; title?: string; children: React.ReactNode }) => (
  <section id={id} className="mb-12">
    {title && <h2 className="text-2xl font-semibold text-white mb-4">{title}</h2>}
    <div className="space-y-4 text-white/70 leading-relaxed">
      {children}
    </div>
  </section>
);

export const FeatureGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
    {children}
  </div>
);

export const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="bg-gradient-to-br from-[#dce85d]/10 to-transparent border border-[#dce85d]/20 rounded-xl p-6 hover:border-[#dce85d]/40 transition-all">
    <div className="w-10 h-10 bg-[#dce85d]/20 border border-[#dce85d] rounded-lg flex items-center justify-center text-[#dce85d] mb-3">
      {icon}
    </div>
    <h3 className="text-white font-semibold mb-2">{title}</h3>
    <p className="text-white/60 text-sm">{description}</p>
  </div>
);

export const FeatureItem = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="flex gap-4 p-4 bg-[#0a0b0c] border border-white/10 rounded-lg hover:border-[#dce85d]/30 transition-colors">
    <div className="flex-shrink-0 w-10 h-10 bg-[#dce85d]/10 border border-[#dce85d]/30 rounded-lg flex items-center justify-center text-[#dce85d]">
      {icon}
    </div>
    <div>
      <h4 className="text-white font-medium mb-1">{title}</h4>
      <p className="text-white/60 text-sm">{description}</p>
    </div>
  </div>
);

export const InfoCard = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <div className="bg-[#0a0b0c] border border-white/10 rounded-xl p-6">
    {title && <h3 className="text-white font-semibold mb-4">{title}</h3>}
    {children}
  </div>
);

export const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div className="mb-3 last:mb-0">
    <span className="text-white/50 text-sm">{label}:</span>
    <p className="text-white/80 font-mono text-sm break-all mt-1">{value}</p>
  </div>
);

export const CodeBlock = ({ code, language = 'bash' }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      <div className="absolute right-2 top-2 z-10">
        <button
          onClick={copyToClipboard}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          {copied ? (
            <Check className="w-4 h-4 text-[#dce85d]" />
          ) : (
            <Copy className="w-4 h-4 text-white/60" />
          )}
        </button>
      </div>
      <pre className="bg-[#0a0b0c] border border-white/10 rounded-xl p-4 overflow-x-auto">
        <code className={`language-${language} text-sm text-white/80 font-mono`}>
          {code}
        </code>
      </pre>
    </div>
  );
};

export const OrderedList = ({ items, children }: { items?: { title: string; description: string; code?: { language: string; code: string } }[]; children?: React.ReactNode }) => {
  if (items) {
    return (
      <ol className="space-y-6 text-white/70">
        {items.map((item, index) => (
          <li key={index} className="flex gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-[#dce85d]/20 border border-[#dce85d] rounded-full flex items-center justify-center text-[#dce85d] font-bold text-sm mt-1">
              {index + 1}
            </span>
            <div className="flex-1">
              <strong className="text-white block mb-1">{item.title}</strong>
              <p className="text-white/70 text-sm mb-3">{item.description}</p>
              {item.code && <CodeBlock language={item.code.language} code={item.code.code} />}
            </div>
          </li>
        ))}
      </ol>
    );
  }
  
  return (
    <ol className="space-y-4 text-white/70">
      {children}
    </ol>
  );
};

export const OrderedListItem = ({ number, title, description }: { number: number; title: string; description: string }) => (
  <li className="flex gap-3">
    <span className="flex-shrink-0 w-8 h-8 bg-[#dce85d]/20 border border-[#dce85d] rounded-full flex items-center justify-center text-[#dce85d] font-bold text-sm">
      {number}
    </span>
    <div>
      <strong className="text-white">{title}:</strong> {description}
    </div>
  </li>
);

export const UnorderedList = ({ children }: { children: React.ReactNode }) => (
  <ul className="space-y-2 text-white/70">
    {children}
  </ul>
);

export const ListItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2">
    <ChevronRight className="w-5 h-5 text-[#dce85d] mt-0.5 flex-shrink-0" />
    <span>{children}</span>
  </li>
);

export const SecurityItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-3 p-3 bg-[#0a0b0c] border border-white/10 rounded-lg">
    <div className="flex-shrink-0 w-5 h-5 bg-[#dce85d]/20 border border-[#dce85d] rounded-full flex items-center justify-center">
      <Check className="w-3 h-3 text-[#dce85d]" />
    </div>
    <span className="text-white/70 text-sm">{text}</span>
  </div>
);

export const Alert = ({ type = 'info', title, children }: { type?: 'info' | 'warning' | 'success'; title?: string; children: React.ReactNode }) => {
  const colors = {
    info: 'border-blue-500/30 bg-blue-500/10',
    warning: 'border-yellow-500/30 bg-yellow-500/10',
    success: 'border-[#dce85d]/30 bg-[#dce85d]/10'
  };

  return (
    <div className={`border rounded-xl p-4 ${colors[type]}`}>
      {title && <h4 className="text-white font-semibold mb-2">{title}</h4>}
      <div className="text-white/80 text-sm">
        {children}
      </div>
    </div>
  );
};

export const ExternalLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a 
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-[#dce85d] hover:text-[#e8f06d] transition-colors inline-flex items-center gap-1"
  >
    {children}
  </a>
);
