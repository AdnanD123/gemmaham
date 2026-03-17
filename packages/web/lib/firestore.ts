import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
  type QueryConstraint,
  writeBatch,
  startAfter,
  type QueryDocumentSnapshot as QDS,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  toMillis,
  type Company, type CompanyInput,
  type Flat, type FlatInput, type FlatFilters, type SortBy,
  type House, type HouseInput, type HouseFilters, type PropertyType, type PropertyFilters,
  type Reservation, type ReservationInput, type ReservationStatus, type StatusHistoryEntry, type UserSnapshot,
  type Conversation, type Message,
  type UserProfile, type UserNotification,
  type Building, type BuildingInput, type BuildingFilters,
  type ConstructionUpdate, type ConstructionUpdateInput,
  type Contractor, type ContractorInput, type ContractorProfile,
  type ContractorApplication, type ContractorApplicationInput, type ApplicationStatus,
  type ContractorCategory, type ContractorSubcategory,
  type SubcategoryScope, type FlatContractorScope, type FlatCustomizationConfig,
  type CustomizationOption, type CustomizationOptionInput,
  type CustomizationRequest, type CustomizationRequestInput,
  type RequestStatus,
} from "@gemmaham/shared";

// ─── Helper ──────────────────────────────────────────────
import type { DocumentSnapshot, QueryDocumentSnapshot } from "firebase/firestore";

const DEFAULT_PAGE_SIZE = 25;

export interface PaginationOptions {
  pageSize?: number;
  cursor?: QDS | null;
}

export interface PaginatedResult<T> {
  items: T[];
  lastDoc: QDS | null;
  hasMore: boolean;
}

const docToData = <T>(snap: DocumentSnapshot | QueryDocumentSnapshot): T & { id: string } => ({
  id: snap.id,
  ...(snap.data() as T),
});

