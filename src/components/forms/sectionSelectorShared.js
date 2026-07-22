/**
 * Shared section definitions and configuration for the Stage-2
 * "PROJECT PROFILE AND BUSINESS ANALYSIS" form.
 *
 * Each business category (Manufacturing, Trading, Service with stock,
 * Service without stock) composes its own SECTION_CONFIG from these building
 * blocks. Section titles are stored WITHOUT leading numbers — the shared
 * SectionSelectorBase renders the running number automatically so that each
 * category can include/exclude sections without manual renumbering.
 */

export const firmConstitutionSection = {
  id: "firm_constitution",
  title: "Constitution of the Firm",
  prompt_ref: "constitution",
  fields: [
    { name: "firm_name", label: "Firm Name", type: "text", required: false },
    { name: "organisation_type", label: "Sector", type: "select", options: ["Proprietorship", "Partnership", "Private Limited", "LLP", "Other"] },
    { name: "nature_of_business", label: "Nature of Business", type: "text", placeholder: "Prefilled from previous page" },
    { name: "proprietor_name", label: "Name of Authorised person", type: "text", required: true },
    { name: "pan_number", label: "PAN Number", type: "text" },
    { name: "aadhar_number", label: "Aadhar Number", type: "text" },
    { name: "caste", label: "Caste/Category", type: "text" },
    { name: "residential_address", label: "Residential Address", type: "textarea" }
  ]
};

export const locationOverviewSection = {
  id: "location_overview",
  title: "Overview of the Location",
  prompt_ref: "location_overview",
  fields: [
    { name: "location_name", label: "Location / Area Name", type: "text", placeholder: "e.g. KIADB Industrial Area, Tumkur" },
    { name: "district", label: "District", type: "text", placeholder: "e.g. Tumkur" },
    { name: "state", label: "State", type: "text", placeholder: "e.g. Karnataka" },
    { name: "nearest_city", label: "Nearest City / Town", type: "text", placeholder: "e.g. Bangalore (70 km)" }
  ]
};

export const accessConnectivitySection = {
  id: "access_connectivity",
  title: "Access and Connectivity",
  prompt_ref: "access_connectivity",
  fields: [
    { name: "connectivity_road", label: "Road", type: "checkbox" },
    { name: "connectivity_road_details", label: "Road Connectivity Details", type: "text", placeholder: "e.g. NH-48, State Highway 9", dependsOn: { field: "connectivity_road", value: true } },
    { name: "connectivity_rail", label: "Rail", type: "checkbox" },
    { name: "connectivity_rail_details", label: "Rail Connectivity Details", type: "text", placeholder: "e.g. Nearest railway station, distance", dependsOn: { field: "connectivity_rail", value: true } },
    { name: "connectivity_air", label: "Air", type: "checkbox" },
    { name: "connectivity_air_details", label: "Air Connectivity Details", type: "text", placeholder: "e.g. Nearest airport, distance", dependsOn: { field: "connectivity_air", value: true } },
    { name: "connectivity_sea", label: "Sea", type: "checkbox" },
    { name: "connectivity_sea_details", label: "Sea / Port Connectivity Details", type: "text", placeholder: "e.g. Nearest port, distance", dependsOn: { field: "connectivity_sea", value: true } }
  ]
};

export const promoterDetailsSection = {
  id: "promoter_details",
  title: "Proprietor's Background & Education",
  prompt_ref: "promoter_details",
  fields: [
    {
      name: "promoters",
      label: "Promoter/Partner Details",
      type: "group_list",
      subFields: [
        { name: "name", label: "Name", type: "text" },
        { name: "designation", label: "Designation", type: "select", options: ["Proprietor", "Partner", "Director"] },
        { name: "caste", label: "Caste", type: "text" },
        { name: "share_ratio", label: "Share %", type: "text" },
        { name: "pan_number", label: "PAN", type: "text" },
        { name: "aadhar_number", label: "Aadhar", type: "text" },
        { name: "address", label: "Res. Address", type: "text" },
        { name: "age", label: "Age", type: "text" },
        { name: "education", label: "Qualification", type: "text" },
        { name: "experience", label: "Experience", type: "textarea" }
      ]
    }
  ]
};

