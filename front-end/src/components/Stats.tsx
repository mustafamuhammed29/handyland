import React, { useEffect, useState, useRef } from 'react';
import { Users, Wrench, Star, History, Trophy, Activity } from 'lucide-react';

// Helper component for animated numbers
const AnimatedCounter = ({ end, duration = 2000, suffix = '' }: { end: number, duration?: number, suffix?: string }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    // Safety fallback: if observer doesn't trigger after 1.5s, just show it
    const timer = setTimeout(() => setIsVisible(true), 1500);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function for smooth stop
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return (
    <span ref={countRef} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
};

import { useSettings } from '../context/SettingsContext';
import { useTranslation } from 'react-i18next';

export const Stats: React.FC = () => {
  const { settings } = useSettings();
  const { t } = useTranslation();

  const stats = [
    {
      icon: <Wrench className="w-6 h-6" />,
      value: settings?.stats?.devicesRepaired || 250,
      suffix: '+',
      label: t('stats.devicesRepaired', 'Geräte repariert'),
      color: 'text-brand-primary',
      border: 'group-hover:border-brand-primary/50',
      bg: 'group-hover:bg-brand-primary/10'
    },
    {
      icon: <Users className="w-6 h-6" />,
      value: settings?.stats?.happyCustomers || 180,
      suffix: '+',
      label: t('stats.happyCustomers', 'Zufriedene Kunden'),
      color: 'text-purple-400',
      border: 'group-hover:border-purple-500/50',
      bg: 'group-hover:bg-purple-500/10'
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      value: settings?.stats?.yearsExperience || 2,
      suffix: '+',
      label: t('stats.yearsExperience', 'Jahre Erfahrung'),
      color: 'text-amber-400',
      border: 'group-hover:border-amber-500/50',
      bg: 'group-hover:bg-amber-500/10'
    },
    {
      icon: <Star className="w-6 h-6" />,
      value: settings?.stats?.averageRating || 4.9,
      suffix: '/5',
      label: t('stats.averageRating', 'Durchschnittsbewertung'),
      color: 'text-yellow-400',
      border: 'group-hover:border-brand-secondary/50',
      bg: 'group-hover:bg-brand-secondary/10',
      isDecimal: true
    },
  ];

  return (
    <section className="relative py-20 bg-slate-100 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-900 transition-colors duration-300">

      {/* Animated Background Mesh */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="flex items-center gap-3 mb-10 justify-center md:justify-start opacity-80">
          <Activity className="w-5 h-5 text-brand-primary animate-pulse" />
          <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em]">{t('stats.sectionTitle', 'Unsere Vertrauensmetriken')}</span>
          <div className="h-px bg-gradient-to-r from-brand-primary/50 to-transparent w-32"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`group relative p-4 md:p-6 rounded-2xl bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 flex flex-col items-center text-center ${stat.border}`}
            >
              {/* Hover Glow Effect */}
              <div className={`absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 ${stat.bg}`}></div>

              <div className="relative z-10 flex flex-col items-center w-full">
                {/* Icon Container */}
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-4 md:mb-6 shadow-xl group-hover:scale-110 transition-all duration-500 flex-shrink-0 relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 opacity-50"></div>
                  <div className="relative z-10 text-brand-primary drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                    {stat.icon}
                  </div>
                </div>

                {/* Value */}
                <div className="text-2xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-1 md:mb-2 tracking-tight">
                  {stat.isDecimal ? (
                    <span>{stat.value}{stat.suffix}</span>
                  ) : (
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  )}
                </div>

                {/* Label */}
                <div className="text-[10px] md:text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors leading-tight">
                  {stat.label}
                </div>
              </div>

              {/* Corner Accents */}
              <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className={`w-2 h-2 rounded-full ${stat.color.replace('text-', 'bg-')} animate-ping`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};