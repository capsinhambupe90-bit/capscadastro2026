import type { Patient, DateSlot, Appointment } from './types';

// TODO: Replace with the actual Google Apps Script Web App URL
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbywetHHLp-r0dFQ2Hm3jBGpaaZsgKaJv5HAhiXcYEnwB3RARmxWeYdjk0DU7mQqPAEs/exec';

export const fetchData = async (sheetName: string): Promise<any[]> => {
  if (!GOOGLE_SHEETS_URL) {
    const localData = localStorage.getItem(`caps_data_${sheetName}`);
    if (localData) return JSON.parse(localData);
    return [];
  }

  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?sheet=${sheetName}`);
    const data = await response.json();
    if (Array.isArray(data)) return data;
    return [];
  } catch (error) {
    console.error(`Erro ao buscar dados da aba ${sheetName}:`, error);
    return [];
  }
};

export const syncData = async (sheetName: string, updatedData: (Patient | DateSlot | Appointment)[]): Promise<boolean> => {
  if (!GOOGLE_SHEETS_URL) {
    localStorage.setItem(`caps_data_${sheetName}`, JSON.stringify(updatedData));
    return true;
  }

  try {
    const response = await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'ATUALIZAR_TUDO',
        sheet: sheetName,
        data: updatedData // new API expected format
      })
    });
    const result = await response.json();
    return result.status === 'sucesso';
  } catch (error) {
    console.error(`Erro ao salvar dados na aba ${sheetName}:`, error);
    return false;
  }
};