/**
 * Section 5 — Details of Product / Service.
 * @param {('Product'|'Service')} noun - the item label for this category.
 */
export const makeProductDetailsSection = (noun) => ({
  id: "product_details",
  title: `Details of ${noun}`,
  prompt_ref: "product_details",
  productNoun: noun,
  fields: [
    { name: "nature_of_business", label: "Nature of Business", type: "text", placeholder: "Prefilled from previous page" },
    {
      name: "products",
      label: noun,
      type: "group_list",
      subFields: [
        { name: "name", label: noun, type: "text" }
      ]
    }
  ]
});

export const makeProductCharacteristicsSection = (noun) => ({
  id: "product_characteristics",
  title: `Key Characteristics of ${noun}`,
  prompt_ref: "product_characteristics",
  fields: [
    { name: "industry_type", label: "Industry Type", type: "text", placeholder: "e.g., Manufacturing, Service, etc." }
  ]
});

export const manufacturingCapacitySection = {
  id: "manufacturing_capacity",
  title: "Manufacturing Capacity",
  prompt_ref: "manufacturing_capacity",
  fields: [
    {
      name: "product_capacity_list",
      label: "Production capacity",
      type: "group_list",
      subFields: [
        { name: "product_name", label: "product name(Ex:Paper plate)", type: "text" },
        { name: "capacity", label: "installed capacity", type: "text" }
      ]
    }
  ]
};

export const manufacturingProcessFlowchartSection = {
  id: "manufacturing_process_flowchart",
  title: "Manufacturing Flowchart",
  prompt_ref: "manufacturing_process_flowchart",
  note: "If you don't know, leave it empty. Our AI will generate it.",
  fields: [
    { name: "processing_steps", label: "Manufacturing Steps", type: "textarea", placeholder: "Briefly describe the process steps..." }
  ]
};

export const swotAnalysisSection = {
  id: "swot_analysis",
  title: "SWOT Analysis",
  prompt_ref: "swot_analysis",
  note: "If you don't know, leave it empty. Our AI will generate it.",
  fields: [
    { name: "swot_strengths", label: "Strengths", type: "textarea", placeholder: "List key strengths (one per line). Leave empty for AI to generate." },
    { name: "swot_weaknesses", label: "Weaknesses", type: "textarea", placeholder: "List key weaknesses (one per line). Leave empty for AI to generate." },
    { name: "swot_opportunities", label: "Opportunities", type: "textarea", placeholder: "List key opportunities (one per line). Leave empty for AI to generate." },
    { name: "swot_threats", label: "Threats", type: "textarea", placeholder: "List key threats (one per line). Leave empty for AI to generate." }
  ]
};

export const targetMarketSection = {
  id: "target_market_new",
  title: "Target Market",
  prompt_ref: "target_market",
  note: "If you don't know, leave it empty. Our AI will generate it.",
  fields: [
    { name: "target_market", label: "Target Market", type: "textarea", placeholder: "Describe target market manually..." }
  ]
};

export const competitorOverviewSection = {
  id: "competitor_overview",
  title: "Competitor Overview",
  prompt_ref: "competitor_overview",
  note: "If you don't know, leave it empty. Our AI will generate it.",
  fields: [
    { name: "competitor_notes", label: "Business / Competitor Context", type: "textarea", placeholder: "Share your local competitor insights, market positioning, or business context..." }
  ]
};

export const marketTrendSection = {
  id: "market_trend",
  title: "Market Trend",
  prompt_ref: "market_trend",
  note: "If you don't know, leave it empty. Our AI will generate it.",
  fields: [
    { name: "market_trend_notes", label: "Market Trend Notes", type: "textarea", placeholder: "Describe recent demand trends, growth drivers, or changes in the market..." }
  ]
};

