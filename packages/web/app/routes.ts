import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("new-design", "routes/new-design.tsx"),

  // Auth
  route("auth/login", "routes/auth.login.tsx"),
  route("auth/register", "routes/auth.register.tsx"),
  route("auth/verify-email", "routes/auth.verify-email.tsx"),

  // Profile
  route("profile/setup", "routes/profile.setup.tsx"),

  // Unified property browsing (NEW)
  route("properties", "routes/properties._index.tsx"),
  route("houses/:id", "routes/houses.$id.tsx"),

  // Public flat browsing (kept for backward compat)
  route("flats", "routes/flats._index.tsx"),
  route("flats/:id", "routes/flats.$id.tsx"),

  // Public buildings (kept for backward compat)
  route("buildings", "routes/buildings._index.tsx"),
  route("buildings/:id", "routes/buildings.$id.tsx"),

  // Company routes
  route("company/dashboard", "routes/company.dashboard.tsx"),
  route("company/flats", "routes/company.flats._index.tsx"),
  route("company/flats/new", "routes/company.flats.new.tsx"),
  route("company/flats/:id", "routes/company.flats.$id.tsx"),
  route("company/buildings", "routes/company.buildings._index.tsx"),
  route("company/buildings/new", "routes/company.buildings.new.tsx"),
  route("company/buildings/:id", "routes/company.buildings.$id.tsx"),
  route("company/properties", "routes/company.properties._index.tsx"),
  route("company/properties/houses/new", "routes/company.properties.houses.new.tsx"),
  route("company/properties/houses/:id", "routes/company.properties.houses.$id.tsx"),
  route("company/reservations", "routes/company.reservations.tsx"),
  route("company/requests", "routes/company.requests.tsx"),
  route("company/messages", "routes/company.messages.tsx"),
  route("company/messages/:conversationId", "routes/company.messages.$conversationId.tsx"),
  route("company/contractors", "routes/company.contractors.tsx"),

  // User routes
  route("user/profile", "routes/user.profile.tsx"),
  route("user/dashboard", "routes/user.dashboard.tsx"),
  route("user/reservations", "routes/user.reservations.tsx"),
  route("user/requests", "routes/user.requests.tsx"),
  route("user/messages", "routes/user.messages.tsx"),
  route("user/messages/:conversationId", "routes/user.messages.$conversationId.tsx"),

  // Contractor routes
  route("contractor/browse", "routes/contractor.browse.tsx"),
  route("contractor/dashboard", "routes/contractor.dashboard.tsx"),
  route("contractor/projects", "routes/contractor.projects._index.tsx"),
  route("contractor/projects/:id", "routes/contractor.projects.$id.tsx"),
  route("contractor/buildings", "routes/contractor.buildings.tsx"),
  route("contractor/buildings/:id", "routes/contractor.buildings.$id.tsx"),
  route("contractor/messages", "routes/contractor.messages.tsx"),
  route("contractor/messages/:conversationId", "routes/contractor.messages.$conversationId.tsx"),
  route("contractor/profile", "routes/contractor.profile.tsx"),

  // Public contractor profiles
  route("contractors/:id", "routes/contractors.$id.tsx"),

  // Visualizer
  route("visualizer/:id", "routes/visualizer.$id.tsx"),
] satisfies RouteConfig;
