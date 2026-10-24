import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PublicReview } from "@/components/site/ReviewCard";

export const publicReviewsQuery = queryOptions({
  queryKey: ["public-reviews"],
  queryFn: async (): Promise<PublicReview[]> => {
    const { data, error } = await supabase.rpc("get_public_reviews");
    if (error) throw error;
    return (data ?? []) as PublicReview[];
  },
});
