import { useState, useEffect } from "react";
import { useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";
import AuthGuard from "../../components/AuthGuard";
import FlatCard from "../../components/FlatCard";
import HouseCard from "../../components/HouseCard";
import { FlatGridSkeleton } from "../../components/skeletons/FlatCardSkeleton";
import { ContentLoader } from "../../components/ui/ContentLoader";
import { PageTransition } from "../../components/ui/PageTransition";
import { getUserFavorites, getFlat, getHouse, type FavoriteDoc } from "../../lib/firestore";
import type { AuthContext, Flat, House } from "@gemmaham/shared";

type FavoriteItem =
  | { type: "flat"; data: Flat; createdAt: FavoriteDoc["createdAt"] }
  | { type: "house"; data: House; createdAt: FavoriteDoc["createdAt"] };

export default function UserFavorites() {
  const auth = useOutletContext<AuthContext>();
  const { t } = useTranslation();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.user) return;
    (async () => {
      try {
        const favorites = await getUserFavorites(auth.user!.uid);
        const results: FavoriteItem[] = [];

        await Promise.all(
          favorites.map(async (fav) => {
            try {
              if (fav.propertyType === "house") {
                const house = await getHouse(fav.propertyId);
                if (house) results.push({ type: "house", data: house, createdAt: fav.createdAt });
              } else {
                const flat = await getFlat(fav.propertyId);
                if (flat) results.push({ type: "flat", data: flat, createdAt: fav.createdAt });
              }
            } catch {
              // Property may have been deleted
            }
          }),
        );

        setItems(results);
      } catch (e) {
        console.error("Failed to load favorites:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [auth.user]);

  return (
    <AuthGuard>
      <div className="home">
        <PageTransition className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="font-serif text-3xl font-bold mb-6">{t("favorites.title")}</h1>

          <ContentLoader loading={loading} skeleton={<FlatGridSkeleton />}>
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center mb-4">
                  <Heart size={28} className="text-foreground/20" />
                </div>
                <p className="text-lg font-medium text-foreground/60">{t("favorites.empty")}</p>
                <p className="text-sm text-foreground/40 mt-1">{t("favorites.emptyDesc")}</p>
              </div>
            ) : (
              <div className="projects-grid">
                {items.map((item) =>
                  item.type === "flat" ? (
                    <FlatCard key={item.data.id} flat={item.data} />
                  ) : (
                    <HouseCard key={item.data.id} house={item.data} />
                  ),
                )}
              </div>
            )}
          </ContentLoader>
        </PageTransition>
      </div>
    </AuthGuard>
  );
}
