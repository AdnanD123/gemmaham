import { useEffect, useState } from "react";
import { getContractorProfile, getContractorAssignments } from "../firestore";
import type { ContractorProfile, Contractor } from "@gemmaham/shared";

interface UseContractorResult {
  profile: ContractorProfile | null;
  assignments: (Contractor & { buildingName: string })[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useContractor(contractorId: string | undefined): UseContractorResult {
  const [profile, setProfile] = useState<ContractorProfile | null>(null);
  const [assignments, setAssignments] = useState<(Contractor & { buildingName: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!contractorId) {
      setLoading(false);
      return;
    }

    try {
      const [p, a] = await Promise.all([
        getContractorProfile(contractorId),
        getContractorAssignments(contractorId),
      ]);
      setProfile(p);
      setAssignments(a);
    } catch (e) {
      console.error("Failed to load contractor data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [contractorId]);

  return { profile, assignments, loading, refresh: loadData };
}
