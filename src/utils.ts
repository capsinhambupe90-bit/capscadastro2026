export const normalizeString = (str: any): string => {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const formatDateBr = (dateStr: string): string => {
  if (!dateStr) return '';
  let safeDateStr = String(dateStr);
  if (safeDateStr.length === 10) safeDateStr += 'T12:00:00';
  try {
    return new Date(safeDateStr).toLocaleDateString('pt-BR');
  } catch (e) {
    return dateStr;
  }
};

export const formatDateForInput = (dateStr: string): string => {
  if (!dateStr) return '';
  let safeDateStr = String(dateStr);
  if (safeDateStr.length === 10) safeDateStr += 'T12:00:00';
  try {
    const d = new Date(safeDateStr);
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  } catch (e) {
    return '';
  }
};
