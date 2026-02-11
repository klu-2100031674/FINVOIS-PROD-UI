import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '../common';

const SECTION_CONFIG = [
  {
    id: "firm_constitution",
    title: "1. Constitution of the Firm",
    prompt_ref: "constitution",
    fields: [
      { name: "firm_name", label: "Firm Name", type: "text", required: true },
      { name: "organisation_type", label: "Organization Type", type: "select", options: ["Proprietorship", "Partnership", "Private Limited", "LLP", "Other"] },
      { name: "nature_of_business", label: "Nature of Business", type: "text", placeholder: "Prefilled from previous page" },
      { name: "proprietor_name", label: "Name of Proprietor/ partner/Director/Member/trustee", type: "text", required: true },
      { name: "pan_number", label: "PAN Number", type: "text" },
      { name: "aadhar_number", label: "Aadhar Number", type: "text" },
      { name: "caste", label: "Caste/Category", type: "text" },
      { name: "residential_address", label: "Residential Address", type: "textarea" }
    ]
  },
  {
    id: "promoter_details",
    title: "2. Proprietor's Background & Education",
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
  },
  {
    id: "product_details",
    title: "3. Details of Product Manufactured / Finished Product",
    prompt_ref: "product_details",
    fields: [
      { name: "product_category", label: "Product Category", type: "text", placeholder: "e.g., Construction Materials, Textiles, etc." },
      { name: "main_product", label: "Main Product Manufactured", type: "text", placeholder: "Manually enter Main Product Manufactured" }
    ]
  },
  {
    id: "product_characteristics",
    title: "4. Key Characteristics of Product",
    prompt_ref: "product_characteristics",
    fields: [
      { name: "industry_type", label: "Industry Type", type: "text", placeholder: "e.g., Manufacturing, Service, etc." }
    ]
  },
  {
    id: "manufacturing_capacity",
    title: "5. Manufacturing Capacity",
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
  },
  {
    id: "manufacturing_process_flowchart",
    title: "6. Manufacturing Flowchart",
    prompt_ref: "manufacturing_process_flowchart",
    fields: [
      { name: "processing_steps", label: "Manufacturing Steps", type: "textarea", placeholder: "Briefly describe the process steps..." }
    ]
  },
  {
    id: "swot_analysis",
    title: "7. SWOT Analysis",
    prompt_ref: "swot_analysis",
    fields: [
      { name: "swot_user_description", label: "SWOT Notes (User Input)", type: "textarea", placeholder: "Describe your SWOT understanding or key points..." }
    ]
  },
  {
    id: "target_market_new",
    title: "8. Target Market",
    prompt_ref: "target_market",
    fields: [
      { name: "target_market", label: "Target Market", type: "textarea", required: true, placeholder: "Describe target market manually..." }
    ]
  },
  {
    id: "competitor_overview",
    title: "9. Competitor Overview",
    prompt_ref: "competitor_overview",
    fields: [
      { name: "competitor_notes", label: "Business / Competitor Context", type: "textarea", placeholder: "Share your local competitor insights, market positioning, or business context..." }
    ]
  },
  {
    id: "market_trend",
    title: "10. Market Trend",
    prompt_ref: "market_trend",
    fields: [
      { name: "market_trend_notes", label: "Market Trend Notes", type: "textarea", placeholder: "Describe recent demand trends, growth drivers, or changes in the market..." }
    ]
  },
  {
    id: "statutory_approvals",
    title: "11. Statutory Approvals",
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
  },
  {
    id: "marketing_techniques",
    title: "12. Marketing Techniques",
    prompt_ref: "marketing_techniques",
    fields: [
      { name: "has_previous_experience", label: "Previous Experience", type: "checkbox" },
      { name: "experience_details", label: "Experience Details", type: "textarea", dependsOn: { field: "has_previous_experience", value: true } },
      { name: "has_purchase_orders", label: "Have Purchase orders ", type: "checkbox" },
      { name: "po_details", label: "PO Details", type: "textarea", dependsOn: { field: "has_purchase_orders", value: true } },
      { name: "has_marketing_team", label: "Will market the products through Marketing team", type: "checkbox" },
      { name: "has_other_methods", label: "Other Methods", type: "checkbox" },
      { name: "other_marketing_details", label: "Other Marketing Methods Details", type: "textarea", dependsOn: { field: "has_other_methods", value: true } }
    ]
  },
  {
    id: "power_requirements",
    title: "13. Power Requirements",
    prompt_ref: "power_requirements",
    fields: [
      { name: "power_load_required", label: "Power Load (in HP/kW)", type: "text" }
    ]
  },
  {
    id: "plant_machinery",
    title: "14. Plant and Machinery",
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
  },
  {
    id: "raw_materials",
    title: "15. Raw Materials",
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
          { name: "description", label: "Description regarding the Raw Materials , Demand , supply , availability nearer to your unit.", type: "textarea" }
        ]
      }
    ]
  },
  {
    id: "transportation",
    title: "16. Transportation",
    prompt_ref: "transportation",
    fields: [
      { name: "inward_transport", label: "Inward Transportation (Raw Materials)", type: "text" },
      { name: "outward_transport", label: "Outward Transportation (Finished Goods)", type: "text" }
    ]
  },
  {
    id: "manpower",
    title: "17. Manpower",
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
  },
  {
    id: "land_requirements",
    title: "18. Justification of Land Requirements",
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
  },
  {
    id: "implementation_timeline",
    title: "19. Implementation Timeline",
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
  },
  {
    id: "conclusion",
    title: "20. Conclusion",
    prompt_ref: "conclusion",
    fields: [
      { name: "custom_conclusion", label: "Custom Conclusion (Optional)", type: "textarea" }
    ]
  }
];

