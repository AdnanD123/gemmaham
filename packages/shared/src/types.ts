// Generic timestamp type that works with both Firebase client and admin SDKs
export type FirebaseTimestamp = { seconds: number; nanoseconds: number; toDate: () => Date };
export type TimestampLike = FirebaseTimestamp | Date | string;

/** Safely convert any TimestampLike value to epoch milliseconds. Returns 0 for invalid values. */
export function toMillis(ts: TimestampLike | null | undefined): number {
  if (!ts) return 0;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === "string") return new Date(ts).getTime();
  if (typeof ts === "object" && "seconds" in ts) return ts.seconds * 1000;
  return 0;
}

/** Format a TimestampLike to a localized date string. Returns empty string for invalid values. */
export function formatTimestamp(ts: TimestampLike | null | undefined): string {
  const ms = toMillis(ts);
  return ms ? new Date(ms).toLocaleDateString() : "";
}

// ─── Roles ───────────────────────────────────────────────
export type UserRole = "company" | "user" | "contractor";

// ─── Property Type ──────────────────────────────────────
export type PropertyType = "flat" | "house" | "building";

// ─── Flat Status ─────────────────────────────────────────
export type FlatStatus = "available" | "reserved" | "sold";

// ─── House Status ───────────────────────────────────────
export type HouseStatus = "available" | "reserved" | "sold";

// ─── House Type ─────────────────────────────────────────
export type HouseType = "detached" | "semi_detached" | "villa" | "townhouse" | "cottage";

// ─── Reservation Status ──────────────────────────────────
export type ReservationStatus = "requested" | "approved" | "reserved" | "completed" | "rejected" | "cancelled" | "expired";

// ─── Notification Type ──────────────────────────────────
export type NotificationType = "reservation_status" | "meeting_scheduled" | "reservation_expiring" | "customization_status" | "new_request" | "contractor_assigned" | "application_received" | "application_accepted" | "application_rejected" | "contractor_invited";

// ─── Application Status ────────────────────────────────
export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";

// ─── Area Unit ───────────────────────────────────────────
export type AreaUnit = "sqm" | "sqft";

// ─── Building Status ────────────────────────────────────
export type BuildingStatus = "planning" | "under_construction" | "near_completion" | "completed";

// ─── Construction Phase ─────────────────────────────────
export type ConstructionPhase = "foundation" | "structure" | "facade" | "interior" | "finishing" | "handover";

// ─── Building Milestone ─────────────────────────────────
export interface BuildingMilestone {
  id: string;
  buildingId: string;
  title: string;
  date: string;
  phase: ConstructionPhase;
  description?: string;
  completed: boolean;
  createdAt: TimestampLike;
}

// ─── Customization Category ─────────────────────────────
export type CustomizationCategory = "flooring" | "kitchen" | "bathroom" | "walls" | "electrical" | "other";

// ─── Customization Request Status ───────────────────────
export type RequestStatus = "pending" | "approved" | "rejected" | "in_progress" | "completed" | "cancelled";

// ─── Contractor Availability ────────────────────────────
export type ContractorAvailability = "available" | "busy" | "unavailable";

// ─── Contractor Status ──────────────────────────────────
export type ContractorStatus = "upcoming" | "in_progress" | "completed";

// ─── Contractor Trade Categories ────────────────────────
export type ContractorCategory =
  | "planning_engineering"
  | "structural_shell"
  | "roofing"
  | "hvac"
  | "plumbing_sanitary"
  | "electrical_trade"
  | "interior_finishing"
  | "windows_doors"
  | "facade_exterior"
  | "insulation_waterproofing"
  | "elevators_lifts"
  | "fire_protection"
  | "metalwork"
  | "landscaping_outdoor";

