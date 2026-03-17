import { memo, useCallback } from "react";
import { useOutletContext } from "react-router";
import { Heart } from "lucide-react";
import { motion } from "motion/react";
import { useFavorites } from "../lib/hooks/useFavorites";
import type { AuthContext } from "@gemmaham/shared";

interface FavoriteButtonProps {
  propertyId: string;
  propertyType: "flat" | "house";
}

export const FavoriteButton = memo(({ propertyId, propertyType }: FavoriteButtonProps) => {
  const auth = useOutletContext<AuthContext>();

  // Only show for authenticated users with role "user"
  if (!auth.user || auth.role !== "user") return null;

  return (
    <FavoriteButtonInner
      propertyId={propertyId}
      propertyType={propertyType}
      userId={auth.user.uid}
    />
  );
});

const FavoriteButtonInner = memo(({
  propertyId,
  propertyType,
  userId,
}: FavoriteButtonProps & { userId: string }) => {
  const { isFavorited, toggle } = useFavorites(userId);
  const favorited = isFavorited(propertyId);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggle(propertyId, propertyType);
    },
    [propertyId, propertyType, toggle],
  );

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileTap={{ scale: 0.8 }}
      animate={{ scale: favorited ? [1, 1.25, 1] : 1 }}
      transition={{ duration: 0.3 }}
      className="absolute top-2 right-2 z-10 flex items-center justify-center w-11 h-11 rounded-full bg-surface/80 backdrop-blur-sm border border-foreground/6 shadow-card hover:bg-surface transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        size={16}
        className={
          favorited
            ? "fill-red-500 text-red-500"
            : "text-foreground/40 hover:text-foreground/60"
        }
      />
    </motion.button>
  );
});
