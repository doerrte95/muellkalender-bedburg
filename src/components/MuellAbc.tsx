'use client';

import { useState } from 'react';
import { muellAbcData, getBinColor } from '@/lib/muellAbcData';
import { Search, Info } from 'lucide-react';

export default function MuellAbc() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = muellAbcData.filter(item => 
    item.begriff.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.tonne.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-slim fade-in pb-24">
      <header className="bg-white rounded-xl p-6 shadow-sm mb-6 mt-6">
        <h2 className="font-bold text-2xl text-gray-800 mb-2">Müll-ABC</h2>
        <p className="text-sm text-gray-500 mb-6">Was gehört in welche Tonne? Such einfach nach dem Begriff.</p>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="search"
            placeholder="z.B. Pizzakarton oder Batterien"
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Keine Einträge für &quot;{searchTerm}&quot; gefunden.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredItems.map((item, idx) => (
              <li key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.begriff}</h3>
                    {item.info && (
                      <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                        <Info size={14} className="min-w-[14px] mt-[1px] text-blue-400" />
                        <span>{item.info}</span>
                      </p>
                    )}
                  </div>
                  <span 
                    className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap shadow-sm mt-0.5"
                    style={{ backgroundColor: getBinColor(item.tonne) }}
                  >
                    {item.tonne}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