export type ContractorSubcategory =
  // Planning & Engineering
  | "architectural_design" | "structural_calculation" | "building_permits"
  | "project_management" | "energy_consulting" | "surveying"
  // Structural / Shell
  | "foundation_work" | "masonry" | "concrete_work" | "steel_construction" | "demolition"
  // Roofing
  | "roof_construction" | "flat_roofing" | "roof_insulation" | "guttering" | "chimney_work"
  // HVAC
  | "central_heating" | "floor_heating" | "air_conditioning" | "ventilation"
  | "heat_pumps" | "solar_thermal" | "radiators" | "thermostat_controls" | "fireplace_stove"
  // Plumbing / Sanitary
  | "water_supply" | "bathroom_installation" | "kitchen_plumbing" | "drainage" | "gas_installation"
  | "underfloor_heating_plumbing" | "rainwater_harvesting" | "water_treatment"
  // Electrical
  | "power_distribution" | "lighting" | "smart_home" | "fire_alarms"
  | "intercom" | "ev_charging" | "photovoltaic"
  | "security_systems" | "data_network" | "audio_video" | "outdoor_lighting"
  // Interior Finishing
  | "drywall" | "plastering" | "flooring_install" | "painting" | "carpentry"
  | "kitchen_installation" | "bathroom_finishing"
  | "tiling" | "wallpaper" | "ceiling_work" | "built_in_wardrobes"
  // Windows & Doors
  | "window_installation" | "door_installation" | "glass_work"
  | "roller_shutters" | "garage_doors"
  | "insect_protection" | "sun_protection" | "interior_doors" | "entrance_doors" | "terrace_doors"
  // Facade & Exterior
  | "external_plastering" | "external_insulation" | "cladding"
  | "balconies" | "scaffolding"
  // Insulation & Waterproofing
  | "thermal_insulation" | "sound_insulation" | "basement_waterproofing"
  | "moisture_protection"
  // Elevators & Lifts
  | "passenger_elevators" | "freight_elevators" | "stairlifts" | "elevator_maintenance"
  // Fire Protection
  | "fire_doors" | "sprinkler_systems" | "fire_escape" | "fire_protection_coating"
  // Metalwork
  | "railings" | "steel_stairs" | "metal_facades" | "locksmith"
  // Landscaping & Outdoor
  | "garden_design" | "paving" | "fencing" | "playground" | "irrigation"
  | "outdoor_kitchen" | "swimming_pool" | "terrace_decking";

export interface ContractorCategorySelection {
  category: ContractorCategory;
  subcategories: ContractorSubcategory[];
}

// ─── Pricing Tier (option type configuration) ────────────
export type PricingTier = "base" | "upgrade" | "unavailable";

export interface OptionTypeConfig {
  optionType: string;
  tier: PricingTier;
  priceDelta: number | null;
}

export interface SubcategoryScope {
  subcategory: ContractorSubcategory;
  optionTypes: OptionTypeConfig[];
}

// ─── Flat Customization Config (inherited from building) ─
export interface FlatContractorScope {
  contractorId: string;
  contractorName: string;
  category: ContractorCategory;
  subcategories: SubcategoryScope[];
}

export interface FlatCustomizationConfig {
  buildingId: string;
  inheritedAt: TimestampLike;
  overriddenAt: TimestampLike | null;
  scopes: FlatContractorScope[];
}

// ─── App Status (UI state) ───────────────────────────────
export enum AppStatus {
  IDLE = "IDLE",
  UPLOADING = "UPLOADING",
  PROCESSING = "PROCESSING",
  READY = "READY",
}

// ─── Company ─────────────────────────────────────────────
export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  logo: string;
  description: string;
  address: string;
  ownerId: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export type CompanyInput = Omit<Company, "id" | "createdAt" | "updatedAt">;

// ─── Team Management ─────────────────────────────────────
export type TeamMemberRole = "owner" | "manager" | "agent";
export type TeamMemberStatus = "pending" | "active" | "removed";
export type TeamInviteStatus = "pending" | "accepted" | "expired" | "cancelled";

export interface TeamMember {
  id: string;
  userId: string;
  companyId: string;
  email: string;
  displayName: string;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  invitedBy: string;
  invitedAt: TimestampLike;
  joinedAt: TimestampLike | null;
}

