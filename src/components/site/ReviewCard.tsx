import { Quote } from "lucide-react";
import { StarRating } from "./StarRating";
import { categoryLabel } from "@/lib/reviews";

export type PublicReview = {
  id: string;
  rating: number;
  categories: string[];
  comment: string;
  display_name: string;
  created_at: string;
};

export function ReviewCard({ review }: { review: PublicReview }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-border/70 bg-card p-6 shadow-card transition hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <StarRating value={review.rating} size={16} />
        <Quote className="h-5 w-5 text-gold/70" />
      </div>
      <p className="mt-4 flex-1 leading-relaxed text-card-foreground">{review.comment}</p>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {review.categories.map((c) => (
          <span key={c} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
            {categoryLabel(c)}
          </span>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        {review.display_name} ·{" "}
        {new Date(review.created_at).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
      </p>
    </article>
  );
}
