// Districts from older profiles may be localized objects or plain strings.
export const driverLocationLabel = (value, lang = 'en', fallback = '') => {
  if (typeof value === 'string') return value || fallback;
  if (!value || typeof value !== 'object') return fallback;
  const key = lang === 'si' ? 'nameSi' : lang === 'ta' ? 'nameTa' : 'nameEn';
  return [value[key], value.nameEn, value.nameSi, value.nameTa]
    .find((label) => typeof label === 'string' && label.trim()) || fallback;
};
