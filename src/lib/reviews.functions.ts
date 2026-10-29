import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { validateCustomerLocation } from "@/lib/location";
import { reviewSchema } from "@/lib/reviews";

export type SubmitReviewResult = { ok: boolean; message?: string };

const submissionSchema = reviewSchema.and(
  z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().nullish(),
  }),
);

/**
 * Public submit path for customer reviews. The browser checks its own
 * coordinates first, but this handler re-validates the geofence server-side —
 * the client can never be trusted. Coordinates are used only for validation
 * and are never stored.
 */
export const submitReview = createServerFn({ method: "POST" })
  .inputValidator((input) => submissionSchema.parse(input))
  .handler(async ({ data }): Promise<SubmitReviewResult> => {
    const location = validateCustomerLocation({
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy ?? null,
    });
    if (!location.ok) return { ok: false, message: location.message };

    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) {
      return { ok: false, message: "Server belum siap menerima ulasan. Silakan coba lagi." };
    }

    // Publishable client: the same anon RLS policies apply as in the browser.
    const supabase = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          // Opaque sb_ keys are not JWTs; send apikey only.
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
            headers.delete("Authorization");
          }
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });

    const { error } = await supabase.from("reviews").insert({
      rating: data.rating,
      categories: data.categories,
      comment: data.comment,
      suggestion: data.suggestion || null,
      is_anonymous: data.isAnonymous,
      customer_name: data.isAnonymous ? null : data.customerName,
      staff_feedback: data.staffFeedback || null,
    });

    if (error) return { ok: false, message: "Ulasan gagal dikirim. Silakan coba lagi." };
    return { ok: true };
  });
