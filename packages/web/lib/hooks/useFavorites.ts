import { useState, useEffect, useCallback, useMemo } from "react";
import {
  subscribeToFavorites,
  addToFavorites,
  removeFromFavorites,
  type FavoriteDoc,
} from "../firestore";

export function useFavorites(userId: string | undefined) {
  const [favoriteDocs, setFavoriteDocs] = useState<FavoriteDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setFavoriteDocs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToFavorites(userId, (data) => {
      setFavoriteDocs(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const favorites = useMemo(
    () => new Set(favoriteDocs.map((f) => f.propertyId)),
    [favoriteDocs],
  );

  const isFavorited = useCallback(
    (propertyId: string) => favorites.has(propertyId),
    [favorites],
  );

  const toggle = useCallback(
    async (propertyId: string, propertyType: "flat" | "house") => {
      if (!userId) return;
      if (favorites.has(propertyId)) {
        await removeFromFavorites(userId, propertyId);
      } else {
        await addToFavorites(userId, propertyId, propertyType);
      }
    },
    [userId, favorites],
  );

  return { favorites, favoriteDocs, toggle, isFavorited, loading };
}
