import { describe, expect, it } from "vitest";
import {
  MAX_LOCATION_ACCURACY_METERS,
  MAX_REVIEW_DISTANCE_METERS,
  SEPETAK_CAFE_COORDS,
  haversineDistanceMeters,
  validateCustomerLocation,
} from "@/lib/location";

// One degree of latitude is ~111,320 meters.
const metersToLatitudeOffset = (meters: number) => meters / 111_320;

const OUTSIDE_MESSAGE = "Maaf, ulasan hanya dapat dikirim saat Anda berada di area Sepetak Cafe.";
const ACCURACY_MESSAGE =
  "Akurasi lokasi tidak memadai. Silakan aktifkan lokasi dengan akurasi lebih baik dan coba lagi.";

describe("Geofence ulasan (radius 80 meter)", () => {
  it("menggunakan radius dan ambang akurasi 80 meter", () => {
    expect(MAX_REVIEW_DISTANCE_METERS).toBe(80);
    expect(MAX_LOCATION_ACCURACY_METERS).toBe(80);
  });

  it("menerima lokasi di dalam radius", () => {
    const latitude = SEPETAK_CAFE_COORDS.latitude + metersToLatitudeOffset(22);
    const result = validateCustomerLocation({ latitude, longitude: SEPETAK_CAFE_COORDS.longitude, accuracy: 15 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(Math.round(result.distance)).toBeLessThanOrEqual(80);
  });

  it("menolak lokasi di luar radius dengan pesan yang ditetapkan", () => {
    const latitude = SEPETAK_CAFE_COORDS.latitude + metersToLatitudeOffset(222);
    const result = validateCustomerLocation({ latitude, longitude: SEPETAK_CAFE_COORDS.longitude, accuracy: 15 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBe(OUTSIDE_MESSAGE);
  });

  it("menolak akurasi di atas 80 meter", () => {
    const result = validateCustomerLocation({
      latitude: SEPETAK_CAFE_COORDS.latitude,
      longitude: SEPETAK_CAFE_COORDS.longitude,
      accuracy: 100,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBe(ACCURACY_MESSAGE);
  });

  it("menolak koordinat yang tidak valid", () => {
    const result = validateCustomerLocation({ latitude: Number.NaN, longitude: SEPETAK_CAFE_COORDS.longitude });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("Lokasi tidak tersedia");
  });

  it("menghitung jarak nol di titik pusat kafe", () => {
    const distance = haversineDistanceMeters(
      SEPETAK_CAFE_COORDS.latitude,
      SEPETAK_CAFE_COORDS.longitude,
      SEPETAK_CAFE_COORDS.latitude,
      SEPETAK_CAFE_COORDS.longitude,
    );
    expect(distance).toBe(0);
  });
});
