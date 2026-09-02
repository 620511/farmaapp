function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function geocodeAddress(addressText) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addressText)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Farma.APP/1.0 (contato@farma.app)' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

function calculateDeliveryFee(distanceKm, subtotal) {
  if (subtotal >= 80) return 0;
  if (distanceKm == null) return 7.9;
  const BASE_FEE = 4.9;
  const FREE_KM = 2;
  const PER_KM = 1.5;
  const MAX_FEE = 24.9;
  if (distanceKm <= FREE_KM) return BASE_FEE;
  const extra = (distanceKm - FREE_KM) * PER_KM;
  return Math.min(MAX_FEE, Math.round((BASE_FEE + extra) * 100) / 100);
}

module.exports = { haversineDistanceKm, geocodeAddress, calculateDeliveryFee };
