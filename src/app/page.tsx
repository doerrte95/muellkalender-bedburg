'use client';

import { useState, useEffect } from 'react';
import { CollectionEvent, Street } from '@/lib/api';
import { format, isAfter, parseISO, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Trash2, MapPin, Truck } from 'lucide-react';
import CalendarView from '@/components/CalendarView';
import WeeklyView from '@/components/WeeklyView';
import YearlyView from '@/components/YearlyView';

export default function Home() {
  const [streets, setStreets] = useState<Street[]>([]);
  const [ortsteile, setOrtsteile] = useState<string[]>([]);
  
  const [plz, setPlz] = useState('');
  const [selectedOrtsteil, setSelectedOrtsteil] = useState('');
  const [selectedStreet, setSelectedStreet] = useState<Street | null>(null);
  const [houseNr, setHouseNr] = useState('');
  
  const [viewMode, setViewMode] = useState<'list' | 'week' | 'month' | 'year'>('month');
  const [reminderDays, setReminderDays] = useState(1);
  const [reminderTime, setReminderTime] = useState('18:00');
  
  const [collections, setCollections] = useState<CollectionEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<'wizard' | 'main'>('wizard');
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);

  useEffect(() => {
    // Load persisted data
    const savedStreet = localStorage.getItem('bedburg_muell_street');
    const savedHouseNr = localStorage.getItem('bedburg_muell_houseNr');
    const savedReminder = localStorage.getItem('bedburg_muell_reminder');
    const savedTime = localStorage.getItem('bedburg_muell_time');
    
    if (savedStreet) setSelectedStreet(JSON.parse(savedStreet));
    if (savedHouseNr) setHouseNr(savedHouseNr);
    if (savedReminder) setReminderDays(parseInt(savedReminder));
    if (savedTime) setReminderTime(savedTime);
    
    if (savedStreet && savedHouseNr) {
      setView('main');
    }
    
    setHydrated(true);
    checkSubscription();
    loadAllStreets();
  }, []);

  async function checkSubscription() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const sub = await registration.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadAllStreets() {
    try {
      const url = `https://buerger-portal-bedburg.azurewebsites.net/api/Strassen?%24filter=Ort%2FOrteId%20eq%201&%24orderby=Name+asc`;
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      const results = data.d?.results || data.d || data.value || data || [];
      const allStreets = Array.isArray(results) ? results : [];
      setStreets(allStreets);
      
      const uniqueOrtsteile = Array.from(new Set(allStreets.map(s => s.OrtsteilName).filter(Boolean))) as string[];
      setOrtsteile(uniqueOrtsteile.sort());
    } catch (err) {
      console.error('Fehler beim Laden der Straßen', err);
    }
  }

  useEffect(() => {
    if (view === 'main' && selectedStreet && houseNr && hydrated) {
      loadCollections();
    }
  }, [view, selectedStreet, houseNr, hydrated]);

  async function loadCollections() {
    if (!selectedStreet || !houseNr) return;
    setLoading(true);
    try {
      const year = new Date().getFullYear();
      const expandQuery = "%24expand=Abfuhrplan%2CAbfuhrplan%2FGefaesstarifArt%2FAbfallart%2CAbfuhrplan%2FGefaesstarifArt%2FVolumenObj";
      const orderQuery = "%24orderby=Abfuhrplan%2FGefaesstarifArt%2FAbfallart%2FName%2CAbfuhrplan%2FGefaesstarifArt%2FVolumenObj%2FVolumenWert";
      
      // Bedburg is orteId=1. We use selectedOrtsteil from the state.
      const targetUrl = `https://buerger-portal-bedburg.azurewebsites.net/api/AbfuhrtermineAbJahr?${expandQuery}&${orderQuery}&orteId=1&strassenId=${selectedStreet.StrassenId}&ortsteil='${encodeURIComponent(selectedOrtsteil)}'&hausNr='${encodeURIComponent(houseNr)}'&jahr=${year}`;

      const response = await fetch(`/api/proxy?url=${encodeURIComponent(targetUrl)}`);
      const data = await response.json();
      
      const results = data.d?.results || data.d || data.value || data || [];
      const events: CollectionEvent[] = [];
      
      if (Array.isArray(results)) {
        results.forEach((c: any) => {
          const dateStr = c.Termin || '';
          const match = dateStr.match(/\d+/);
          if (match) {
            const dateObj = new Date(parseInt(match[0], 10));
            const rawName = c.Abfuhrplan?.GefaesstarifArt?.Abfallart?.Name;
            
            if (rawName) {
              const mappedName = mapWasteName(rawName);
              const dateIso = dateObj.toISOString();
              
              // Deduplicate: Check if this exact waste type already exists on this exact day
              if (!events.find(e => e.Datum === dateIso && e.AbfallartName === mappedName)) {
                events.push({
                  Datum: dateIso,
                  AbfallartName: mappedName
                });
              }
            }
          }
        });
      }
      
      setCollections(events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }


  const handleCreateCalendar = async () => {
    if (!selectedStreet || !houseNr) return;
    localStorage.setItem('bedburg_muell_street', JSON.stringify(selectedStreet));
    localStorage.setItem('bedburg_muell_houseNr', houseNr);
    localStorage.setItem('bedburg_muell_reminder', reminderDays.toString());
    localStorage.setItem('bedburg_muell_time', reminderTime);
    setView('main');

    if (isSubscribed) {
      await subscribeToPush(selectedStreet.StrassenId.toString(), houseNr);
    }
  };

  const subscribeToPush = async (streetIdStr?: string, houseNrStr?: string) => {
    setIsPushLoading(true);
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const vapidRes = await fetch('/api/push/vapidPublicKey');
      const { publicKey } = await vapidRes.json();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          streetId: streetIdStr || selectedStreet?.StrassenId.toString(),
          houseNr: houseNrStr || houseNr,
          reminderDays,
          reminderTime
        })
      });

      setIsSubscribed(true);
    } catch (err) {
      console.error('Push subscription failed:', err);
      alert('Fehler bei der Push-Aktivierung. Bitte Berechtigungen prüfen.');
    } finally {
      setIsPushLoading(false);
    }
  };

  const testPush = async () => {
    if (!('serviceWorker' in navigator)) return;
    const registration = await navigator.serviceWorker.getRegistration();
    const sub = await registration?.pushManager.getSubscription();
    if (!sub) return;

    await fetch('/api/push/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint })
    });
  };

  if (!hydrated) return null;

  const filteredStreets = streets.filter(s => s.OrtsteilName === selectedOrtsteil);

  if (view === 'wizard') {
    return (
      <div className="wizard-container fade-in">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Willkommen! 🚛</h1>
            <p className="text-sm text-gray-500">Personalisiere deinen Kalender mit deiner Adresse.</p>
          </div>

          <div className="input-group">
            <label className="label">Postleitzahl</label>
            <input 
              type="text" 
              className="input font-bold" 
              value={plz}
              onChange={(e) => setPlz(e.target.value)}
              placeholder="50181"
            />
            {plz === '50181' && (
              <div className="status-text status-success mt-2">
                <MapPin size={12} /> Bedburg erkannt
              </div>
            )}
          </div>

          <div className="input-group">
            <label className="label">Ortsteil</label>
            <div className="select-wrapper">
              <select 
                className="select"
                value={selectedOrtsteil}
                onChange={(e) => {
                  setSelectedOrtsteil(e.target.value);
                  setSelectedStreet(null);
                }}
              >
                <option value="" disabled>Bitte wählen...</option>
                {ortsteile.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="label">Straße</label>
            <div className="select-wrapper">
              <select 
                className="select"
                value={selectedStreet?.StrassenId || ''}
                onChange={(e) => {
                  const s = streets.find(str => str.StrassenId === parseInt(e.target.value));
                  if (s) setSelectedStreet(s);
                }}
                disabled={!selectedOrtsteil}
              >
                <option value="" disabled>Bitte wählen...</option>
                {filteredStreets.map(s => <option key={s.StrassenId} value={s.StrassenId}>{s.Name}</option>)}
              </select>
            </div>
          </div>

          <div className="input-group mb-8">
            <label className="label">Hausnummer</label>
            <input 
              type="text" 
              className="input" 
              value={houseNr}
              onChange={(e) => setHouseNr(e.target.value)}
              placeholder="z.B. 12"
            />
          </div>

          <button 
            className="btn-primary"
            disabled={!selectedStreet || !houseNr}
            onClick={handleCreateCalendar}
          >
            Kalender erstellen
          </button>
        </div>
      </div>
    );
  }

  // MAIN VIEW (Kalender)
  const today = startOfDay(new Date());
  const nextCollections = collections
    .filter(c => {
      if (!c || !c.Datum) return false;
      const collectionDate = parseISO(c.Datum);
      return isAfter(collectionDate, today) || format(collectionDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    })
    .sort((a, b) => {
      if (!a.Datum || !b.Datum) return 0;
      return parseISO(a.Datum).getTime() - parseISO(b.Datum).getTime();
    });

  const upcoming = nextCollections[0];

  return (
    <div className="container-slim fade-in">
      <header className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm mb-6">
        <div>
          <h2 className="font-bold text-gray-800">Bedburg {selectedStreet?.OrtsteilName?.replace('Bedburg/', '')}</h2>
          <p className="text-xs text-gray-500">{selectedStreet?.Name} {houseNr}</p>
        </div>
        <button onClick={() => setView('wizard')} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200">
          ⚙️
        </button>
      </header>

      {/* Benachrichtigungseinstellungen (Neu integriert ins helle Design) */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6 border border-gray-100">
        <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
          <Truck size={16} className="text-green-600" /> Abhol-Erinnerungen
        </h3>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Wann?</label>
            <select 
              value={reminderDays} 
              onChange={(e) => setReminderDays(parseInt(e.target.value))}
              className="w-full bg-gray-50 p-2 rounded text-sm border border-gray-200"
            >
              <option value={0}>Am selben Tag</option>
              <option value={1}>1 Tag vorher</option>
              <option value={2}>2 Tage vorher</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Uhrzeit</label>
            <select 
              value={reminderTime} 
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full bg-gray-50 p-2 rounded text-sm border border-gray-200"
            >
              <option value="07:00">07:00 Uhr</option>
              <option value="12:00">12:00 Uhr</option>
              <option value="18:00">18:00 Uhr</option>
              <option value="20:00">20:00 Uhr</option>
            </select>
          </div>
        </div>

        {!isSubscribed ? (
          <button 
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-all text-sm"
            onClick={() => subscribeToPush()}
            disabled={isPushLoading}
          >
            {isPushLoading ? 'Aktiviert...' : '🔔 Push aktivieren'}
          </button>
        ) : (
          <div className="bg-green-50 text-green-700 p-2 rounded text-sm font-bold border border-green-200 flex justify-between items-center">
            <span>🔔 Aktiv</span>
            <button onClick={testPush} className="text-xs bg-white px-2 py-1 rounded shadow-sm hover:bg-gray-50 text-gray-700">
              Test
            </button>
          </div>
        )}
      </div>

      <main>
        {loading ? (
          <div className="text-center p-8 text-gray-500">Lade Termine...</div>
        ) : collections.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <p className="text-gray-500 mb-4">Keine Termine gefunden.</p>
          </div>
        ) : (
          <>
            {upcoming && (
              <div className="bg-white rounded-xl p-6 shadow-sm mb-6 border-l-4" style={{ borderColor: getWasteColor(upcoming.AbfallartName) }}>
                <h3 className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">Nächste Leerung</h3>
                <div className="text-2xl font-black mb-1 text-gray-800">
                  {upcoming.AbfallartName}
                </div>
                <div className="text-gray-600 font-medium">
                  {format(parseISO(upcoming.Datum), 'EEEE, dd. MMMM', { locale: de })}
                </div>
              </div>
            )}

            <nav className="flex bg-white rounded-lg p-1 shadow-sm mb-6">
              {['list', 'week', 'month', 'year'].map((mode) => (
                <button 
                  key={mode}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${viewMode === mode ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500'}`}
                  onClick={() => setViewMode(mode as any)}
                >
                  {mode === 'list' && 'Liste'}
                  {mode === 'week' && 'Woche'}
                  {mode === 'month' && 'Monat'}
                  {mode === 'year' && 'Jahr'}
                </button>
              ))}
            </nav>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              {viewMode === 'list' && (
                <div className="grid gap-3">
                  {nextCollections.slice(0, 10).map((c, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: getWasteColor(c.AbfallartName) }}
                        />
                        <div>
                          <div className="font-bold text-gray-800 text-sm">{c.AbfallartName}</div>
                          <div className="text-xs text-gray-500">
                            {format(parseISO(c.Datum), 'EEEE, dd.MM.yyyy', { locale: de })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {viewMode === 'week' && <WeeklyView collections={collections} />}
              {viewMode === 'month' && <CalendarView collections={collections} />}
              {viewMode === 'year' && <YearlyView collections={collections} />}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function mapWasteName(name: string) {
  if (!name) return 'Unbekannt';
  const n = name.toLowerCase();
  if (n.includes('lvp') || n.includes('gelb') || n.includes('leicht')) return 'Gelbe Tonne';
  if (n.includes('rest')) return 'Restmüll';
  if (n.includes('bio') || n.includes('grün')) return 'Biomüll';
  if (n.includes('papier') || n.includes('papp')) return 'Papier';
  return name;
}

function getWasteColor(type: string) {
  if (type.includes('Rest')) return '#424242'; // Drekopf Restmüll
  if (type.includes('Bio') || type.includes('Grün')) return '#2e7d32'; // Drekopf Biotonne / Grünschnitt
  if (type.includes('Papier')) return '#1976d2'; // Drekopf Altpapier
  if (type.includes('Gelb') || type.includes('LVP') || type.includes('Leicht')) return '#fbc02d'; // Schönmackers Gelbe Tonne
  return '#9ca3af';
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
