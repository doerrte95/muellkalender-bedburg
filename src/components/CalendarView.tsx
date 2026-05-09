'use client';

import { CollectionEvent } from '@/lib/api';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  parseISO,
  addMonths,
  subMonths
} from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface CalendarViewProps {
  collections: CollectionEvent[];
}

export default function CalendarView({ collections }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getCollectionsForDay = (day: Date) => {
    return collections.filter(c => isSameDay(parseISO(c.Datum), day));
  };

  return (
    <div className="glass p-4 fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: de })}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="glass p-2">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="glass p-2">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
          <div key={d} className="text-center text-xs opacity-50 font-bold py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          const dayCollections = getCollectionsForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());

          return (
            <div 
              key={i} 
              className={`min-h-[80px] p-1 border border-white/5 rounded-lg flex flex-col ${
                !isCurrentMonth ? 'opacity-20' : 'bg-white/5'
              } ${isToday ? 'border-blue-500/50 bg-blue-500/5' : ''}`}
            >
              <div className={`text-xs font-bold mb-1 ${isToday ? 'text-blue-400' : ''}`}>
                {format(day, 'd')}
              </div>
              <div className="flex flex-col gap-1">
                {dayCollections.map((c, j) => (
                  <div 
                    key={j} 
                    className="w-full h-2 rounded-full" 
                    title={c.AbfallartName}
                    style={{ backgroundColor: getWasteColor(c.AbfallartName) }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs opacity-70">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#9ca3af]"></div> Restmüll</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#10b981]"></div> Biomüll</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div> Papier</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div> Gelbe Tonne</div>
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