export interface TeamInvite {
  id: string;
  email: string;
  companyId: string;
  companyName: string;
  role: TeamMemberRole;
  token: string;
  status: TeamInviteStatus;
  invitedBy: string;
  inviterName: string;
  expiresAt: TimestampLike;
  createdAt: TimestampLike;
}

// ─── User Document (for uploads) ─────────────────────────
export interface UserDocument {
  name: string;
  url: string;
  type: string;
  uploadedAt: TimestampLike;
}

// ─── User Profile ────────────────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  companyId: string | null;
  phone: string | null;
  address: string | null;
  socialSecurityNumber: string | null;
  documents: UserDocument[];
  profileCompleted: boolean;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export type UserProfileInput = Omit<UserProfile, "id" | "createdAt" | "updatedAt">;

export function isProfileComplete(profile: UserProfile): boolean {
  return !!(
    profile.displayName &&
    profile.phone &&
    profile.address &&
    profile.photoURL
  );
}

// ─── Flat ────────────────────────────────────────────────
export interface Flat {
  id: string;
  companyId: string;
  buildingId: string | null;
  unitNumber: string | null;
  title: string;
  description: string;
  address: string;
  price: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  areaUnit: AreaUnit;
  floorPlanUrl: string;
  renderedImageUrl: string | null;
  photos?: string[];
  status: FlatStatus;
  featured: boolean;
  customizationConfig: FlatCustomizationConfig | null;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export type FlatInput = Omit<Flat, "id" | "createdAt" | "updatedAt">;

// ─── Reservation Status History Entry ────────────────────
export interface StatusHistoryEntry {
  from: ReservationStatus | null;
  to: ReservationStatus;
  changedAt: TimestampLike;
  reason: string | null;
}

// ─── User Snapshot (embedded in reservation for privacy) ─
export interface UserSnapshot {
  displayName: string;
  email: string;
  phone: string | null;
  photoURL: string | null;
}

// ─── House ─────────────────────────────────────────────
export interface House {
  id: string;
  companyId: string;
  title: string;
  description: string;
  address: string;
  price: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  areaUnit: AreaUnit;
  lotSize: number;
  lotSizeUnit: AreaUnit;
  stories: number;
  garage: boolean;
  garageSpaces: number;
  hasYard: boolean;
  hasPool: boolean;
  houseType: HouseType;
  yearBuilt: string | null;
  coverImageUrl: string | null;
  floorPlanUrl: string;
  renderedImageUrl: string | null;
  photos?: string[];
  status: HouseStatus;
  featured: boolean;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export type HouseInput = Omit<House, "id" | "createdAt" | "updatedAt">;

// ─── Sort ────────────────────────────────────────────────
export type SortBy = "newest" | "price_asc" | "price_desc" | "size_desc";

// ─── House Filters (frontend) ──────────────────────────
export interface HouseFilters {
  status?: HouseStatus;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minArea?: number;
  maxArea?: number;
  location?: string;
  sortBy?: SortBy;
  houseType?: HouseType;
  companyId?: string;
}

// ─── Unified Property Filters (frontend) ───────────────
export interface PropertyFilters {
  propertyType?: PropertyType | "all";
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minArea?: number;
  maxArea?: number;
  location?: string;
  sortBy?: SortBy;
  companyId?: string;
  houseType?: HouseType;
}

// ─── Financing Method ────────────────────────────────────
export type FinancingMethod = "cash" | "mortgage" | "other";

// ─── Urgency Level ──────────────────────────────────────
export type UrgencyLevel = "browsing" | "3months" | "urgent";

// ─── Reservation ─────────────────────────────────────────
export interface Reservation {
  id: string;
  propertyType: PropertyType;
  flatId: string | null;
  houseId: string | null;
  userId: string;
  companyId: string;
  status: ReservationStatus;
  requestDate: TimestampLike;
  notes: string;
  companyNotes: string | null;

  // Agency workflow
  rejectionReason: string | null;
  reviewedAt: TimestampLike | null;

  // Meeting tracking
  meetingDate: TimestampLike | null;
  meetingNotes: string | null;
  meetingCompleted: boolean;