export const statutoryApprovalsSection = {
  id: "statutory_approvals",
  title: "Statutory Approvals",
  prompt_ref: "statutory_approvals",
  fields: [
    {
      name: "approvals",
      type: "statutory_list",
      label: "Licenses, Clearances, Approvals, Consents and NOCs",
      items: [
        "GST",
        "Udyam (UAM/MSME) RC",
        "Labour License",
        "Trade License",
        "Food License (FSSAI)",
        "Drug License",
        "Factories running license",
        "Pollution Approval / NOC",
        "Fire Approval / NOC (White/Orange/Red category)",
        "Building / Site permit Approval / NOC",
        "Power Supply Connection",
        "Water Supply Connection",
        "Prohibition and Excise",
        "Legal Metrology",
        "Any other (not Included above)"
      ]
    }
  ]
};

export const marketingTechniquesSection = {
  id: "marketing_techniques",
  title: "Marketing Techniques",
  prompt_ref: "marketing_techniques",
  fields: [
    { name: "has_previous_experience", label: "Previous Experience", type: "checkbox" },
    { name: "experience_details", label: "Experience Details", type: "textarea", dependsOn: { field: "has_previous_experience", value: true } },
    { name: "has_purchase_orders", label: "Have Purchase orders ", type: "checkbox" },
    { name: "purchase_order_government", label: "Government Purchase Orders", type: "checkbox", dependsOn: { field: "has_purchase_orders", value: true } },
    { name: "purchase_order_private", label: "Private Purchase Orders", type: "checkbox", dependsOn: { field: "has_purchase_orders", value: true } },
    { name: "po_details", label: "PO Details", type: "textarea", dependsOn: { field: "has_purchase_orders", value: true } },
    { name: "has_marketing_team", label: "Will market the products through Marketing team", type: "checkbox" },
    { name: "has_other_methods", label: "Other Methods", type: "checkbox" },
    { name: "other_marketing_details", label: "Other Marketing Methods Details", type: "textarea", dependsOn: { field: "has_other_methods", value: true } }
  ]
};

export const powerRequirementsSection = {
  id: "power_requirements",
  title: "Power Requirements",
  prompt_ref: "power_requirements",
  fields: [
    { name: "power_load_required", label: "Power Load (in HP/kW)", type: "text" }
  ]
};

export const inventoryStockDetailsSection = {
  id: "inventory_stock_details",
  title: "Inventory / Stock Details",
  prompt_ref: "inventory_stock_details",
  fields: [
    {
      name: "inventory_items",
      label: "Inventory / Stock Details",
      type: "group_list",
      subFields: [
        { name: "type_of_material", label: "Raw Material / Finished Product", type: "text" },
        { name: "quantity_to_be_stored_per_month", label: "Quantity to be Stored", type: "text" },
        { name: "no_of_days_stock", label: "No of Days of Stock", type: "text" },
        { name: "justification", label: "Justification, if any", type: "text", required: false }
      ]
    }
  ]
};

export const plantMachinerySection = {
  id: "plant_machinery",
  title: "Plant and Machinery",
  prompt_ref: "plant_machinery",
  fields: [
    {
      name: "machinery_items",
      label: "Machinery Details",
      type: "group_list",
      subFields: [
        { name: "machinery_name", label: "Machinery/Equipment Name", type: "text" },
        { name: "machinery_supplier", label: "Supplier Location/Details", type: "text" },
        { name: "total_machinery_cost", label: "Cost", type: "text" },
        { name: "quotations_taken", label: "Supplier Quotations Taken?", type: "select", options: ["Yes", "No"] },
        { name: "machinery_origin", label: "Machinery Origin", type: "select", options: ["india", "imported"] }
      ]
    }
  ]
};

