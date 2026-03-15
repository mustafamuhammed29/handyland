import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Laptop, Watch, Headphones, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

interface MegaMenuProps {
  label: React.ReactNode;
  icon: React.ReactNode;
  isActive: boolean;
  path: string;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({ label, icon, isActive, path }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation();

  const categories = [
    { name: t('categories.phones', 'Smartphones'), icon: <Smartphone className="w-6 h-6" />, link: '/market?category=Smartphones', color: 'from-blue-500 to-cyan-500' },
    { name: t('categories.laptops', 'Laptops'), icon: <Laptop className="w-6 h-6" />, link: '/market?category=Laptops', color: 'from-purple-500 to-pink-500' },
    { name: t('categories.watches', 'Watches'), icon: <Watch className="w-6 h-6" />, link: '/market?category=Watches', color: 'from-emerald-500 to-teal-500' },
    { name: t('categories.accessories', 'Accessories'), icon: <Headphones className="w-6 h-6" />, link: '/market?category=Accessories', color: 'from-orange-500 to-red-500' }
  ];

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        to={path}
        className={`relative flex items-center gap-2 px-3 xl:px-4 py-2 rounded-full text-[11px] xl:text-xs font-bold uppercase tracking-widest transition-all duration-300 group overflow-hidden whitespace-nowrap ${isActive
            ? 'text-slate-900 dark:text-white bg-black/5 dark:bg-white/5'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
        }`}
      >
        <span className={`relative z-10 flex items-center gap-2 transition-transform duration-300 ${isActive ? '' : 'group-hover:-translate-y-[1px]'}`}>
            <span className={`transition-colors duration-300 ${isActive ? 'text-brand-primary' : 'text-slate-400 dark:text-slate-500 group-hover:text-brand-primary'}`}>
            {icon}
            </span>
            <span>{label}</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isHovered ? 'rotate-180 text-brand-primary' : ''}`} />
        </span>
        
        {isActive && (
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-brand-primary rounded-t-full shadow-[0_0_12px_rgba(6,182,212,0.8)] animate-in fade-in zoom-in duration-300"></span>
        )}
      </Link>

      <AnimatePresence>
        {isHovered && (
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[600px] bg-white/95 dark:bg-[#0b1121]/95 backdrop-blur-3xl border border-black/5 dark:border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)] p-6 grid grid-cols-2 gap-4 z-50 pointer-events-auto"
          >
            {categories.map((cat, idx) => (
              <Link 
                key={idx} 
                to={cat.link}
                className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                onClick={() => setIsHovered(false)}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {cat.icon}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-brand-primary transition-colors">{cat.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('common.browse', 'Browse')} {cat.name}</p>
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
