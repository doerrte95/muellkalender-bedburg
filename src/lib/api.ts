export interface Street {
  StrassenId: number;
  Name: string;
  OrtsteilName: string;
}

export interface CollectionEvent {
  Datum: string;
  AbfallartName: string;
}

const BASE_URL = 'https://buerger-portal-bedburg.azurewebsites.net/api';

export async function fetchStreets(district: string = 'Rath'): Promise<Street[]> {
  const filter = encodeURIComponent(`Ort/OrteId eq 1 and OrtsteilName eq '${district}'`);
  const url = `${BASE_URL}/Strassen?%24filter=${filter}&%24orderby=Name+asc`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch streets');
  const data = await response.json();
  return data.value || data; // OData usually returns { value: [...] }
}

export async function fetchCollections(streetId: number, houseNr: string, district: string = 'Rath'): Promise<CollectionEvent[]> {
  const year = new Date().getFullYear();
  const url = `${BASE_URL}/AbfuhrtermineAbJahr?orteId=1&strassenId=${streetId}&ortsteil='${district}'&hausNr='${houseNr}'&jahr=${year}`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch collections');
  const data = await response.json();
  return data;
}
