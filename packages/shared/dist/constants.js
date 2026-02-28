// Timing Constants (in milliseconds)
export const SHARE_STATUS_RESET_DELAY_MS = 1500;
export const PROGRESS_INCREMENT = 15;
export const REDIRECT_DELAY_MS = 600;
export const PROGRESS_INTERVAL_MS = 100;
export const PROGRESS_STEP = 5;
// UI Constants
export const GRID_OVERLAY_SIZE = "60px 60px";
export const GRID_COLOR = "#3B82F6";
// Image Dimensions
export const IMAGE_RENDER_DIMENSION = 1024;
// Contractor specialties (maps to CustomizationCategory values)
export const CONTRACTOR_SPECIALTIES = [
    "flooring",
    "kitchen",
    "bathroom",
    "walls",
    "electrical",
    "other",
];
export const CONTRACTOR_CATEGORIES = [
    {
        key: "planning_engineering",
        subcategories: ["architectural_design", "structural_calculation", "building_permits", "project_management", "energy_consulting", "surveying"],
    },
    {
        key: "structural_shell",
        subcategories: ["foundation_work", "masonry", "concrete_work", "steel_construction", "demolition"],
    },
    {
        key: "roofing",
        subcategories: ["roof_construction", "flat_roofing", "roof_insulation", "guttering", "chimney_work"],
    },
    {
        key: "hvac",
        subcategories: ["central_heating", "floor_heating", "air_conditioning", "ventilation", "heat_pumps", "solar_thermal", "radiators", "thermostat_controls", "fireplace_stove"],
    },
    {
        key: "plumbing_sanitary",
        subcategories: ["water_supply", "bathroom_installation", "kitchen_plumbing", "drainage", "gas_installation", "underfloor_heating_plumbing", "rainwater_harvesting", "water_treatment"],
    },
    {
        key: "electrical_trade",
        subcategories: ["power_distribution", "lighting", "smart_home", "fire_alarms", "intercom", "ev_charging", "photovoltaic", "security_systems", "data_network", "audio_video", "outdoor_lighting"],
    },
    {
        key: "interior_finishing",
        subcategories: ["drywall", "plastering", "flooring_install", "painting", "carpentry", "kitchen_installation", "bathroom_finishing", "tiling", "wallpaper", "ceiling_work", "built_in_wardrobes"],
    },
    {
        key: "windows_doors",
        subcategories: ["window_installation", "door_installation", "interior_doors", "entrance_doors", "terrace_doors", "glass_work", "roller_shutters", "garage_doors", "insect_protection", "sun_protection"],
    },
    {
        key: "facade_exterior",
        subcategories: ["external_plastering", "external_insulation", "cladding", "balconies", "scaffolding"],
    },
    {
        key: "insulation_waterproofing",
        subcategories: ["thermal_insulation", "sound_insulation", "basement_waterproofing", "moisture_protection"],
    },
    {
        key: "elevators_lifts",
        subcategories: ["passenger_elevators", "freight_elevators", "stairlifts", "elevator_maintenance"],
    },
    {
        key: "fire_protection",
        subcategories: ["fire_doors", "sprinkler_systems", "fire_escape", "fire_protection_coating"],
    },
    {
        key: "metalwork",
        subcategories: ["railings", "steel_stairs", "metal_facades", "locksmith"],
    },
    {
        key: "landscaping_outdoor",
        subcategories: ["garden_design", "paving", "fencing", "playground", "irrigation", "outdoor_kitchen", "swimming_pool", "terrace_decking"],
    },
];
export const getSubcategoriesForCategory = (categoryKey) => {
    return CONTRACTOR_CATEGORIES.find((c) => c.key === categoryKey)?.subcategories ?? [];
};
// ─── Option Types (3rd level under subcategories) ────────
export const OPTION_TYPES = {
    // Planning & Engineering
    architectural_design: ["concept_design", "detailed_design", "interior_design_plan", "landscape_design_plan"],
    structural_calculation: ["structural_analysis", "foundation_design", "seismic_assessment"],
    building_permits: ["building_permit_application", "planning_permission", "zoning_compliance"],
    project_management: ["construction_supervision", "cost_management", "schedule_management"],
    energy_consulting: ["energy_certificate", "energy_audit", "passive_house_consulting"],
    surveying: ["boundary_survey", "topographic_survey", "building_survey"],
    // Structural / Shell
    foundation_work: ["strip_foundation", "raft_foundation", "pile_foundation", "basement_excavation"],
    masonry: ["brick_masonry", "block_masonry", "aac_block", "stone_masonry"],
    concrete_work: ["reinforced_concrete", "precast_concrete", "exposed_concrete", "lightweight_concrete"],
    steel_construction: ["steel_frame", "steel_beams", "steel_columns", "steel_trusses"],
    demolition: ["full_demolition", "partial_demolition", "interior_strip_out", "asbestos_removal"],
    // Roofing
    roof_construction: ["pitched_roof", "flat_roof_structure", "mansard_roof", "green_roof_structure"],
    flat_roofing: ["bitumen_membrane", "epdm_membrane", "pvc_membrane", "liquid_applied_membrane"],
    roof_insulation: ["between_rafter", "above_rafter", "below_rafter", "spray_foam_roof"],
    guttering: ["half_round_gutter", "square_gutter", "concealed_gutter", "copper_gutter"],
    chimney_work: ["chimney_construction", "chimney_liner", "chimney_cap", "chimney_repair"],
    // HVAC
    central_heating: ["gas_boiler", "condensing_boiler", "oil_boiler", "pellet_boiler", "district_heating"],
    floor_heating: ["water_underfloor_heating", "electric_underfloor_heating", "thin_layer_heating"],
    air_conditioning: ["split_ac_unit", "multi_split_ac", "ducted_ac", "cassette_ac"],
    ventilation: ["mechanical_ventilation_hr", "decentralized_ventilation", "kitchen_exhaust", "bathroom_exhaust"],
    heat_pumps: ["air_source_heat_pump", "ground_source_heat_pump", "water_source_heat_pump", "hybrid_heat_pump"],
    solar_thermal: ["flat_plate_collector", "evacuated_tube_collector", "solar_combi_system"],
    radiators: ["panel_radiator", "towel_radiator", "designer_radiator", "convector_radiator", "column_radiator"],
    thermostat_controls: ["manual_thermostat", "programmable_thermostat", "smart_thermostat", "zone_control_system"],
    fireplace_stove: ["wood_burning_stove", "gas_fireplace", "electric_fireplace", "bioethanol_fireplace", "pellet_stove"],
    // Plumbing / Sanitary
    water_supply: ["copper_piping", "pex_piping", "multilayer_piping", "water_pressure_booster", "water_softener"],
    bathroom_installation: ["walk_in_shower", "bathtub", "freestanding_bathtub", "wall_hung_toilet", "floor_mounted_toilet", "bidet", "vanity_unit", "double_vanity"],
    kitchen_plumbing: ["single_bowl_sink", "double_bowl_sink", "undermount_sink", "pull_out_mixer_tap", "boiling_water_tap", "water_filter_tap"],
    drainage: ["pvc_drainage", "cast_iron_drainage", "linear_drain", "point_drain", "sump_pump"],
    gas_installation: ["gas_connection", "gas_hob_connection", "gas_fireplace_connection", "gas_safety_valve"],
    underfloor_heating_plumbing: ["manifold_installation", "pipe_layout", "pressure_testing"],
    rainwater_harvesting: ["rainwater_tank", "rainwater_pump", "garden_irrigation_system"],
    water_treatment: ["whole_house_filter", "uv_purification", "reverse_osmosis"],
    // Electrical
    power_distribution: ["main_distribution_board", "sub_distribution_board", "circuit_breaker_panel", "surge_protection", "three_phase_connection"],
    lighting: ["recessed_led_downlight", "pendant_light", "track_lighting", "led_strip_lighting", "wall_sconce", "dimmer_switch"],
    smart_home: ["smart_lighting_system", "smart_blinds_control", "smart_thermostat_integration", "voice_assistant_wiring", "home_automation_hub"],
    fire_alarms: ["smoke_detector", "heat_detector", "carbon_monoxide_detector", "interconnected_alarm_system"],
    intercom: ["audio_intercom", "video_intercom", "smart_video_doorbell", "multi_unit_intercom"],
    ev_charging: ["ev_wallbox_single", "ev_wallbox_dual", "ev_charging_cable_only", "ev_load_management"],
    photovoltaic: ["rooftop_solar_panel", "solar_inverter", "battery_storage", "solar_monitoring_system"],
    security_systems: ["alarm_system", "cctv_cameras", "motion_sensors", "smart_lock_system", "access_control"],
    data_network: ["cat6_wiring", "cat6a_wiring", "fiber_optic", "wifi_access_points", "network_rack"],
    audio_video: ["pre_wired_surround", "in_ceiling_speakers", "multi_room_audio", "projector_pre_wire", "tv_wall_mount_prep"],
    outdoor_lighting: ["path_lighting", "facade_lighting", "garden_spotlights", "bollard_lights", "solar_garden_lights"],
    // Interior Finishing
    drywall: ["standard_drywall", "moisture_resistant_drywall", "soundproof_drywall", "fire_rated_drywall"],
    plastering: ["smooth_plaster", "textured_plaster", "decorative_plaster", "venetian_plaster"],
    flooring_install: ["hardwood_flooring", "engineered_wood", "laminate_flooring", "vinyl_plank", "polished_concrete", "epoxy_floor"],
    painting: ["standard_emulsion", "washable_paint", "accent_wall", "anti_mold_paint", "primer_only"],
    carpentry: ["custom_shelving", "skirting_boards", "crown_molding", "wainscoting", "window_sills"],
    kitchen_installation: ["standard_kitchen", "premium_kitchen", "island_kitchen", "kitchenette", "custom_kitchen"],
    bathroom_finishing: ["wall_tiles", "floor_tiles", "mosaic_accent", "waterproof_paint", "natural_stone_finish"],
    tiling: ["ceramic_tile", "porcelain_tile", "natural_stone_tile", "large_format_tile", "mosaic_tile"],
    wallpaper: ["vinyl_wallpaper", "textile_wallpaper", "natural_fiber_wallpaper", "photo_mural"],
    ceiling_work: ["suspended_ceiling", "drywall_ceiling", "acoustic_ceiling", "exposed_beam_ceiling", "stretch_ceiling"],
    built_in_wardrobes: ["sliding_door_wardrobe", "hinged_door_wardrobe", "walk_in_closet", "fitted_wardrobe_with_lighting"],
    // Windows & Doors
    window_installation: ["pvc_window", "aluminum_window", "wooden_window", "timber_alu_window", "triple_glazed_window", "skylight_window"],
    door_installation: ["inward_opening_door", "sliding_door", "folding_door", "pivot_door", "pocket_door", "french_door"],
    interior_doors: ["flush_door", "panel_door", "glass_panel_door", "barn_door", "hidden_door"],
    entrance_doors: ["steel_security_door", "wooden_entrance_door", "aluminum_entrance_door", "smart_lock_door", "double_entry_door"],
    terrace_doors: ["sliding_terrace_door", "lift_slide_door", "folding_terrace_door", "french_terrace_door"],
    glass_work: ["glass_partition", "glass_railing", "glass_shower_enclosure", "mirror_wall", "decorative_glass"],
    roller_shutters: ["manual_roller_shutter", "electric_roller_shutter", "integrated_roller_shutter", "security_roller_shutter"],
    garage_doors: ["sectional_garage_door", "roller_garage_door", "side_hinged_garage_door", "tilt_garage_door"],
    insect_protection: ["fixed_insect_screen", "roller_insect_screen", "pleated_insect_screen", "magnetic_insect_screen"],
    sun_protection: ["external_venetian_blinds", "internal_blinds", "awning", "pergola_shade", "screen_roller"],
    // Facade & Exterior
    external_plastering: ["mineral_plaster", "silicone_plaster", "acrylic_plaster", "lime_plaster"],
    external_insulation: ["eps_etics", "mineral_wool_etics", "wood_fiber_etics", "pir_insulation"],
    cladding: ["timber_cladding", "fiber_cement_cladding", "metal_cladding", "stone_veneer"],
    balconies: ["concrete_balcony", "steel_balcony", "glass_balcony_railing", "balcony_enclosure"],
    scaffolding: ["frame_scaffolding", "system_scaffolding", "suspended_scaffolding"],
    // Insulation & Waterproofing
    thermal_insulation: ["mineral_wool", "xps_foam", "eps_foam", "cellulose_insulation", "spray_foam"],
    sound_insulation: ["acoustic_panel", "resilient_channel", "mass_loaded_vinyl", "acoustic_underlay"],
    basement_waterproofing: ["external_membrane", "internal_tanking", "drainage_board", "injection_waterproofing"],
    moisture_protection: ["vapor_barrier", "damp_proof_course", "moisture_barrier_paint"],
    // Elevators & Lifts
    passenger_elevators: ["hydraulic_elevator", "traction_elevator", "machine_room_less_elevator", "glass_elevator"],
    freight_elevators: ["standard_freight_elevator", "heavy_duty_freight_elevator"],
    stairlifts: ["straight_stairlift", "curved_stairlift", "platform_lift"],
    elevator_maintenance: ["annual_service_contract", "emergency_call_service"],
    // Fire Protection
    fire_doors: ["single_fire_door", "double_fire_door", "fire_rated_glass_door"],
    sprinkler_systems: ["wet_sprinkler_system", "dry_sprinkler_system", "pre_action_sprinkler"],
    fire_escape: ["fire_escape_staircase", "emergency_lighting", "exit_signage"],
    fire_protection_coating: ["intumescent_paint", "fire_barrier_sealant", "fire_resistant_board"],
    // Metalwork
    railings: ["steel_railing", "aluminum_railing", "glass_railing", "wrought_iron_railing"],
    steel_stairs: ["straight_steel_stair", "spiral_steel_stair", "floating_stair"],
    metal_facades: ["aluminum_composite_panel", "perforated_metal", "corten_steel_facade"],
    locksmith: ["lock_installation", "high_security_lock", "master_key_system"],
    // Landscaping & Outdoor
    garden_design: ["planting_plan", "lawn_installation", "hedge_planting", "tree_planting"],
    paving: ["concrete_paving", "natural_stone_paving", "gravel_driveway", "permeable_paving"],
    fencing: ["wooden_fence", "metal_fence", "gabion_wall", "privacy_screen"],
    playground: ["swing_set", "climbing_frame", "sandbox", "rubber_safety_surface"],
    irrigation: ["drip_irrigation", "sprinkler_system", "smart_irrigation_controller"],
    outdoor_kitchen: ["built_in_grill", "outdoor_sink", "pizza_oven", "outdoor_countertop"],
    swimming_pool: ["in_ground_pool", "above_ground_pool", "plunge_pool", "pool_heating"],
    terrace_decking: ["timber_deck", "composite_deck", "stone_terrace", "raised_deck"],
};
export const getOptionTypesForSubcategory = (subcategory) => {
    return OPTION_TYPES[subcategory] ?? [];
};
export const GEMMAHAM_RENDER_PROMPT = `
TASK: Convert the input 2D floor plan into a **photorealistic, top‑down 3D architectural render**.

STRICT REQUIREMENTS (do not violate):
1) **REMOVE ALL TEXT**: Do not render any letters, numbers, labels, dimensions, or annotations. Floors must be continuous where text used to be.
2) **GEOMETRY MUST MATCH**: Walls, rooms, doors, and windows must follow the exact lines and positions in the plan. Do not shift or resize.
3) **TOP‑DOWN ONLY**: Orthographic top‑down view. No perspective tilt.
4) **CLEAN, REALISTIC OUTPUT**: Crisp edges, balanced lighting, and realistic materials. No sketch/hand‑drawn look.
5) **NO EXTRA CONTENT**: Do not add rooms, furniture, or objects that are not clearly indicated by the plan.

STRUCTURE & DETAILS:
- **Walls**: Extrude precisely from the plan lines. Consistent wall height and thickness.
- **Doors**: Convert door swing arcs into open doors, aligned to the plan.
- **Windows**: Convert thin perimeter lines into realistic glass windows.

FURNITURE & ROOM MAPPING (only where icons/fixtures are clearly shown):
- Bed icon → realistic bed with duvet and pillows.
- Sofa icon → modern sectional or sofa.
- Dining table icon → table with chairs.
- Kitchen icon → counters with sink and stove.
- Bathroom icon → toilet, sink, and tub/shower.
- Office/study icon → desk, chair, and minimal shelving.
- Porch/patio/balcony icon → outdoor seating or simple furniture (keep minimal).
- Utility/laundry icon → washer/dryer and minimal cabinetry.

STYLE & LIGHTING:
- Lighting: bright, neutral daylight. High clarity and balanced contrast.
- Materials: realistic wood/tile floors, clean walls, subtle shadows.
- Finish: professional architectural visualization; no text, no watermarks, no logos.`.trim();
