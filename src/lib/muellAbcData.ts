export type WasteBin = 'Gelbe Tonne' | 'Restmüll' | 'Biomüll' | 'Papier' | 'Glascontainer' | 'Wertstoffhof' | 'Schadstoffmobil' | 'Altkleidercontainer';

export interface WasteItem {
  begriff: string;
  tonne: WasteBin;
  info?: string;
}

export const muellAbcData: WasteItem[] = ([
  { begriff: 'Pizzakarton (fettig/schmutzig)', tonne: 'Restmüll', info: 'Verschmutztes Papier gehört in den Restmüll.' },
  { begriff: 'Pizzakarton (komplett sauber)', tonne: 'Papier', info: 'Nur ohne Essensreste oder Fettränder.' },
  { begriff: 'Batterien / Akkus', tonne: 'Wertstoffhof', info: 'Können auch im Handel (Supermarkt) zurückgegeben werden.' },
  { begriff: 'Joghurtbecher', tonne: 'Gelbe Tonne', info: 'Bitte löffelrein, Deckel (Alu) komplett abtrennen.' },
  { begriff: 'Alufolie / Aludeckel', tonne: 'Gelbe Tonne' },
  { begriff: 'Windeln', tonne: 'Restmüll' },
  { begriff: 'Kaffeekapseln (Alu oder Plastik)', tonne: 'Gelbe Tonne' },
  { begriff: 'Kaffeefilter / Kaffeesatz', tonne: 'Biomüll' },
  { begriff: 'Energiesparlampen', tonne: 'Schadstoffmobil', info: 'Alternativ auch am Wertstoffhof abgeben.' },
  { begriff: 'Glühbirnen (alte Sorte)', tonne: 'Restmüll' },
  { begriff: 'LED-Lampen', tonne: 'Wertstoffhof' },
  { begriff: 'Trinkgläser', tonne: 'Restmüll', info: 'Haben einen anderen Schmelzpunkt als Flaschenglas und gehören NICHT in den Glascontainer.' },
  { begriff: 'Fensterglas / Spiegel', tonne: 'Restmüll' },
  { begriff: 'Altglas (Flaschen, Einmachgläser)', tonne: 'Glascontainer', info: 'Nach Farben sortieren (Weiß, Grün, Braun). Blaues/Rotes Glas gehört zum Grünglas.' },
  { begriff: 'CDs / DVDs', tonne: 'Wertstoffhof' },
  { begriff: 'Staubsaugerbeutel', tonne: 'Restmüll' },
  { begriff: 'Katzenstreu', tonne: 'Restmüll', info: 'Auch kompostierbare Streu muss in den Restmüll (Seuchengefahr).' },
  { begriff: 'Hundekot-Beutel', tonne: 'Restmüll' },
  { begriff: 'Elektroschrott (Kabel, kleine Geräte)', tonne: 'Wertstoffhof', info: 'Kleine Elektrogeräte können auch in Supermärkten zurückgegeben werden.' },
  { begriff: 'Konservendosen', tonne: 'Gelbe Tonne' },
  { begriff: 'Sprühdosen (leer)', tonne: 'Gelbe Tonne' },
  { begriff: 'Sprühdosen (mit Resten, z.B. Lack)', tonne: 'Schadstoffmobil' },
  { begriff: 'Medikamente (abgelaufen)', tonne: 'Restmüll', info: 'In den normalen Hausmüll geben, nicht in die Toilette!' },
  { begriff: 'Laub / Rasenschnitt', tonne: 'Biomüll' },
  { begriff: 'Äste / Strauchschnitt', tonne: 'Biomüll', info: 'Größere Mengen können auch beim Wertstoffhof abgegeben werden.' },
  { begriff: 'Fleisch- / Fischreste', tonne: 'Biomüll', info: 'Am besten in Zeitungspapier einwickeln.' },
  { begriff: 'Asche (kalt)', tonne: 'Restmüll' },
  { begriff: 'Tapetenreste', tonne: 'Restmüll', info: 'Sowohl saubere als auch dreckige Tapete gehört in den Hausmüll.' },
  { begriff: 'Kleidung (tragbar)', tonne: 'Altkleidercontainer' },
  { begriff: 'Kleidung / Stoffe (kaputt/dreckig)', tonne: 'Restmüll' },
  { begriff: 'Schuhe (tragbar, paarweise)', tonne: 'Altkleidercontainer' },
  { begriff: 'Backpapier', tonne: 'Restmüll', info: 'Backpapier ist beschichtet und darf nicht ins Altpapier.' },
  { begriff: 'Kassenzettel / Thermopapier', tonne: 'Restmüll', info: 'Wegen der Beschichtung NICHT ins Altpapier.' },
  { begriff: 'Briefumschläge (mit Fenster)', tonne: 'Papier', info: 'Das Sichtfenster muss nicht entfernt werden.' },
  { begriff: 'Papiertaschentücher / Küchenrolle', tonne: 'Restmüll', info: 'Da sie meistens verschmutzt sind.' },
  { begriff: 'Styropor (Verpackung)', tonne: 'Gelbe Tonne' },
  { begriff: 'Styropor (Dämmmaterial / Bau)', tonne: 'Wertstoffhof' },
  { begriff: 'Bratfett / Speiseöl', tonne: 'Restmüll', info: 'In einer fest verschlossenen Flasche in den Hausmüll.' },
  { begriff: 'Haare / Tierhaare', tonne: 'Restmüll' },
  { begriff: 'Zahnbürsten (Plastik)', tonne: 'Restmüll' },
  { begriff: 'Korken (Kork)', tonne: 'Wertstoffhof', info: 'Naturkorken können an vielen Sammelstellen abgegeben werden.' }
] as WasteItem[]).sort((a, b) => a.begriff.localeCompare(b.begriff));

export function getBinColor(bin: WasteBin): string {
  switch (bin) {
    case 'Restmüll': return '#757575'; // Grau
    case 'Biomüll': return '#795548'; // Braun
    case 'Papier': return '#1976d2'; // Blau
    case 'Gelbe Tonne': return '#fbc02d'; // Gelb
    case 'Glascontainer': return '#388e3c'; // Grün
    case 'Wertstoffhof': return '#ef6c00'; // Orange
    case 'Schadstoffmobil': return '#d32f2f'; // Rot
    case 'Altkleidercontainer': return '#0097a7'; // Türkis
    default: return '#9ca3af';
  }
}
