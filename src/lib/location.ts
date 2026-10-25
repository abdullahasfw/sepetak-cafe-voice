export const SEPETAK_CAFE_COORDS = {
  latitude: 5.56675274624505,
  longitude: 95.33705464989224,
};

export const MAX_REVIEW_DISTANCE_METERS = 80;
export const MAX_LOCATION_ACCURACY_METERS = 80;

export function haversineDistanceMeters(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMeters = 6371000;

  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);
  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

export function validateCustomerLocation({
  latitude,
  longitude,
  accuracy,
}: {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return {
      ok: false,
      message: "Lokasi tidak tersedia. Aktifkan izin lokasi dan coba lagi.",
    } as const;
  }

  if (accuracy !== undefined && accuracy !== null && accuracy > MAX_LOCATION_ACCURACY_METERS) {
    return {
      ok: false,
      message: "Akurasi lokasi tidak memadai. Silakan aktifkan lokasi dengan akurasi lebih baik dan coba lagi.",
    } as const;
  }

  const distance = haversineDistanceMeters(
    latitude,
    longitude,
    SEPETAK_CAFE_COORDS.latitude,
    SEPETAK_CAFE_COORDS.longitude,
  );

  if (distance > MAX_REVIEW_DISTANCE_METERS) {
    return {
      ok: false,
      message: "Maaf, ulasan hanya dapat dikirim saat Anda berada di area Sepetak Cafe.",
      distance,
    } as const;
  }

  return { ok: true, distance } as const;
}

export function getGoogleMapsLink() {
  return `https://www.google.com/maps/search/?api=1&query=${SEPETAK_CAFE_COORDS.latitude},${SEPETAK_CAFE_COORDS.longitude}`;
}
