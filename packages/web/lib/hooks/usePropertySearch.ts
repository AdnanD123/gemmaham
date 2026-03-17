import { useState, useEffect, useCallback, useRef } from "react";
import MiniSearch from "minisearch";
import type { PropertyItem } from "../firestore";

interface UsePropertySearchReturn {
  search: (query: string) => PropertyItem[];
  isIndexed: boolean;
}

export function usePropertySearch(properties: PropertyItem[]): UsePropertySearchReturn {
  const [isIndexed, setIsIndexed] = useState(false);
  const miniSearchRef = useRef<MiniSearch<PropertyItem> | null>(null);
  const propertiesRef = useRef<PropertyItem[]>([]);

  useEffect(() => {
    if (properties.length === 0) {
      setIsIndexed(false);
      return;
    }

    const ms = new MiniSearch<PropertyItem>({
      fields: ["title", "description", "address"],
      storeFields: ["id"],
      searchOptions: {
        fuzzy: 0.2,
        prefix: true,
      },
    });

    ms.addAll(properties);
    miniSearchRef.current = ms;
    propertiesRef.current = properties;
    setIsIndexed(true);
  }, [properties]);

  const search = useCallback(
    (query: string): PropertyItem[] => {
      if (!query.trim() || !miniSearchRef.current) return propertiesRef.current;
      const results = miniSearchRef.current.search(query);
      const idSet = new Set(results.map((r) => r.id));
      return propertiesRef.current.filter((p) => idSet.has(p.id));
    },
    [],
  );

  return { search, isIndexed };
}
