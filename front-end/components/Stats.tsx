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
      { threshold: 0.1 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
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

export const Stats: React.FC = () => {
  const { settings } = useSettings();

  const stats = [
    {
      icon: <Wrench className="w-6 h-6" />,
      value: settings.stats.devicesRepaired,
      suffix: '+',
      label: 'Devices Repaired',
      color: 'text-cyan-400',
      border: 'group-hover:border-cyan-500/50',
      bg: 'group-hover:bg-cyan-500/10'
    },
    {
      icon: <Users className="w-6 h-6" />,
      value: settings.stats.happyCustomers,
      suffix: '+',
      label: 'Happy Customers',
      color: 'text-purple-400',
      border: 'group-hover:border-purple-500/50',
      bg: 'group-hover:bg-purple-500/10'
    },
    {
      icon: <Star className="w-6 h-6" />,
      value: settings.stats.averageRating,
      suffix: '/5',
      label: 'Average Rating',
      color: 'text-yellow-400',
      border: 'group-hover:border-yellow-500/50',
      bg: 'group-hover:bg-yellow-500/10',
      isDecimal: true
    },
    {
      icon: <History className="w-6 h-6" />,
      value: settings.stats.marketExperience,
      suffix: ' Years',
      label: 'Market Experience',
      color: 'text-emerald-400',
      border: 'group-hover:border-emerald-500/50',
      bg: 'group-hover:bg-emerald-500/10'
    },
  ];

  return (
    <section className="relative py-20 bg-slate-950 border-y border-slate-900 overflow-hidden">

      {/* Animated Background Mesh */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="flex items-center gap-3 mb-10 justify-center md:justify-start opacity-80">
          <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
          <span className="text-sm font-mono text-blue-400 uppercase tracking-[0.2em]">Live Performance Data</span>
          <div className="h-px bg-gradient-to-r from-blue-500/50 to-transparent w-32"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`group relative p-6 rounded-2xl bg-slate-900/40 border border-slate-800 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 ${stat.border}`}
            >
              {/* Hover Glow Effect */}
              <div className={`absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 ${stat.bg}`}></div>

              <div className="relative z-10 flex flex-col items-center md:items-start">
                {/* Icon Container */}
                <div className={`w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-4 shadow-lg ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                  {stat.icon}
                </div>

                {/* Value */}
                <div className="text-4xl lg:text-5xl font-black text-white mb-2 tracking-tight">
                  {stat.isDecimal ? (
                    <span>{stat.value}{stat.suffix}</span>
                  ) : (
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  )}
                </div>

                {/* Label */}
                <div className="text-sm font-medium text-slate-400 uppercase tracking-wide group-hover:text-slate-300 transition-colors">
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