// ─── Companies ───────────────────────────────────────────
export const createCompany = async (data: CompanyInput): Promise<string> => {
  const ref = await addDoc(collection(db, "companies"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getCompany = async (companyId: string): Promise<Company | null> => {
  const snap = await getDoc(doc(db, "companies", companyId));
  return snap.exists() ? docToData<Company>(snap) : null;
};

export const updateCompany = async (companyId: string, data: Partial<CompanyInput>): Promise<void> => {
  await updateDoc(doc(db, "companies", companyId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// ─── User Profiles ───────────────────────────────────────
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? docToData<UserProfile>(snap) : null;
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  await setDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

// ─── Flats ───────────────────────────────────────────────
export const createFlat = async (data: FlatInput): Promise<string> => {
  const ref = await addDoc(collection(db, "flats"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getFlat = async (flatId: string): Promise<Flat | null> => {
  const snap = await getDoc(doc(db, "flats", flatId));
  return snap.exists() ? docToData<Flat>(snap) : null;
};

export const updateFlat = async (flatId: string, data: Partial<FlatInput>): Promise<void> => {
  await updateDoc(doc(db, "flats", flatId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteFlat = async (flatId: string): Promise<void> => {
  await deleteDoc(doc(db, "flats", flatId));
};

const applySortBy = <T extends { price: number; area: number; createdAt: unknown }>(
  items: T[],
  sortBy?: SortBy,
): T[] => {
  if (!sortBy || sortBy === "newest") return items;
  const sorted = [...items];
  switch (sortBy) {
    case "price_asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price_desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "size_desc":
      return sorted.sort((a, b) => b.area - a.area);
    default:
      return sorted;
  }
};

export const listFlats = async (
  filters: FlatFilters = {},
  pagination?: PaginationOptions,
): Promise<PaginatedResult<Flat>> => {
  const constraints: QueryConstraint[] = [];

  if (filters.status) {
    constraints.push(where("status", "==", filters.status));
  }
  if (filters.companyId) {
    constraints.push(where("companyId", "==", filters.companyId));
  }
  if (filters.minBedrooms) {
    constraints.push(where("bedrooms", ">=", filters.minBedrooms));
  }

  constraints.push(orderBy("createdAt", "desc"));

  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  constraints.push(limit(pageSize + 1));
  if (pagination?.cursor) {
    constraints.push(startAfter(pagination.cursor));
  }

  const q = query(collection(db, "flats"), ...constraints);
  const snap = await getDocs(q);
  const hasMore = snap.docs.length > pageSize;
  const docs = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;
  let items = docs.map((d) => docToData<Flat>(d));

  // Client-side range filtering
  if (filters.minPrice) items = items.filter((f) => f.price >= filters.minPrice!);
  if (filters.maxPrice) items = items.filter((f) => f.price <= filters.maxPrice!);
  if (filters.minArea) items = items.filter((f) => f.area >= filters.minArea!);
  if (filters.maxArea) items = items.filter((f) => f.area <= filters.maxArea!);

  // Client-side location filtering (case-insensitive address match)
  if (filters.location) {
    const loc = filters.location.toLowerCase();
    items = items.filter((f) => f.address.toLowerCase().includes(loc));
  }

  // Client-side sorting
  items = applySortBy(items, filters.sortBy);

  return {
    items,
    lastDoc: docs.length > 0 ? (docs[docs.length - 1] as QDS) : null,
    hasMore,
  };
};

export const listCompanyFlats = async (companyId: string): Promise<Flat[]> => {
  const result = await listFlats({ companyId });
  return result.items;
};

export const getFeaturedFlats = async (count: number = 6): Promise<Flat[]> => {
  const q = query(
    collection(db, "flats"),
    where("status", "==", "available"),
    where("featured", "==", true),
    orderBy("createdAt", "desc"),
    limit(count),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<Flat>(d));
};

// ─── Houses ──────────────────────────────────────────────
export const createHouse = async (data: HouseInput): Promise<string> => {
  const ref = await addDoc(collection(db, "houses"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getHouse = async (houseId: string): Promise<House | null> => {
  const snap = await getDoc(doc(db, "houses", houseId));
  return snap.exists() ? docToData<House>(snap) : null;
};

export const updateHouse = async (houseId: string, data: Partial<HouseInput>): Promise<void> => {
  await updateDoc(doc(db, "houses", houseId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteHouse = async (houseId: string): Promise<void> => {
  await deleteDoc(doc(db, "houses", houseId));
};

export const listHouses = async (
  filters: HouseFilters = {},
  pagination?: PaginationOptions,
): Promise<PaginatedResult<House>> => {
  const constraints: QueryConstraint[] = [];
  if (filters.status) constraints.push(where("status", "==", filters.status));
  if (filters.companyId) constraints.push(where("companyId", "==", filters.companyId));
  if (filters.houseType) constraints.push(where("houseType", "==", filters.houseType));
  if (filters.minBedrooms) constraints.push(where("bedrooms", ">=", filters.minBedrooms));
  constraints.push(orderBy("createdAt", "desc"));

  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  constraints.push(limit(pageSize + 1));
  if (pagination?.cursor) {
    constraints.push(startAfter(pagination.cursor));
  }

  const q = query(collection(db, "houses"), ...constraints);
  const snap = await getDocs(q);
  const hasMore = snap.docs.length > pageSize;
  const docs = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;
  let items = docs.map((d) => docToData<House>(d));

  if (filters.minPrice) items = items.filter((h) => h.price >= filters.minPrice!);
  if (filters.maxPrice) items = items.filter((h) => h.price <= filters.maxPrice!);
  if (filters.minArea) items = items.filter((h) => h.area >= filters.minArea!);
  if (filters.maxArea) items = items.filter((h) => h.area <= filters.maxArea!);

  // Client-side location filtering (case-insensitive address match)
  if (filters.location) {
    const loc = filters.location.toLowerCase();
    items = items.filter((h) => h.address.toLowerCase().includes(loc));
  }

  // Client-side sorting
  items = applySortBy(items, filters.sortBy);

  return {
    items,
    lastDoc: docs.length > 0 ? (docs[docs.length - 1] as QDS) : null,
    hasMore,
  };
};

export const listCompanyHouses = async (companyId: string): Promise<House[]> => {
  const result = await listHouses({ companyId });
  return result.items;
};

export const getFeaturedHouses = async (count: number = 6): Promise<House[]> => {
  const q = query(
    collection(db, "houses"),
    where("status", "==", "available"),
    where("featured", "==", true),
    orderBy("createdAt", "desc"),
    limit(count),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<House>(d));
};

// ─── Unified Property Queries (Buildings + Houses) ──────
export type PropertyItem = (Building | House) & { __propertyType: "building" | "house" };

export const listAllProperties = async (filters: PropertyFilters = {}): Promise<PropertyItem[]> => {
  const type = filters.propertyType ?? "all";
  const results: PropertyItem[] = [];

  if (type === "all" || type === "building") {
    const buildingFilters: BuildingFilters = {};
    if (filters.companyId) buildingFilters.companyId = filters.companyId;
    if (filters.status) buildingFilters.status = filters.status as BuildingFilters["status"];

    const buildingResult = await listBuildings(buildingFilters);
    results.push(...buildingResult.items.map((b) => ({ ...b, __propertyType: "building" as const })));
  }

  if (type === "all" || type === "house") {
    const houseFilters: HouseFilters = {};
    if (filters.minPrice) houseFilters.minPrice = filters.minPrice;
    if (filters.maxPrice) houseFilters.maxPrice = filters.maxPrice;
    if (filters.minBedrooms) houseFilters.minBedrooms = filters.minBedrooms;
    if (filters.minArea) houseFilters.minArea = filters.minArea;
    if (filters.maxArea) houseFilters.maxArea = filters.maxArea;
    if (filters.location) houseFilters.location = filters.location;
    if (filters.companyId) houseFilters.companyId = filters.companyId;
    if (filters.houseType) houseFilters.houseType = filters.houseType;
    if (filters.status) houseFilters.status = filters.status as HouseFilters["status"];

    const houseResult = await listHouses(houseFilters);
    results.push(...houseResult.items.map((h) => ({ ...h, __propertyType: "house" as const })));
  }

  // Client-side location filtering for buildings (which don't filter in listBuildings)
  if (filters.location) {
    const loc = filters.location.toLowerCase();
    const filtered = results.filter((p) => p.address.toLowerCase().includes(loc));
    results.length = 0;
    results.push(...filtered);
  }

  // Sort merged results
  if (filters.sortBy && filters.sortBy !== "newest") {
    switch (filters.sortBy) {
      case "price_asc":
        results.sort((a, b) => ("price" in a ? a.price : 0) - ("price" in b ? b.price : 0));
        break;
      case "price_desc":
        results.sort((a, b) => ("price" in b ? b.price : 0) - ("price" in a ? a.price : 0));
        break;
      case "size_desc":
        results.sort((a, b) => ("area" in b ? b.area : 0) - ("area" in a ? a.area : 0));
        break;
    }
  } else {
    results.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  }

  return results;
};

export const getFeaturedProperties = async (count: number = 6): Promise<PropertyItem[]> => {
  const [buildings, houses] = await Promise.all([
    getFeaturedBuildings(count),
    getFeaturedHouses(count),
  ]);
  const results: PropertyItem[] = [
    ...buildings.map((b) => ({ ...b, __propertyType: "building" as const })),
    ...houses.map((h) => ({ ...h, __propertyType: "house" as const })),
  ];
  results.sort((a, b) => {
    return toMillis(b.createdAt) - toMillis(a.createdAt);
  });
  return results.slice(0, count);
};

// ─── Reservations ────────────────────────────────────────
export const createReservation = async (
  data: Omit<ReservationInput, "status" | "statusHistory" | "rejectionReason" | "reviewedAt" | "meetingDate" | "meetingNotes" | "meetingCompleted" | "depositAmount" | "depositPaid" | "depositDate" | "queuePosition" | "expiresAt">,
  userSnapshot: UserSnapshot,
): Promise<string> => {
  const ref = await addDoc(collection(db, "reservations"), {
    ...data,
    status: "requested" as ReservationStatus,
    userSnapshot,
    rejectionReason: null,
    reviewedAt: null,
    meetingDate: null,
    meetingNotes: null,
    meetingCompleted: false,
    depositAmount: null,
    depositPaid: false,
    depositDate: null,
    queuePosition: null,
    expiresAt: null,
    statusHistory: [{ from: null, to: "requested", changedAt: new Date().toISOString(), reason: null }],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getUserReservations = async (
  userId: string,
  pagination?: PaginationOptions,
): Promise<PaginatedResult<Reservation>> => {
  const constraints: QueryConstraint[] = [
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  ];
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  constraints.push(limit(pageSize + 1));
  if (pagination?.cursor) constraints.push(startAfter(pagination.cursor));

  const q = query(collection(db, "reservations"), ...constraints);
  const snap = await getDocs(q);
  const hasMore = snap.docs.length > pageSize;
  const docs = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;

  return {
    items: docs.map((d) => docToData<Reservation>(d)),
    lastDoc: docs.length > 0 ? (docs[docs.length - 1] as QDS) : null,
    hasMore,
  };
};

export const getCompanyReservations = async (
  companyId: string,
  pagination?: PaginationOptions,
): Promise<PaginatedResult<Reservation>> => {
  const constraints: QueryConstraint[] = [
    where("companyId", "==", companyId),
    orderBy("createdAt", "desc"),
  ];
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  constraints.push(limit(pageSize + 1));
  if (pagination?.cursor) constraints.push(startAfter(pagination.cursor));

  const q = query(collection(db, "reservations"), ...constraints);
  const snap = await getDocs(q);
  const hasMore = snap.docs.length > pageSize;
  const docs = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;

  return {
    items: docs.map((d) => docToData<Reservation>(d)),
    lastDoc: docs.length > 0 ? (docs[docs.length - 1] as QDS) : null,
    hasMore,
  };
};

export const getReservationsForFlat = async (flatId: string): Promise<Reservation[]> => {
  const q = query(
    collection(db, "reservations"),
    where("flatId", "==", flatId),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<Reservation>(d));
};

export const getUserReservationForFlat = async (
  userId: string,
  flatId: string,
): Promise<Reservation | null> => {
  const q = query(
    collection(db, "reservations"),
    where("userId", "==", userId),
    where("flatId", "==", flatId),
    where("status", "in", ["requested", "approved", "reserved"]),
    limit(1),
  );
  const snap = await getDocs(q);
  return snap.empty ? null : docToData<Reservation>(snap.docs[0]);
};

export const getUserReservationForProperty = async (
  userId: string,
  propertyType: PropertyType,
  propertyId: string,
): Promise<Reservation | null> => {
  const field = propertyType === "flat" ? "flatId" : "houseId";
  const q = query(
    collection(db, "reservations"),
    where("userId", "==", userId),
    where(field, "==", propertyId),
    where("status", "in", ["requested", "approved", "reserved"]),
    limit(1),
  );
  const snap = await getDocs(q);
  return snap.empty ? null : docToData<Reservation>(snap.docs[0]);
};

export const getReservationsForProperty = async (
  propertyType: PropertyType,
  propertyId: string,
): Promise<Reservation[]> => {
  const field = propertyType === "flat" ? "flatId" : "houseId";
  const q = query(
    collection(db, "reservations"),
    where(field, "==", propertyId),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<Reservation>(d));
};

export const updateReservationStatus = async (
  reservationId: string,
  status: ReservationStatus,
  reason?: string,
): Promise<void> => {
  const snap = await getDoc(doc(db, "reservations", reservationId));
  if (!snap.exists()) throw new Error("Reservation not found");
  const current = snap.data();

  const historyEntry: StatusHistoryEntry = {
    from: current.status,
    to: status,
    changedAt: new Date().toISOString(),
    reason: reason || null,
  };

  const update: Record<string, unknown> = {
    status,
    statusHistory: [...(current.statusHistory || []), historyEntry],
    updatedAt: serverTimestamp(),
  };

  if (status === "approved" || status === "rejected") {
    update.reviewedAt = serverTimestamp();
  }
  if (status === "rejected" && reason) {
    update.rejectionReason = reason;
  }

  await updateDoc(doc(db, "reservations", reservationId), update);
};

export const updateReservationMeeting = async (
  reservationId: string,
  meetingDate: string,
  meetingNotes?: string,
): Promise<void> => {
  await updateDoc(doc(db, "reservations", reservationId), {
    meetingDate,
    meetingNotes: meetingNotes || null,
    updatedAt: serverTimestamp(),
  });
};

export const completeReservationMeeting = async (reservationId: string): Promise<void> => {
  await updateDoc(doc(db, "reservations", reservationId), {
    meetingCompleted: true,
    updatedAt: serverTimestamp(),
  });
};

export const confirmDeposit = async (
  reservationId: string,
  amount: number,
): Promise<void> => {
  await updateDoc(doc(db, "reservations", reservationId), {
    depositAmount: amount,
    depositPaid: true,
    depositDate: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

// ─── Conversations ───────────────────────────────────────
export const getOrCreateConversation = async (
  flatId: string,
  userId: string,
  companyId: string,
  metadata: { flatTitle: string; companyName: string; userName: string },
): Promise<{ id: string; isNew: boolean; hasMessages: boolean }> => {
  // Check if conversation already exists
  const q = query(
    collection(db, "conversations"),
    where("flatId", "==", flatId),
    where("userId", "==", userId),
    where("companyId", "==", companyId),
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    const convData = snap.docs[0].data();
    return { id: snap.docs[0].id, isNew: false, hasMessages: !!convData.lastMessage };
  }

  // Create new conversation
  const ref = await addDoc(collection(db, "conversations"), {
    propertyType: "flat",
    flatId,
    buildingId: null,
    houseId: null,
    userId,
    companyId,
    flatTitle: metadata.flatTitle,
    companyName: metadata.companyName,
    userName: metadata.userName,
    lastMessage: "",
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: "",
    userUnreadCount: 0,
    companyUnreadCount: 0,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, isNew: true, hasMessages: false };
};

export const getOrCreateBuildingConversation = async (
  buildingId: string,
  userId: string,
  companyId: string,
  metadata: { buildingTitle: string; companyName: string; userName: string },
): Promise<{ id: string; isNew: boolean; hasMessages: boolean }> => {
  const q = query(
    collection(db, "conversations"),
    where("buildingId", "==", buildingId),
    where("userId", "==", userId),
    where("companyId", "==", companyId),
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    const convData = snap.docs[0].data();
    return { id: snap.docs[0].id, isNew: false, hasMessages: !!convData.lastMessage };
  }

  const ref = await addDoc(collection(db, "conversations"), {
    propertyType: null,
    flatId: null,
    buildingId,
    houseId: null,
    userId,
    companyId,
    flatTitle: metadata.buildingTitle,
    companyName: metadata.companyName,
    userName: metadata.userName,
    lastMessage: "",
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: "",
    userUnreadCount: 0,
    companyUnreadCount: 0,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, isNew: true, hasMessages: false };
};

export const getOrCreateHouseConversation = async (
  houseId: string,
  userId: string,
  companyId: string,
  metadata: { houseTitle: string; companyName: string; userName: string },
): Promise<{ id: string; isNew: boolean; hasMessages: boolean }> => {
  const q = query(
    collection(db, "conversations"),
    where("houseId", "==", houseId),
    where("userId", "==", userId),
    where("companyId", "==", companyId),
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    const convData = snap.docs[0].data();
    return { id: snap.docs[0].id, isNew: false, hasMessages: !!convData.lastMessage };
  }

  const ref = await addDoc(collection(db, "conversations"), {
    propertyType: "house",
    flatId: null,
    buildingId: null,
    houseId,
    userId,
    companyId,
    flatTitle: metadata.houseTitle,
    companyName: metadata.companyName,
    userName: metadata.userName,
    lastMessage: "",
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: "",
    userUnreadCount: 0,
    companyUnreadCount: 0,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, isNew: true, hasMessages: false };
};

export const getConversation = async (conversationId: string): Promise<Conversation | null> => {
  const snap = await getDoc(doc(db, "conversations", conversationId));
  return snap.exists() ? docToData<Conversation>(snap) : null;
};

export const getUserConversations = (
  userId: string,
  callback: (conversations: Conversation[]) => void,
): Unsubscribe => {
  const q = query(
    collection(db, "conversations"),
    where("userId", "==", userId),
    orderBy("lastMessageAt", "desc"),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => docToData<Conversation>(d)));
  });
};

export const getCompanyConversations = (
  companyId: string,
  callback: (conversations: Conversation[]) => void,
): Unsubscribe => {
  const q = query(
    collection(db, "conversations"),
    where("companyId", "==", companyId),
    orderBy("lastMessageAt", "desc"),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => docToData<Conversation>(d)));
  });
};

// ─── Messages ────────────────────────────────────────────
export const sendMessage = async (
  conversationId: string,
  message: {
    senderId: string;
    senderRole: string;
    content: string;
    type?: "text" | "card";
    cardData?: { title: string; subtitle?: string; imageUrl?: string; linkType: "building" | "flat" | "house"; linkId: string };
  },
): Promise<string> => {
  const data: Record<string, unknown> = {
    senderId: message.senderId,
    senderRole: message.senderRole,
    content: message.content,
    timestamp: serverTimestamp(),
    read: false,
  };
  if (message.type) data.type = message.type;
  if (message.cardData) data.cardData = message.cardData;

  const ref = await addDoc(
    collection(db, "conversations", conversationId, "messages"),
    data,
  );
  return ref.id;
};

export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void,
): Unsubscribe => {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("timestamp", "asc"),
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => docToData<Message>(d)));
    },
    (error) => {
      console.error("Messages subscription error:", error);
    },
  );
};

export const markMessagesAsRead = async (
  conversationId: string,
  role: "company" | "user",
): Promise<void> => {
  const field = role === "user" ? "userUnreadCount" : "companyUnreadCount";
  await updateDoc(doc(db, "conversations", conversationId), {
    [field]: 0,
  });
};

// ─── Buildings ──────────────────────────────────────────
export const createBuilding = async (data: BuildingInput): Promise<string> => {
  const ref = await addDoc(collection(db, "buildings"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getBuilding = async (buildingId: string): Promise<Building | null> => {
  const snap = await getDoc(doc(db, "buildings", buildingId));
  return snap.exists() ? docToData<Building>(snap) : null;
};

export const updateBuilding = async (buildingId: string, data: Partial<BuildingInput>): Promise<void> => {
  await updateDoc(doc(db, "buildings", buildingId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteBuilding = async (buildingId: string): Promise<void> => {
  await deleteDoc(doc(db, "buildings", buildingId));
};

export const listBuildings = async (
  filters: BuildingFilters = {},
  pagination?: PaginationOptions,
): Promise<PaginatedResult<Building>> => {
  const constraints: QueryConstraint[] = [];
  if (filters.status) constraints.push(where("status", "==", filters.status));
  if (filters.companyId) constraints.push(where("companyId", "==", filters.companyId));
  constraints.push(orderBy("createdAt", "desc"));

  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  constraints.push(limit(pageSize + 1));
  if (pagination?.cursor) {
    constraints.push(startAfter(pagination.cursor));
  }

  const q = query(collection(db, "buildings"), ...constraints);
  const snap = await getDocs(q);
  const hasMore = snap.docs.length > pageSize;
  const docs = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;

  return {
    items: docs.map((d) => docToData<Building>(d)),
    lastDoc: docs.length > 0 ? (docs[docs.length - 1] as QDS) : null,
    hasMore,
  };
};

export const listCompanyBuildings = async (companyId: string): Promise<Building[]> => {
  const result = await listBuildings({ companyId });
  return result.items;
};

export const getFeaturedBuildings = async (count: number = 6): Promise<Building[]> => {
  const q = query(
    collection(db, "buildings"),
    where("featured", "==", true),
    orderBy("createdAt", "desc"),
    limit(count),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<Building>(d));
};

export const listBuildingFlats = async (buildingId: string): Promise<Flat[]> => {
  const q = query(
    collection(db, "flats"),
    where("buildingId", "==", buildingId),
    orderBy("unitNumber", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<Flat>(d));
};

// ─── Construction Updates ───────────────────────────────
export const addConstructionUpdate = async (
  buildingId: string,
  data: Omit<ConstructionUpdateInput, "buildingId">,
): Promise<string> => {
  const ref = await addDoc(collection(db, "buildings", buildingId, "updates"), {
    ...data,
    buildingId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getConstructionUpdates = async (buildingId: string): Promise<ConstructionUpdate[]> => {
  const q = query(
    collection(db, "buildings", buildingId, "updates"),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<ConstructionUpdate>(d));
};

export const deleteConstructionUpdate = async (buildingId: string, updateId: string): Promise<void> => {
  await deleteDoc(doc(db, "buildings", buildingId, "updates", updateId));
};

// ─── Contractors ────────────────────────────────────────
export const addContractor = async (
  buildingId: string,
  data: Omit<ContractorInput, "buildingId">,
): Promise<string> => {
  const ref = await addDoc(collection(db, "buildings", buildingId, "contractors"), {
    ...data,
    buildingId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getContractors = async (buildingId: string): Promise<Contractor[]> => {
  const q = query(
    collection(db, "buildings", buildingId, "contractors"),
    orderBy("createdAt", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<Contractor>(d));
};

export const updateContractor = async (
  buildingId: string,
  contractorId: string,
  data: Partial<ContractorInput>,
): Promise<void> => {
  await updateDoc(doc(db, "buildings", buildingId, "contractors", contractorId), data);
};

export const updateContractorProgress = async (
  buildingId: string,
  contractorId: string,
  update: { progressPercent: number; note?: string },
): Promise<void> => {
  const data: Record<string, unknown> = {
    progressPercent: update.progressPercent,
    updatedAt: serverTimestamp(),
  };
  if (update.progressPercent >= 100) {
    data.status = "completed";
  }
  if (update.note) {
    data.lastProgressNote = update.note;
  }
  await updateDoc(doc(db, "buildings", buildingId, "contractors", contractorId), data);
};

export const deleteContractor = async (buildingId: string, contractorId: string): Promise<void> => {
  await deleteDoc(doc(db, "buildings", buildingId, "contractors", contractorId));
};

// ─── Contractor Scope Configuration ─────────────────────

export const updateContractorScope = async (
  buildingId: string,
  contractorId: string,
  scopeConfig: SubcategoryScope[],
): Promise<void> => {
  await updateDoc(
    doc(db, "buildings", buildingId, "contractors", contractorId),
    { scopeConfig },
  );
};

export const getBuildingScopeConfigs = async (
  buildingId: string,
): Promise<FlatContractorScope[]> => {
  const contractors = await getContractors(buildingId);
  return contractors
    .filter((c) => c.scopeConfig && c.scopeConfig.length > 0)
    .map((c) => ({
      contractorId: c.id,
      contractorName: c.name,
      category: c.assignedCategory!,
      subcategories: c.scopeConfig!,
    }));
};

export const initFlatCustomizationConfig = async (
  flatId: string,
  buildingId: string,
): Promise<void> => {
  const scopes = await getBuildingScopeConfigs(buildingId);
  if (scopes.length === 0) return;
  const config: FlatCustomizationConfig = {
    buildingId,
    inheritedAt: new Date().toISOString(),
    overriddenAt: null,
    scopes,
  };
  await updateDoc(doc(db, "flats", flatId), { customizationConfig: config });
};

export const updateFlatCustomizationConfig = async (
  flatId: string,
  scopes: FlatContractorScope[],
): Promise<void> => {
  await updateDoc(doc(db, "flats", flatId), {
    "customizationConfig.scopes": scopes,
    "customizationConfig.overriddenAt": new Date().toISOString(),
  });
};

// ─── Customization Options ──────────────────────────────
export const addCustomizationOption = async (
  flatId: string,
  data: Omit<CustomizationOptionInput, "flatId">,
): Promise<string> => {
  const ref = await addDoc(collection(db, "flats", flatId, "customizations"), {
    ...data,
    flatId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getCustomizationOptions = async (flatId: string): Promise<CustomizationOption[]> => {
  const q = query(
    collection(db, "flats", flatId, "customizations"),
    orderBy("createdAt", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<CustomizationOption>(d));
};

export const updateCustomizationOption = async (
  flatId: string,
  optionId: string,
  data: Partial<CustomizationOptionInput>,
): Promise<void> => {
  await updateDoc(doc(db, "flats", flatId, "customizations", optionId), data);
};

export const deleteCustomizationOption = async (flatId: string, optionId: string): Promise<void> => {
  await deleteDoc(doc(db, "flats", flatId, "customizations", optionId));
};

export const lockCustomizationsByContractor = async (
  buildingId: string,
  contractorId: string,
): Promise<number> => {
  // Find all flats in this building
  const flats = await listBuildingFlats(buildingId);
  const batch = writeBatch(db);
  let locked = 0;

  for (const flat of flats) {
    const options = await getCustomizationOptions(flat.id);
    for (const opt of options) {
      if (opt.contractorId === contractorId && !opt.locked) {
        batch.update(doc(db, "flats", flat.id, "customizations", opt.id), { locked: true });
        locked++;
      }
    }
  }

  if (locked > 0) await batch.commit();
  return locked;
};

// ─── Customization Requests ─────────────────────────────
export const createCustomizationRequest = async (data: CustomizationRequestInput): Promise<string> => {
  const ref = await addDoc(collection(db, "customizationRequests"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getUserCustomizationRequests = async (userId: string): Promise<CustomizationRequest[]> => {
  const q = query(
    collection(db, "customizationRequests"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<CustomizationRequest>(d));
};

export const getCompanyCustomizationRequests = async (companyId: string): Promise<CustomizationRequest[]> => {
  // Get all buildings for this company first, then query requests
  const buildings = await listCompanyBuildings(companyId);
  const buildingIds = buildings.map((b) => b.id);
  if (buildingIds.length === 0) return [];

  // Firestore 'in' supports up to 30 values
  const chunks: string[][] = [];
  for (let i = 0; i < buildingIds.length; i += 30) {
    chunks.push(buildingIds.slice(i, i + 30));
  }

  const results: CustomizationRequest[] = [];
  for (const chunk of chunks) {
    const q = query(
      collection(db, "customizationRequests"),
      where("buildingId", "in", chunk),
      orderBy("createdAt", "desc"),
    );
    const snap = await getDocs(q);
    results.push(...snap.docs.map((d) => docToData<CustomizationRequest>(d)));
  }
  return results;
};

export const updateCustomizationRequestStatus = async (
  requestId: string,
  status: RequestStatus,
  companyNotes?: string,
): Promise<void> => {
  const update: Record<string, unknown> = { status, updatedAt: serverTimestamp() };
  if (companyNotes !== undefined) update.companyNotes = companyNotes;
  if (status === "approved" || status === "rejected") update.reviewedAt = serverTimestamp();
  await updateDoc(doc(db, "customizationRequests", requestId), update);
};

// ─── Notifications ──────────────────────────────────────
export const getNotifications = async (userId: string): Promise<UserNotification[]> => {
  const q = query(
    collection(db, "users", userId, "notifications"),
    orderBy("createdAt", "desc"),
    limit(20),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<UserNotification>(d));
};

export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: UserNotification[]) => void,
): Unsubscribe => {
  const q = query(
    collection(db, "users", userId, "notifications"),
    orderBy("createdAt", "desc"),
    limit(20),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => docToData<UserNotification>(d)));
  });
};

export const markNotificationAsRead = async (userId: string, notificationId: string): Promise<void> => {
  await updateDoc(doc(db, "users", userId, "notifications", notificationId), { read: true });
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  const q = query(
    collection(db, "users", userId, "notifications"),
    where("read", "==", false),
  );
  const snap = await getDocs(q);
  if (snap.empty) return;

  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
};

// ─── Contractor Profiles (top-level collection) ────────
export const createContractorProfile = async (
  uid: string,
  data: Partial<ContractorProfile>,
): Promise<void> => {
  await setDoc(doc(db, "contractors", uid), {
    ...data,
    id: uid,
    profileCompleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getContractorProfile = async (contractorId: string): Promise<ContractorProfile | null> => {
  const snap = await getDoc(doc(db, "contractors", contractorId));
  return snap.exists() ? docToData<ContractorProfile>(snap) : null;
};

export const updateContractorProfile = async (
  contractorId: string,
  data: Partial<ContractorProfile>,
): Promise<void> => {
  await updateDoc(doc(db, "contractors", contractorId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteContractorProfile = async (contractorId: string): Promise<void> => {
  await deleteDoc(doc(db, "contractors", contractorId));
};

export const searchContractors = async (filters: {
  email?: string;
  specialty?: string;
  category?: ContractorCategory;
  subcategory?: ContractorSubcategory;
  search?: string;
}): Promise<ContractorProfile[]> => {
  // Email search — exact match
  if (filters.email) {
    const q = query(
      collection(db, "contractors"),
      where("email", "==", filters.email),
      where("profileCompleted", "==", true),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToData<ContractorProfile>(d));
  }

  // Directory browse — filter by category/subcategory/specialty, client-side name search
  const constraints: QueryConstraint[] = [where("profileCompleted", "==", true)];

  if (filters.category) {
    constraints.push(where("categoryKeys", "array-contains", filters.category));
  } else if (filters.subcategory) {
    constraints.push(where("subcategoryKeys", "array-contains", filters.subcategory));
  } else if (filters.specialty) {
    // Legacy fallback
    constraints.push(where("specialty", "==", filters.specialty));
  }

  constraints.push(orderBy("displayName", "asc"));

  const q = query(collection(db, "contractors"), ...constraints);
  const snap = await getDocs(q);
  let results = snap.docs.map((d) => docToData<ContractorProfile>(d));

  // Client-side name filtering
  if (filters.search) {
    const search = filters.search.toLowerCase();
    results = results.filter(
      (c) =>
        c.displayName.toLowerCase().includes(search) ||
        c.companyName.toLowerCase().includes(search),
    );
  }

  return results;
};

// ─── Contractor Assignments (from contractor's perspective) ─
export const getContractorAssignments = async (
  contractorUserId: string,
): Promise<(Contractor & { buildingName: string })[]> => {
  const q = query(
    collectionGroup(db, "contractors"),
    where("contractorUserId", "==", contractorUserId),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  const assignments = snap.docs.map((d) => docToData<Contractor>(d));

  // Fetch building names for each assignment
  const results: (Contractor & { buildingName: string })[] = [];
  for (const a of assignments) {
    const building = await getBuilding(a.buildingId);
    results.push({ ...a, buildingName: building?.title || "Unknown Building" });
  }
  return results;
};

// ─── Contractor Notifications (client-side creation) ────
export const createNotification = async (
  userId: string,
  notification: Omit<UserNotification, "id" | "createdAt">,
): Promise<void> => {
  await addDoc(collection(db, "users", userId, "notifications"), {
    ...notification,
    createdAt: serverTimestamp(),
  });
};

// ─── Contractor Applications ─────────────────────────────
export const createApplication = async (
  data: Omit<ContractorApplicationInput, "status" | "companyNotes" | "reviewedAt">,
): Promise<string> => {
  const ref = await addDoc(collection(db, "applications"), {
    ...data,
    status: "pending" as ApplicationStatus,
    companyNotes: null,
    reviewedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getContractorApplicationForBuilding = async (
  contractorUserId: string,
  buildingId: string,
): Promise<ContractorApplication | null> => {
  const q = query(
    collection(db, "applications"),
    where("contractorUserId", "==", contractorUserId),
    where("buildingId", "==", buildingId),
    where("status", "in", ["pending", "accepted"]),
    limit(1),
  );
  const snap = await getDocs(q);
  return snap.empty ? null : docToData<ContractorApplication>(snap.docs[0]);
};

export const getApplicationsForBuilding = async (
  buildingId: string,
  statusFilter?: ApplicationStatus,
): Promise<ContractorApplication[]> => {
  const constraints: QueryConstraint[] = [where("buildingId", "==", buildingId)];
  if (statusFilter) constraints.push(where("status", "==", statusFilter));
  constraints.push(orderBy("createdAt", "desc"));

  const q = query(collection(db, "applications"), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<ContractorApplication>(d));
};

export const getContractorApplications = async (
  contractorUserId: string,
): Promise<ContractorApplication[]> => {
  const q = query(
    collection(db, "applications"),
    where("contractorUserId", "==", contractorUserId),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<ContractorApplication>(d));
};

export const getCompanyApplications = async (
  companyId: string,
  statusFilter?: ApplicationStatus,
): Promise<ContractorApplication[]> => {
  const constraints: QueryConstraint[] = [where("companyId", "==", companyId)];
  if (statusFilter) constraints.push(where("status", "==", statusFilter));
  constraints.push(orderBy("createdAt", "desc"));

  const q = query(collection(db, "applications"), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<ContractorApplication>(d));
};

export const updateApplicationStatus = async (
  applicationId: string,
  status: ApplicationStatus,
  companyNotes?: string,
): Promise<void> => {
  const update: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
    reviewedAt: serverTimestamp(),
  };
  if (companyNotes !== undefined) update.companyNotes = companyNotes;
  await updateDoc(doc(db, "applications", applicationId), update);
};

export const acceptApplicationAndAssign = async (
  application: ContractorApplication,
): Promise<void> => {
  await updateApplicationStatus(application.id, "accepted");

  await addContractor(application.buildingId, {
    companyId: application.companyId,
    contractorUserId: application.contractorUserId,
    name: application.contractorName,
    trade: application.contractorCompanyName,
    category: application.contractorSpecialty,
    assignedCategory: application.contractorCategories?.[0]?.category ?? null,
    assignedSubcategories: application.contractorCategories
      ? application.contractorCategories.flatMap((c) => c.subcategories)
      : [],
    description: application.message,
    phone: null,
    email: null,
    website: null,
    logoUrl: application.contractorLogoUrl,
    status: "upcoming",
    progressPercent: 0,
    startDate: null,
    endDate: null,
    contractValue: application.proposedRate,
    currency: application.currency,
  });

  await createNotification(application.contractorUserId, {
    userId: application.contractorUserId,
    type: "application_accepted",
    title: "Application Accepted",
    message: "Your application has been accepted!",
    linkTo: `/contractor/projects`,
    read: false,
  });
};

export const withdrawApplication = async (applicationId: string): Promise<void> => {
  await updateDoc(doc(db, "applications", applicationId), {
    status: "withdrawn",
    updatedAt: serverTimestamp(),
  });
};

// ─── Favorites ──────────────────────────────────────────
export interface FavoriteDoc {
  propertyId: string;
  propertyType: "flat" | "house";
  createdAt: TimestampLike;
}

export const addToFavorites = async (
  userId: string,
  propertyId: string,
  propertyType: "flat" | "house",
): Promise<void> => {
  await setDoc(doc(db, "users", userId, "favorites", propertyId), {
    propertyId,
    propertyType,
    createdAt: serverTimestamp(),
  });
};

export const removeFromFavorites = async (
  userId: string,
  propertyId: string,
): Promise<void> => {
  await deleteDoc(doc(db, "users", userId, "favorites", propertyId));
};

export const getUserFavorites = async (userId: string): Promise<FavoriteDoc[]> => {
  const q = query(
    collection(db, "users", userId, "favorites"),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<FavoriteDoc>(d));
};

export const isPropertyFavorited = async (
  userId: string,
  propertyId: string,
): Promise<boolean> => {
  const snap = await getDoc(doc(db, "users", userId, "favorites", propertyId));
  return snap.exists();
};

export const subscribeToFavorites = (
  userId: string,
  callback: (favorites: FavoriteDoc[]) => void,
): Unsubscribe => {
  const q = query(
    collection(db, "users", userId, "favorites"),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => docToData<FavoriteDoc>(d)));
  });
};

export const listBrowsableProjects = async (): Promise<Building[]> => {
  const q = query(
    collection(db, "buildings"),
    where("status", "in", ["planning", "under_construction"]),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToData<Building>(d));
};