  // Deposit tracking
  depositAmount: number | null;
  depositPaid: boolean;
  depositDate: TimestampLike | null;

  // Queue & expiration
  queuePosition: number | null;
  expiresAt: TimestampLike | null;

  // User snapshot (for privacy — agency reads this, not user profile)
  userSnapshot: UserSnapshot;

  // Additional booking info
  preferredMoveIn?: string;
  financingMethod?: FinancingMethod;
  occupants?: number;
  urgency?: UrgencyLevel;
  specialRequirements?: string;

  // Audit trail
  statusHistory: StatusHistoryEntry[];

  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export type ReservationInput = Omit<Reservation, "id" | "createdAt" | "updatedAt">;

// ─── Conversation ────────────────────────────────────────
export interface Conversation {
  id: string;
  propertyType: PropertyType | null;
  flatId: string | null;
  buildingId: string | null;
  houseId: string | null;
  userId: string;
  companyId: string;
  flatTitle: string;
  companyName: string;
  userName: string;
  lastMessage: string;
  lastMessageAt: TimestampLike;
  lastMessageSenderId: string;
  userUnreadCount: number;
  companyUnreadCount: number;
  createdAt: TimestampLike;
}

export type ConversationInput = Omit<Conversation, "id" | "createdAt">;

// ─── Message ─────────────────────────────────────────────
export interface MessageCardData {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  linkType: "building" | "flat" | "house";
  linkId: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderRole: UserRole;
  content: string;
  type?: "text" | "card";
  cardData?: MessageCardData;
  timestamp: TimestampLike;
  read: boolean;
}

export type MessageInput = Omit<Message, "id" | "timestamp" | "read">;

// ─── Auth Context (frontend) ─────────────────────────────
export interface AuthContext {
  user: { uid: string; email: string | null; displayName: string | null; emailVerified: boolean } | null;
  loading: boolean;
  role: UserRole | null;
  companyId: string | null;
  profileCompleted: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ─── Flat Filters (frontend) ─────────────────────────────
export interface FlatFilters {
  status?: FlatStatus;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minArea?: number;
  maxArea?: number;
  location?: string;
  sortBy?: SortBy;
  companyId?: string;
}

// ─── Building ───────────────────────────────────────────
export interface Building {
  id: string;
  companyId: string;
  title: string;
  description: string;
  address: string;
  coverImageUrl: string | null;
  totalUnits: number;
  availableUnits: number;
  floors: number;
  status: BuildingStatus;
  currentPhase: ConstructionPhase;
  estimatedCompletion: TimestampLike;
  startDate: TimestampLike;
  featured: boolean;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export type BuildingInput = Omit<Building, "id" | "createdAt" | "updatedAt">;

// ─── Construction Update ────────────────────────────────
export interface ConstructionUpdate {
  id: string;
  buildingId: string;
  title: string;
  description: string;
  phase: ConstructionPhase;
  progressPercent: number;
  images: string[];
  createdAt: TimestampLike;
}

export type ConstructionUpdateInput = Omit<ConstructionUpdate, "id" | "createdAt">;

// ─── Contractor (building subcollection assignment) ─────
export interface Contractor {
  id: string;
  buildingId: string;
  companyId: string;
  contractorUserId: string | null; // links to ContractorProfile (null = manual entry)
  name: string;
  trade: string;
  category: CustomizationCategory;
  assignedCategory: ContractorCategory | null;
  assignedSubcategories: ContractorSubcategory[];
  description: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
  status: ContractorStatus;
  progressPercent: number;
  startDate: TimestampLike | null;
  endDate: TimestampLike | null;
  contractValue: number | null;
  currency: string;
  scopeConfig: SubcategoryScope[] | null;
  createdAt: TimestampLike;
}

// ─── Contractor Document ────────────────────────────────
export type ContractorDocumentType = "certificate" | "insurance" | "license" | "other";

export interface ContractorDocument {
  name: string;
  url: string;
  type: ContractorDocumentType;
  uploadedAt: string;
}

// ─── Contractor Portfolio Item ─────────────────────────
export interface ContractorPortfolioItem {
  url: string;
  caption?: string;
  projectName?: string;
}

// ─── Contractor Profile (top-level collection, registered users) ─
export interface ContractorProfile {
  id: string;
  email: string;
  displayName: string;
  companyName: string;
  specialty: CustomizationCategory;
  categories: ContractorCategorySelection[];
  categoryKeys: ContractorCategory[];
  subcategoryKeys: ContractorSubcategory[];
  phone: string | null;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  availability?: ContractorAvailability;
  availableFrom?: string;
  documents?: ContractorDocument[];
  portfolio?: ContractorPortfolioItem[];
  profileCompleted: boolean;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export type ContractorInput = Omit<Contractor, "id" | "createdAt">;

export type ContractorProfileInput = Omit<ContractorProfile, "id" | "createdAt" | "updatedAt">;

// ─── Customization Option ───────────────────────────────
export interface CustomizationOption {
  id: string;
  flatId: string;
  buildingId: string;
  contractorId: string | null;
  category: CustomizationCategory;
  title: string;
  description: string;
  options: string[];
  defaultOption: string;
  priceImpact: number | null;
  deadline: string | null;
  locked: boolean;
  createdAt: TimestampLike;
}

export type CustomizationOptionInput = Omit<CustomizationOption, "id" | "createdAt">;

// ─── Customization Request ──────────────────────────────
export interface CustomizationRequest {
  id: string;
  flatId: string;
  buildingId: string;
  userId: string;
  reservationId: string;
  customizationOptionId: string;
  selectedOption: string;
  notes: string;
  status: RequestStatus;
  companyNotes: string | null;
  reviewedAt: TimestampLike | null;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export type CustomizationRequestInput = Omit<CustomizationRequest, "id" | "createdAt" | "updatedAt">;

// ─── User Notification ──────────────────────────────────
export interface UserNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkTo: string | null;
  read: boolean;
  createdAt: TimestampLike;
}

export type UserNotificationInput = Omit<UserNotification, "id" | "createdAt">;

// ─── Building Filters (frontend) ────────────────────────
export interface BuildingFilters {
  status?: BuildingStatus;
  companyId?: string;
}

// ─── Contractor Application ─────────────────────────────
export interface ContractorApplication {
  id: string;
  buildingId: string;
  companyId: string;
  contractorUserId: string;
  contractorName: string;
  contractorCompanyName: string;
  contractorSpecialty: CustomizationCategory;
  contractorCategories: ContractorCategorySelection[];
  contractorLogoUrl: string | null;
  message: string;
  proposedRate: number | null;
  currency: string;
  status: ApplicationStatus;
  companyNotes: string | null;
  reviewedAt: TimestampLike | null;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export type ContractorApplicationInput = Omit<ContractorApplication, "id" | "createdAt" | "updatedAt">;

// ─── Contractor Invitation ──────────────────────────────
export type ContractorInvitationStatus = "pending" | "accepted" | "declined";

export interface ContractorInvitation {
  id: string;
  buildingId: string;
  companyId: string;
  contractorId: string;
  contractorName: string;
  buildingTitle: string;
  companyName: string;
  message: string;
  status: ContractorInvitationStatus;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export type ContractorInvitationInput = Omit<ContractorInvitation, "id" | "createdAt" | "updatedAt">;

// ─── Building Document ──────────────────────────────────
export type BuildingDocumentType = "plan" | "permit" | "contract" | "specification" | "other";

export interface BuildingDocument {
  id: string;
  buildingId: string;
  name: string;
  type: BuildingDocumentType;
  url: string;
  uploadedBy: string;
  sharedWithContractors: boolean;
  sharedWithBuyers: boolean;
  createdAt: TimestampLike;
}

// ─── Generate 3D Request ─────────────────────────────────
export interface Generate3DRequest {
  flatId: string;
  imageUrl: string;
}

export interface Generate3DResponse {
  renderedImageUrl: string;
}