export const rawMaterialsSection = {
  id: "raw_materials",
  title: "Raw Materials",
  prompt_ref: "raw_materials",
  fields: [
    {
      name: "material_items",
      label: "Raw Material Details",
      type: "group_list",
      subFields: [
        { name: "name", label: "Raw Material Name", type: "text" },
        { name: "quantity", label: "Quantity Required Per day/month/year", type: "text" },
        { name: "supplier", label: "Supplier Details (Name, Place)", type: "text" },
        { name: "description", label: "Description regarding the Raw Materials , Demand , supply , availability nearer to your unit.", type: "textarea", required: false }
      ]
    }
  ]
};

export const transportationSection = {
  id: "transportation",
  title: "Transportation",
  prompt_ref: "transportation",
  fields: [
    { name: "inward_transport", label: "Inward Transportation (Raw Materials)", type: "text" },
    { name: "outward_transport", label: "Outward Transportation (Finished Goods)", type: "text" }
  ]
};

export const manpowerSection = {
  id: "manpower",
  title: "Manpower",
  prompt_ref: "manpower",
  fields: [
    { name: "direct_staff_count", label: "Direct Manpower (Skilled + Semi + Unskilled)", type: "text", readOnly: true },
    { name: "indirect_staff_count", label: "Indirect", type: "text" },
    {
      name: "manpower_requirements",
      label: "Manpower Breakdown",
      type: "group_list",
      subFields: [
        { name: "designation", label: "Designation", type: "text" },
        { name: "count", label: "No. of Employees", type: "text" }
      ]
    }
  ]
};

export const landRequirementsSection = {
  id: "land_requirements",
  title: "Justification of Land Requirements",
  prompt_ref: "land_requirements",
  fields: [
    {
      name: "land_items",
      label: "Land Usage Details",
      type: "group_list",
      subFields: [
        { name: "details", label: "Land Requirement Details", type: "text" },
        { name: "area", label: "Area (Square Meters)", type: "text" }
      ]
    }
  ]
};

export const implementationTimelineSection = {
  id: "implementation_timeline",
  title: "Implementation Timeline",
  prompt_ref: "implementation_timeline",
  fields: [
    {
      name: "milestones",
      label: "Implementation Milestones",
      type: "group_list",
      isFixed: true,
      subFields: [
        { name: "description", label: "Description", type: "text", readOnly: false },
        { name: "start_date", label: "Start Date", type: "text", placeholder: "DD/MM/YYYY" },
        { name: "end_date", label: "End Date", type: "text", placeholder: "DD/MM/YYYY" }
      ]
    }
  ]
};

export const conclusionSection = {
  id: "conclusion",
  title: "Conclusion",
  prompt_ref: "conclusion",
  fields: [
    { name: "custom_conclusion", label: "Custom Conclusion (Optional)", type: "textarea" }
  ]
};

/**
 * Fields that are auto-mapped (pre-filled and rendered read-only) from Stage 1.
 * Shared across all categories; entries for sections a category does not use
 * are simply ignored.
 */
export const MAPPED_FIELDS_CONFIG = {
  firm_constitution: ['firm_name', 'organisation_type', 'nature_of_business', 'proprietor_name', 'pan_number', 'aadhar_number', 'caste', 'residential_address'],
  promoter_details: ['promoters'],
  product_details: ['nature_of_business'],
  product_characteristics: ['industry_type'],
  swot_analysis: ['district_and_state', 'product_or_service_list'],
  competitor_overview: ['district_and_state', 'product_or_service_list'],
  market_trend: ['district_and_state', 'product_or_service_list'],
  manpower: ['direct_staff_count']
};

/**
 * Sections excluded from validation (AI auto-generates them when left empty).
 * `manufacturing_process_flowchart` is only present for Manufacturing but listing
 * it here is harmless for other categories.
 */
export const SKIP_VALIDATION_SECTION_IDS = [
  'manufacturing_process_flowchart',
  'swot_analysis',
  'target_market_new',
  'competitor_overview',
  'market_trend',
  'conclusion'
];
