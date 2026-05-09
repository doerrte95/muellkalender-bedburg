'use client';

import { useState, useEffect } from 'react';
import { Street, fetchStreets } from '@/lib/api';

interface StreetSelectorProps {
  onSelect: (street: Street) => void;
}

export default function StreetSelector({ onSelect }: StreetSelectorProps) {
  const [streets, setStreets] = useState<Street[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStreets() {
      try {
        // Use the proxy directly here
        const filter = encodeURIComponent(`Ort/OrteId eq 1 and OrtsteilName eq 'Rath'`);
        const url = `https://buerger-portal-bedburg.azurewebsites.net/api/Strassen?%24filter=${filter}&%24orderby=Name+asc`;
        
        const response = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        console.log('StreetSelector data:', data);
        const results = data.d?.results || data.d || data.value || data || [];
        setStreets(Array.isArray(results) ? results : []);
      } catch (err) {
        setError('Fehler beim Laden der Straßen');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStreets();
  }, []);

  if (loading) return <div className="text-center p-4">Lade Straßen...</div>;
  if (error) return <div className="text-center p-4 text-red-400">{error}</div>;

  return (
    <div className="fade-in">
      <label className="block mb-2 font-semibold">Deine Straße in Rath auswählen:</label>
      <select 
        onChange={(e) => {
          const street = streets.find(s => s.StrassenId === parseInt(e.target.value));
          if (street) onSelect(street);
        }}
        defaultValue=""
      >
        <option value="" disabled>Bitte wählen...</option>
        {streets.map((street) => (
          <option key={street.StrassenId} value={street.StrassenId}>
            {street.Name}
          </option>
        ))}
      </select>
    </div>
  );
}
