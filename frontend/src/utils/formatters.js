// Reusable formatter utilities

export const formatLocation = (location) => {
  if (!location) return '';
  if (typeof location === 'string') return location;
  if (typeof location === 'object') {
    const venue = location.venue || location.name || '';
    const address = location.address || location.street || '';
    const city = location.city || '';
    const parts = [venue, address, city].filter(Boolean);
    const combined = parts.join(', ');
    return combined || JSON.stringify(location);
  }
  return String(location);
};

export default { formatLocation };



