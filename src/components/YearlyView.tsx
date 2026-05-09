'use client';

import { CollectionEvent } from '@/lib/api';
import { 
  format, 
  eachMonthOfInterval,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  startOfMonth,
  endOfMonth
} from 'date-fns';
import { de } from 'date-fns/locale';

interface YearlyViewProps {
  collections: CollectionEvent[];
}

export default function YearlyView({ collections }: YearlyViewProps) {
  const currentYear = new Date().getFullYear();
  const yearStart = startOfYear(new Date());
  const yearEnd = endOfYear(yearStart);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 fade-in">
      {months.map((month, i) => (
        <div key={i} className="glass p-4">
          <h3 className="text-lg font-bold mb-3 capitalize border-b border-white/10 pb-2">
            {format(month, 'MMMM', { locale: de })}
          </h3>
          <div className="grid grid-cols-7 gap-1">
            {eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }).map((day, j) => {
              const dayCollections = collections.filter(c => isSameDay(parseISO(c.Datum), day));
              return (
                <div 
                  key={j} 
                  className={`w-full aspect-square rounded-sm flex items-center justify-center text-[8px] transition-all hover:scale-125 hover:z-10 ${
                    dayCollections.length > 0 ? 'ring-1 ring-white/20' : 'opacity-20'
                  }`}
                  style={{ 
                    backgroundColor: dayCollections.length > 0 ? getWasteColor(dayCollections[0].AbfallartName) : 'transparent',
                    color: dayCollections.length > 0 ? 'white' : 'inherit'
                  }}
                >
                  {format(day, 'd')}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function getWasteColor(type: string) {
  if (type.includes('Rest')) return '#4b5563';
  if (type.includes('Bio')) return '#059669';
  if (type.includes('Papier')) return '#2563eb';
  if (type.includes('Gelb') || type.includes('LVP')) return '#d97706';
  return 'transparent';
}