const ReportSectionSelector = ({ onBack, onSubmit, initialData = {} }) => {
  const [selectedSections, setSelectedSections] = useState({});
  const [sectionData, setSectionData] = useState({});
  const [expandedSection, setExpandedSection] = useState(null);

  const [relatedDocuments, setRelatedDocuments] = useState([]);

  const [hiddenFields, setHiddenFields] = useState({});

  const fillTestData = () => {
    const testSelected = {};
    const testData = JSON.parse(JSON.stringify(sectionData)); // Deep clone to avoid mutation

    SECTION_CONFIG.forEach(section => {
      testSelected[section.id] = true;
      if (!testData[section.id]) testData[section.id] = {};

      section.fields.forEach(field => {
        // Only fill if it was NOT auto-mapped from S1 and currently empty
        const currentValue = testData[section.id][field.name];
        if (currentValue === undefined || currentValue === '' || currentValue === null || (Array.isArray(currentValue) && currentValue.length === 0)) {
          if (field.name === 'promoters') {
            testData[section.id][field.name] = [{
              name: "John Doe",
              designation: "Proprietor",
              caste: "General",
              share_ratio: "100%",
              pan_number: "ABCDE1234F",
              aadhar_number: "123456789012",
              address: "123 Ind. Estate, Hyderabad",
              age: "45",
              education: "Graduate",
              experience: "15 years in manufacturing"
            }];
          } else if (field.name === 'partner_education_list') {
            testData[section.id][field.name] = [{
              name: "John Doe",
              qualification: "Graduate (B.Com)",
              experience: "15 years of industry experience"
            }];
          } else if (field.name === 'machinery_items') {
            testData[section.id][field.name] = [{
              machinery_name: "Hydraulic Brick Making Machine",
              machinery_supplier: "Reva Engineering Pvt Ltd, Ahmedabad",
              total_machinery_cost: "12,00,000",
              quotations_taken: "Yes",
              machinery_origin: "india"
            }, {
              machinery_name: "Heavy Duty Pan Mixer (500kg)",
              machinery_supplier: "Local Industrial Supplier",
              total_machinery_cost: "5,50,000",
              quotations_taken: "Yes",
              machinery_origin: "india"
            }];
          } else if (field.name === 'material_items') {
            testData[section.id][field.name] = [{
              name: "Fly Ash (Class F)",
              quantity: "50 Tonnes per Day",
              supplier: "NTPC Simhadri, Visakhapatnam",
              description: "Sourced via long-term contract, high availability."
            }, {
              name: "OPC 53 Grade Cement",
              quantity: "100 Bags per Day",
              supplier: "Ultratech Cement Local Dealer",
              description: "Primary binding material, readily available."
            }];
          } else if (field.name === 'milestones') {
            testData[section.id][field.name] = [
              { description: "Construction", start_date: "01/04/2025", end_date: "30/06/2025" },
              { description: "Machinery/Equipment Erection", start_date: "01/07/2025", end_date: "15/08/2025" },
              { description: "Machinery/Equipment Trail Run", start_date: "16/08/2025", end_date: "31/08/2025" },
              { description: "Commercial Run start date", start_date: "01/09/2025", end_date: "01/09/2025" }
            ];
          } else if (field.name === 'manpower_requirements') {
            testData[section.id][field.name] = [
              { designation: "Plant Manager", count: "1" },
              { designation: "Skilled Operators", count: "2" },
              { designation: "Semi-Skilled Helpers", count: "4" },
              { designation: "Unskilled Workers", count: "8" },
              { designation: "Admin Staff", count: "2" }
            ];
          } else if (field.type === 'group_list') {
            testData[section.id][field.name] = [
              { [field.subFields[0].name]: "Initial Item", [field.subFields[1].name]: "Initial Value" }
            ];
          } else if (field.type === 'checkbox') {
            testData[section.id][field.name] = true;
          } else if (field.type === 'select') {
               // Prefer "Owned" or "Indigenous" or "Yes" if available
               const preferred = ["Owned", "Indigenous", "Yes", "Industrial"];
               const match = field.options.find(o => preferred.includes(o));
               testData[section.id][field.name] = match || field.options[0];
          } else if (field.type === 'radio') {
            testData[section.id][field.name] = field.options[0];
           } else if (field.type === 'textarea') {
             if (field.name === 'key_attributes') testData[section.id][field.name] = "The promoter possesses strong leadership qualities, technical proficiency in production management, and an extensive network within the local construction industry. Recognized for commitment to quality and timely delivery.";
             else if (field.name === 'raw_materials') testData[section.id][field.name] = "Key materials include Eco-friendly Fly Ash (sourced from Thermal Power Plants), Cement (53 Grade OPC/PPC), Quarry Dust/Sand, and specialized hardening chemicals.";
             else if (field.name === 'machinery_list') testData[section.id][field.name] = "Fully Automatic Hydraulic Brick Making Machine (100 Tons), Heavy Duty Pan Mixer (500kg), Pallet Conveyor System, and Industrial Grade Air Compressor.";
             else if (field.name === 'processing_steps') testData[section.id][field.name] = "1. Raw Material Batching -> 2. Pan Mixing with Water -> 3. Automated Molding under high pressure -> 4. Stacking on Pallets -> 5. Water Curing (14-21 days) -> 6. Quality Testing and Dispatch.";
             else if (field.name === 'experience_details') testData[section.id][field.name] = "The proprietor has over 10 years of hands-on experience in the civil construction sector, previously managing several small-scale subcontracting projects.";
             else if (field.name === 'experience') testData[section.id][field.name] = "Extensive experience in production planning and supply chain management.";
             else if (field.name === 'swot_user_description') testData[section.id][field.name] = "Strengths include consistent local demand and quality production; weaknesses include limited initial capacity; opportunities include government infrastructure projects; threats include price fluctuations of cement and fly ash.";
             else if (field.name === 'competitor_notes') testData[section.id][field.name] = "Local competitors are small and medium units focused on nearby construction projects; differentiation through consistent quality and timely delivery.";
             else if (field.name === 'market_trend_notes') testData[section.id][field.name] = "Demand is rising due to housing and infrastructure expansion; buyers prefer eco-friendly materials with consistent supply.";
             else testData[section.id][field.name] = `Detailed sample content for ${field.label} providing a professional narrative for the project report.`;
          } else {
             if (field.name.includes('area_')) testData[section.id][field.name] = "500";
             else if (field.name === 'machinery_supplier') testData[section.id][field.name] = "Reva Engineering Pvt Ltd, Ahmedabad";
             else if (field.name === 'total_machinery_cost') testData[section.id][field.name] = "28,50,000";
             else if (field.name === 'nature_of_business') testData[section.id][field.name] = "Fly Ash Brick Manufacturing";
             else if (field.name === 'power_load_required') testData[section.id][field.name] = "45 HP";
             else if (field.name === 'manufacturing_capacity') testData[section.id][field.name] = "60,00,000 Bricks per Annum";
             else if (field.name === 'main_product') testData[section.id][field.name] = "Fly Ash Bricks";
             else if (field.name === 'sub_product') testData[section.id][field.name] = "Solid Concrete Blocks";
             else if (field.name === 'inward_transport') testData[section.id][field.name] = "Own Tractor/Trailers and external hired trucks for raw materials.";
             else if (field.name === 'outward_transport') testData[section.id][field.name] = "Dedicated delivery trucks for customer site supply.";
             else testData[section.id][field.name] = `Test ${field.label}`;
          }

        }
      });
    });

    // Specific pre-fills for statutory_approvals
    if (testData.statutory_approvals) {
       testData.statutory_approvals.approvals = [
         { name: "GST", checked: true, description: "Applied date: 15/05/2025, Status: Pending" },
         { name: "Udyam (UAM/MSME) RC", checked: true, description: "RC No: UDYAM-AP-01-0001234" },
         { name: "Pollution Approval / NOC", checked: true, description: "Applied for CFE on 10/06/2025" }
       ];
    }

    // Specific Land Breakdown overrides if empty
    const landSec = testData.land_requirements || {};
    if (!landSec.land_items || landSec.land_items.length === 0) {
      landSec.land_items = [
        { details: "Plant, Administration, Factory, Storage, and Warehousing Buildings", area: "557.42 (6000 SFT)" },
        { details: "Open Areas and Greenery", area: "As per norms" }
      ];
    }
    testData.land_requirements = landSec;

    setSelectedSections(testSelected);
    setSectionData(testData);
  };

  useEffect(() => {
    const initialSelected = {};
    SECTION_CONFIG.forEach(section => {
      initialSelected[section.id] = initialData.selected_sections?.[section.id] === true;
    });
    setSelectedSections(initialSelected);

    // Grouping logic for prompts_data (Stage 2)
    // and Pre-filling from Stage 1 (initialData.prompts_data)
    if (initialData.prompts_data) {
      const stage1 = initialData.prompts_data;
      const getS1 = (section, cell) => stage1[section]?.[cell] || stage1[section]?.[cell.toLowerCase()] || '';

      const autoMapped = {};
      const newHiddenFields = {};

      const setMapped = (sectionId, fieldName, value) => {
        if (!value) return;
        if (!autoMapped[sectionId]) autoMapped[sectionId] = {};
        autoMapped[sectionId][fieldName] = value;
        
        if (!newHiddenFields[sectionId]) newHiddenFields[sectionId] = [];
        newHiddenFields[sectionId].push(fieldName);
      };

      SECTION_CONFIG.forEach(section => {
        // Specific pre-filling logic based on section id
        if (section.id === 'firm_constitution') {
          setMapped('firm_constitution', 'firm_name', getS1('General Information', 'i17'));
          setMapped('firm_constitution', 'organisation_type', getS1('General Information', 'i14'));
          setMapped('firm_constitution', 'nature_of_business', getS1('General Information', 'i15') || getS1('General Information', 'i9'));
          setMapped('firm_constitution', 'proprietor_name', getS1('General Information', 'i8'));
          setMapped('firm_constitution', 'pan_number', getS1('General Information', 'i18') || getS1('General Information', 'i11'));
          setMapped('firm_constitution', 'aadhar_number', getS1('General Information', 'i10'));
          setMapped('firm_constitution', 'caste', getS1('General Information', 'i21'));
          const address = getS1('General Information', 'i16');
          setMapped('firm_constitution', 'residential_address', address);
        } else if (section.id === 'promoter_details') {
          // Flatten previous mappings into the list if available
           const name = getS1('General Information', 'i8') || stage1.proprietorName || '';
           if (name) {
              const caste = getS1('General Information', 'i21') || stage1.caste || '';
              const pan = getS1('General Information', 'i11') || stage1.panNo || '';
              const aadhar = getS1('General Information', 'i10') || stage1.aadharNo || '';
              const address = getS1('General Information', 'i16') || stage1.address || '';
              const edu = getS1('General Information', 'i19') || stage1.education || '';
              
              if (!autoMapped[section.id]) autoMapped[section.id] = {};
              autoMapped[section.id]['promoters'] = [{
                 name, caste, pan_number: pan, aadhar_number: aadhar, address, education: edu,
                 designation: "Proprietor", share_ratio: "100%", age: "", experience: ""
              }];
              // We do not hide lists usually, but if desired:
              // setMapped(section.id, 'promoters', 'filled'); 
           }
        } else if (section.id === 'partner_education') {
           const name = getS1('General Information', 'i8') || stage1.proprietorName || '';
           const edu = getS1('General Information', 'i19') || stage1.education || '';
           if (name) {
              if (!autoMapped[section.id]) autoMapped[section.id] = {};
              autoMapped[section.id]['partner_education_list'] = [{
                 name, qualification: edu, experience: ""
              }];
           }
        } else if (section.id === 'product_details') {
          setMapped('product_details', 'main_product', getS1('General Information', 'i15'));
          setMapped('product_details', 'product_category', getS1('General Information', 'i14'));
        } else if (section.id === 'manufacturing_capacity') {
          const mainProd = getS1('General Information', 'i15');
          if (mainProd) {
            if (!autoMapped[section.id]) autoMapped[section.id] = {};
            autoMapped[section.id]['product_capacity_list'] = [{
              product_name: mainProd,
              capacity: ""
            }];
          }
        } else if (section.id === 'product_characteristics') {
          setMapped('product_characteristics', 'industry_type', getS1('General Information', 'i14'));
        } else if (section.id === 'swot_analysis' || section.id === 'competitor_overview' || section.id === 'market_trend') {
          const address = getS1('General Information', 'i16');
          const products = getS1('General Information', 'i15');
          setMapped(section.id, 'district_and_state', address);
          setMapped(section.id, 'product_or_service_list', products);
        } else if (section.id === 'manpower') {
          const skilled = parseInt(getS1('Expected Employment Generation', 'i24')) || 0;
          const semi = parseInt(getS1('Expected Employment Generation', 'i25')) || 0;
          const unskilled = parseInt(getS1('Expected Employment Generation', 'i26')) || 0;
          if (skilled || semi || unskilled) {
             setMapped('manpower', 'direct_staff_count', (skilled + semi + unskilled).toString());
          }
        }
      });

      setHiddenFields(newHiddenFields);
      setSectionData(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        
        // Ensure fixed milestones are initialized if not present
        if (!next.implementation_timeline) next.implementation_timeline = {};
        if (!next.implementation_timeline.milestones || next.implementation_timeline.milestones.length === 0) {
          next.implementation_timeline.milestones = [
            { description: "Construction", start_date: "", end_date: "" },
            { description: "Machinery/Equipment Erection", start_date: "", end_date: "" },
            { description: "Machinery/Equipment Trail Run", start_date: "", end_date: "" },
            { description: "Commercial Run start date", start_date: "", end_date: "" }
          ];
        }

        Object.keys(autoMapped).forEach(sId => {
          if (!next[sId]) next[sId] = {};
          Object.assign(next[sId], autoMapped[sId]);
        });
        return next;
      });
    }
  }, [initialData]);

  const toggleSection = (id) => {
    const newValue = !selectedSections[id];
    setSelectedSections(prev => ({ ...prev, [id]: newValue }));
    if (newValue) {
      setExpandedSection(id);
    } else if (expandedSection === id) {
      setExpandedSection(null);
    }
  };

  const handleFieldChange = (sectionId, field, value) => {
    setSectionData(prev => {
      const next = {
        ...prev,
        [sectionId]: {
          ...(prev[sectionId] || {}),
          [field]: value
        }
      };

      // Auto-fill Section 5 (Manufacturing Capacity) when Section 3 (Product Details) Main Product changes
      if (sectionId === 'product_details' && field === 'main_product' && value) {
        if (!next.manufacturing_capacity) next.manufacturing_capacity = {};
        const currentList = next.manufacturing_capacity.product_capacity_list || [];

        // Auto-fill if empty or if there's only one item that might be the previous main product
        if (currentList.length === 0 || (currentList.length === 1 && (!currentList[0].product_name || currentList[0].product_name === prev.product_details?.main_product))) {
          next.manufacturing_capacity.product_capacity_list = [{
            ...(currentList[0] || {}),
            product_name: value
          }];
        }
      }

      return next;
    });
  };

  const handleGroupListChange = (sectionId, fieldName, index, subField, value) => {
    const list = [...(sectionData[sectionId]?.[fieldName] || [])];
    if (!list[index]) list[index] = {};
    list[index][subField] = value;
    handleFieldChange(sectionId, fieldName, list);
  };

  const addGroupItem = (sectionId, fieldName) => {
    const list = [...(sectionData[sectionId]?.[fieldName] || [])];
    list.push({});
    handleFieldChange(sectionId, fieldName, list);
  };

  const removeGroupItem = (sectionId, fieldName, index) => {
    const list = [...(sectionData[sectionId]?.[fieldName] || [])];
    list.splice(index, 1);
    handleFieldChange(sectionId, fieldName, list);
  };

  const renderField = (field, sectionId) => {
    const currentSectionData = sectionData[sectionId] || {};

    // Check if this field is already mapped from Stage 1 to avoid redundant inputs
    const mappedFieldsConfig = {
      firm_constitution: ['firm_name', 'organisation_type', 'nature_of_business', 'proprietor_name', 'pan_number', 'aadhar_number', 'caste', 'residential_address'],
      promoter_details: ['promoters'],
      product_details: ['product_category'],
      product_characteristics: ['industry_type'],
      swot_analysis: ['district_and_state', 'product_or_service_list'],
      competitor_overview: ['district_and_state', 'product_or_service_list'],
      market_trend: ['district_and_state', 'product_or_service_list'],
      manpower: ['direct_staff_count']
    };

    const isAutoMappedField = mappedFieldsConfig[sectionId]?.includes(field.name);
    const hasValue = !!currentSectionData[field.name];

    // Check if this field is hidden (auto-mapped)
    // Logic update: We use `hiddenFields` state now which is more reliable
    const isHidden = hiddenFields[sectionId]?.includes(field.name);
    // REMOVED: if (isHidden) return null; -> Now we default to displaying them as disabled

    if (field.readOnly || isHidden) {
       // Render as disabled input or text
       return (
        <div key={field.name} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{field.label}</label>
            {field.type === 'textarea' ? (
                <textarea
                readOnly
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-100 text-gray-500 rounded-md focus:outline-none cursor-not-allowed resize-none"
                value={currentSectionData[field.name] || ''}
                />
            ) : (
                <input
                type="text"
                readOnly
                className="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-100 text-gray-500 rounded-md focus:outline-none cursor-not-allowed"
                value={currentSectionData[field.name] || ''}
                />
            )}
             <p className="text-xs text-blue-600 flex items-center gap-1">
                <InformationCircleIcon className="w-3 h-3"/>
                Pre-filled from previous forms
             </p>
        </div>
       )
    }

    if (field.type === 'statutory_list') {
      const listData = currentSectionData[field.name] || [];
      return (
        <div key={field.name} className="space-y-4">
          <div className="bg-emerald-600 text-white px-4 py-3 rounded-t-md font-semibold text-sm shadow-sm">
             Licenses, Clearances, Approvals, Consents and NOCs (Pre Establishment and Operation) :
          </div>
          <div className="border border-emerald-100 rounded-b-md p-4 space-y-3 bg-white shadow-sm">
            {field.items.map((itemLabel, idx) => {
              const itemData = listData.find(d => d.name === itemLabel) || { name: itemLabel, checked: false, description: '' };
              const isChecked = itemData.checked;

              return (
                <div key={itemLabel} className="flex flex-col md:flex-row md:items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3 md:w-2/5 min-w-[200px]">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        id={`check-${idx}`}
                        checked={isChecked}
                        onChange={(e) => {
                          const newList = [...listData];
                          const existingIdx = newList.findIndex(d => d.name === itemLabel);
                          if (existingIdx >= 0) {
                            newList[existingIdx] = { ...newList[existingIdx], checked: e.target.checked };
                          } else {
                            newList.push({ name: itemLabel, checked: e.target.checked, description: '' });
                          }
                          handleFieldChange(sectionId, field.name, newList);
                        }}
                        className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer transition-all"
                      />
                    </div>
                    <label htmlFor={`check-${idx}`} className={`text-sm font-medium transition-colors cursor-pointer ${isChecked ? 'text-emerald-700' : 'text-gray-600 hover:text-gray-900'}`}>
                      {itemLabel}
                    </label>
                  </div>

                  {isChecked && (
                    <div className="flex-1 animate-in fade-in slide-in-from-left-2 duration-200">
                      <input
                        type="text"
                        placeholder="Ex: Ack/RC No, Applied date, Commencement date, Expiry, Present Status, etc"
                        value={itemData.description || ''}
                        onChange={(e) => {
                          const newList = [...listData];
                          const existingIdx = newList.findIndex(d => d.name === itemLabel);
                          if (existingIdx >= 0) {
                            newList[existingIdx] = { ...newList[existingIdx], description: e.target.value };
                          } else {
                            newList.push({ name: itemLabel, checked: true, description: e.target.value });
                          }
                          handleFieldChange(sectionId, field.name, newList);
                        }}
                        className="w-full px-3 py-2 text-sm border border-emerald-100 bg-emerald-50/30 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 placeholder-teal-300"
                      />
                    </div>
                  )}
                  {!isChecked && <div className="flex-1 hidden md:block text-xs text-gray-400 italic">
                    (Ex : Ack/RC No, Applied date, Present Status, etc)
                  </div>}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (field.dependsOn) {
      const depValue = currentSectionData[field.dependsOn.field];
      if (depValue !== field.dependsOn.value) return null;
    }

    if (field.type === 'group_list') {
      const items = currentSectionData[field.name] || [];
      return (
        <div key={field.name} className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">{field.label}</label>
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="relative p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8">
                  {field.subFields.map(sub => (
                    <div key={sub.name} className="space-y-1">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {sub.label}
                      </label>
                      {sub.type === 'select' ? (
                          <select
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 bg-white"
                            value={item[sub.name] || ''}
                            onChange={(e) => handleGroupListChange(sectionId, field.name, idx, sub.name, e.target.value)}
                          >
                             <option value="">Select</option>
                             {sub.options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                      ) : sub.type === 'textarea' ? (
                        <textarea
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 resize-none"
                          rows={2}
                          placeholder={sub.label}
                          value={item[sub.name] || ''}
                          onChange={(e) => handleGroupListChange(sectionId, field.name, idx, sub.name, e.target.value)}
                        />
                      ) : (
                        <input
                          type="text"
                          placeholder={sub.label}
                          readOnly={sub.readOnly}
                          className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 ${sub.readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                          value={item[sub.name] || ''}
                          onChange={(e) => handleGroupListChange(sectionId, field.name, idx, sub.name, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
                {!field.isFixed && (
                  <button
                    type="button"
                    onClick={() => removeGroupItem(sectionId, field.name, idx)}
                    className="absolute top-4 right-4 text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-full transition-colors"
                    title="Remove Item"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          {!field.isFixed && (
            <button
              type="button"
              onClick={() => addGroupItem(sectionId, field.name)}
              className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium px-2 py-1 rounded hover:bg-purple-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add {field.label}
            </button>
          )}
        </div>
      );
    }

    if (field.type === 'radio') {
      return (
        <div key={field.name} className="space-y-2">
          <span className="block text-sm font-medium text-gray-700">{field.label}</span>
          <div className="flex gap-6">
            {field.options.map(opt => (
              <label key={opt} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name={`${sectionId}-${field.name}`}
                  value={opt}
                  checked={currentSectionData[field.name] === opt || (!currentSectionData[field.name] && field.default === opt)}
                  onChange={(e) => handleFieldChange(sectionId, field.name, e.target.value)}
                  className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      )
    }

    if (field.type === 'checkbox') {
      return (
        <div key={field.name} className="flex items-center">
          <input
            type="checkbox"
            checked={!!currentSectionData[field.name]}
            onChange={(e) => handleFieldChange(sectionId, field.name, e.target.checked)}
            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <label className="ml-2 text-sm text-gray-700">
            {field.label}
          </label>
        </div>
      )
    }

    if (field.type === 'select') {
      return (
        <div key={field.name} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">{field.label}</label>
          <select
            value={currentSectionData[field.name] || ''}
            onChange={(e) => handleFieldChange(sectionId, field.name, e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 bg-white"
          >
            <option value="">Select {field.label}</option>
            {field.options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )
    }

    return (
      <div key={field.name} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        {field.type === 'textarea' ? (
          <textarea
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 resize-none"
            rows={3}
            placeholder={field.placeholder}
            value={currentSectionData[field.name] || ''}
            onChange={(e) => handleFieldChange(sectionId, field.name, e.target.value)}
          />
        ) : (
          <input
            type="text"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            placeholder={field.placeholder}
            value={currentSectionData[field.name] || ''}
            onChange={(e) => handleFieldChange(sectionId, field.name, e.target.value)}
          />
        )}
      </div>
    );
  };


  const handleSubmit = () => {
    onSubmit({
      selected_sections: selectedSections,
      prompts_data: sectionData,
      related_documents: relatedDocuments
    });
  };

  const addRelatedDocument = () => {
    setRelatedDocuments((prev) => ([
      ...prev,
      { title: '', file: null }
    ]));
  };

  const updateRelatedDocument = (index, key, value) => {
    setRelatedDocuments((prev) => prev.map((doc, i) => (
      i === index ? { ...doc, [key]: value } : doc
    )));
  };

  const removeRelatedDocument = (index) => {
    setRelatedDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-6">
        {/* Header Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Customize Your Report Sections</h2>
              <p className="text-sm text-gray-600 mt-1">
                Select the sections you want to include in the Detailed Project Report and provide necessary details.
              </p>
            </div>
            {/* <button
              onClick={fillTestData}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md hover:bg-indigo-100 transition-colors text-sm font-medium"
            >
              Fill Test Data
            </button> */}
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {/* Sections List */}
            <div className="space-y-3">
              {SECTION_CONFIG.map(section => (
                <div
                  key={section.id}
                  className={`border rounded-lg transition-all ${selectedSections[section.id]
                    ? 'border-purple-200 bg-purple-50/30'
                    : 'border-gray-200 bg-white'
                    }`}
                >
                  {/* Section Header */}
                  <div
                    className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-gray-50/50 transition-colors rounded-lg"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={!!selectedSections[section.id]}
                        onChange={(e) => { e.stopPropagation(); toggleSection(section.id); }}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 cursor-pointer"
                      />
                      <span className={`text-sm font-medium ${selectedSections[section.id] ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                        {section.title}
                      </span>
                    </div>

                    {section.fields.length > 0 && selectedSections[section.id] && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedSection(expandedSection === section.id ? null : section.id);
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                      >
                        {expandedSection === section.id ?
                          <ChevronUpIcon className="w-5 h-5" /> :
                          <ChevronDownIcon className="w-5 h-5" />
                        }
                      </button>
                    )}
                  </div>

                  {/* Expandable Fields Section */}
                  {selectedSections[section.id] && section.fields.length > 0 && expandedSection === section.id && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="pt-4 space-y-4">
                        {(() => {
                          const renderedFields = section.fields.map(field => renderField(field, section.id)).filter(f => f !== null);
                          return renderedFields.length > 0 ? renderedFields : (
                            <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-md text-sm border border-blue-100">
                              <InformationCircleIcon className="w-4 h-4" />
                              <span>All details for this section are already pre-filled from your previous inputs.</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Related Documents */}
          <div className="border-t border-gray-200 px-6 py-5 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Related Documents</h3>
                <p className="text-xs text-gray-500">Add PDFs to be appended after the final report.</p>
              </div>
              <button
                type="button"
                onClick={addRelatedDocument}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-100 rounded-md hover:bg-purple-100"
              >
                <span className="text-sm">+</span>
                Add Document
              </button>
            </div>

            {relatedDocuments.length === 0 ? (
              <div className="text-sm text-gray-500 italic">No related documents added.</div>
            ) : (
              <div className="space-y-3">
                {relatedDocuments.map((doc, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-white border border-gray-200 rounded-lg p-3">
                    <div className="col-span-12 md:col-span-5">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Document Title</label>
                      <input
                        type="text"
                        value={doc.title}
                        onChange={(e) => updateRelatedDocument(idx, 'title', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="Enter document title"
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Upload PDF</label>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={(e) => updateRelatedDocument(idx, 'file', e.target.files?.[0] || null)}
                        className="w-full text-sm"
                      />
                      {doc.file && (
                        <p className="text-xs text-gray-500 mt-1">{doc.file.name}</p>
                      )}
                    </div>
                    <div className="col-span-12 md:col-span-1 flex md:justify-end">
                      <button
                        type="button"
                        onClick={() => removeRelatedDocument(idx)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg">
            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                onClick={onBack}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Previous
              </Button>

              <Button
                onClick={handleSubmit}
                className="px-6 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default ReportSectionSelector;
