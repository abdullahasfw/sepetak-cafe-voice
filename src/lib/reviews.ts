import { z } from "zod";

export const CATEGORIES = [
  { value: "makanan", label: "Makanan" },
  { value: "minuman", label: "Minuman" },
  { value: "suasana", label: "Suasana" },
  { value: "kebersihan", label: "Kebersihan" },
  { value: "pelayanan", label: "Pelayanan" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];

export const categoryLabel = (v: string) =>
  CATEGORIES.find((c) => c.value === v)?.label ?? v;

export const STATUS_LABEL = {
  baru: "Baru",
  ditangani: "Sedang ditangani",
  selesai: "Selesai",
} as const;

/** Only reviews with this rating or higher may be shown publicly. */
export const MIN_PUBLIC_RATING = 4;
export const canBePublic = (rating: number) => rating >= MIN_PUBLIC_RATING;

export const reviewSchema = z
  .object({
    rating: z.number().int().min(1, "Pilih rating bintang").max(5),
    categories: z
      .array(z.enum(["makanan", "minuman", "suasana", "kebersihan", "pelayanan"]))
      .min(1, "Pilih minimal satu kategori"),
    comment: z
      .string()
      .trim()
      .min(5, "Komentar minimal 5 karakter")
      .max(2000, "Komentar maksimal 2000 karakter"),
    suggestion: z.string().trim().max(2000, "Saran maksimal 2000 karakter"),
    isAnonymous: z.boolean(),
    customerName: z.string().trim().max(80, "Nama maksimal 80 karakter"),
    staffFeedback: z.string().trim().max(2000, "Masukan maksimal 2000 karakter"),
  })
  .refine((d) => d.isAnonymous || d.customerName.length > 0, {
    message: "Isi nama atau pilih kirim sebagai anonim",
    path: ["customerName"],
  });

export type ReviewInput = z.infer<typeof reviewSchema>;
