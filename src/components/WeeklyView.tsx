'use client';

import { CollectionEvent } from '@/lib/api';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  parseISO,
  addWeeks,
  subWeeks
} from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface WeeklyViewProps {
  collections: CollectionEvent[];
}

export default function WeeklyView({ collections }: WeeklyViewProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: weekEnd,
  });

  const getCollectionsForDay = (day: Date) => {
    return collections.filter(c => isSameDay(parseISO(c.Datum), day));
  };

  return (
    <div className="glass p-6 fade-in">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold">
          KW {format(currentWeek, 'I')} ({format(weekStart, 'dd.MM.')} - {format(weekEnd, 'dd.MM.')})
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))} className="glass p-2">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))} className="glass p-2">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {weekDays.map((day, i) => {
          const dayCollections = getCollectionsForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div 
              key={i} 
              className={`p-4 rounded-xl border flex items-center justify-between ${
                isToday ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-center min-w-[50px]">
                  <div className="text-xs uppercase opacity-50 font-bold">{format(day, 'eee', { locale: de })}</div>
                  <div className={`text-xl font-black ${isToday ? 'text-blue-400' : ''}`}>{format(day, 'd')}</div>
                </div>
                <div className="h-10 w-px bg-white/10" />
                <div>
                  {dayCollections.length > 0 ? (
                    dayCollections.map((c, j) => (
                      <div key={j} className="flex items-center gap-2 font-bold" style={{ color: getWasteColor(c.AbfallartName) }}>
                        <Trash2 size={16} /> {c.AbfallartName}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm opacity-30 italic">Keine Leerungen</div>
                  )}
                </div>
              </div>
              {isToday && <div className="text-[10px] bg-blue-500 px-2 py-1 rounded-full font-bold">HEUTE</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getWasteColor(type: string) {
  if (type.includes('Rest')) return '#9ca3af';
  if (type.includes('Bio')) return '#10b981';
  if (type.includes('Papier')) return '#3b82f6';
  if (type.includes('Gelb') || type.includes('LVP')) return '#f59e0b';
  return '#ffffff';
}
