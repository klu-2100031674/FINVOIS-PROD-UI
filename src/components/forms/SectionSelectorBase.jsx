import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Button } from '../common';
import { normalizeStage2Snapshot, preparePromptsDataForBackend } from '../../utils/draftPayload';
import { MAPPED_FIELDS_CONFIG, SKIP_VALIDATION_SECTION_IDS } from './sectionSelectorShared';

const getVehicleTestData = (fieldName, templateId) => {
  const tid = String(templateId || '').trim().toUpperCase();

  const data = {
    TERM_LOAN_EV_VEHICLE: {
      nature_of_business: 'EV Commercial Vehicle Operations & Logistics',
      raw_materials: 'Not applicable for EV logistics service. Operational consumables include tires, lubricants, and battery pack coolant.',
      machinery_list: 'Electric Commercial Cargo Vehicles (3.5 Ton capacity) and 30kW Fast DC Charging stations.',
      machinery_supplier: 'Tata Motors Commercial Electric, Mumbai',
      total_machinery_cost: '22,50,000',
      power_load_required: '35 kW for DC Fast Charging infrastructure',
      inward_transport: 'Inward movement of cargo vehicles from the dealer to the logistics hub.',
      outward_transport: 'Eco-friendly electric fleet cargo transport for last-mile and middle-mile deliveries.',
      processing_steps: '1. Battery health & charging check -> 2. Route planning & optimization -> 3. Cargo loading at hub -> 4. Eco-friendly transit to destination -> 5. Delivery confirmation -> 6. Post-trip inspection & recharging.',
      experience_details: 'The proprietor has over 8 years of experience managing logistics operations and fleet dispatch for leading e-commerce platforms.',
      experience: '8 years in last-mile green logistics.',
      key_attributes: 'Excellent fleet management skills, strong client relationships with local retail distributors, and deep knowledge of EV route planning software.',
      swot_strengths: 'Zero emission fleet; high demand for green logistics; low operating costs per km; locked service contracts.',
      swot_weaknesses: 'High initial purchase cost of EVs; dependency on charging infrastructure; limited range per charge.',
      swot_opportunities: 'Government incentives for EV adoption; corporate carbon neutrality targets driving demand for green transport.',
      swot_threats: 'Grid power outages delaying charging; technological obsolescence of current battery systems; driver shortage.',
      competitor_notes: 'Most local competitors operate diesel cargo vehicles; our EV fleet provides a carbon-neutral and quieter delivery option, attracting premium corporate clients.',
      market_trend_notes: 'Last-mile delivery is rapidly transitioning to electric vehicles due to regulatory support and corporate sustainability mandates.',
    },
    TERM_LOAN_OTHER_THAN_EV_VEHICLE: {
      nature_of_business: 'Commercial Vehicle Logistics & Freight Transport',
      raw_materials: 'Not applicable for logistics service. Operational consumables include diesel, engine oil, tires, and general truck maintenance supplies.',
      machinery_list: 'Heavy Duty Commercial Diesel Trucks (10-wheels, 18-Ton capacity).',
      machinery_supplier: 'Ashok Leyland Commercial Vehicles, Chennai',
      total_machinery_cost: '35,00,000',
      power_load_required: 'Not applicable (Diesel fuel powered fleet)',
      inward_transport: 'Sourcing of trucks from regional manufacturing dealerships to operations yard.',
      outward_transport: 'Heavy-duty freight logistics and long-haul transport across state highways.',
      processing_steps: '1. Vehicle pre-trip inspection -> 2. Cargo loading & securing -> 3. Inter-state freight transit -> 4. Real-time GPS tracking -> 5. Unloading & delivery sign-off -> 6. Maintenance check.',
      experience_details: 'The promoter has 12 years of cargo trucking experience and a strong background in interstate permits and fleet operations.',
      experience: '12 years in interstate cargo and freight trucking.',
      key_attributes: 'Strong logistics management skills, deep understanding of motor vehicle rules, and established relations with corporate manufacturing units.',
      swot_strengths: 'Long-haul heavy cargo capability; wide dealer service network; flexible route options; high load capacity.',
      swot_weaknesses: 'High diesel fuel costs; high tailpipe emissions; regular wear and tear on highway routes.',
      swot_opportunities: 'National highway corridor expansion; rising industrial output requiring heavy freight moving; contract logistics.',
      swot_threats: 'Rising diesel prices compressing margins; strict emission regulations; highway toll hike.',
      competitor_notes: 'Competitors include smaller transport operators; differentiation through professional tracking, fixed transit times, and cargo insurance.',
      market_trend_notes: 'Long-haul cargo demand remains strong due to national manufacturing growth, with cargo safety and fleet fuel efficiency being key drivers.',
    },
    TERM_LOAN_JCB_VEHICLE: {
      nature_of_business: 'Earthmoving, Excavation & Construction Equipment Rental',
      raw_materials: 'Not applicable for equipment rental. Consumables include diesel, hydraulic oils, and wear parts like bucket teeth.',
      machinery_list: 'JCB 3DX EcoXcellence Backhoe Loader.',
      machinery_supplier: 'JCB India Authorized Dealership, Vijayawada',
      total_machinery_cost: '32,00,000',
      power_load_required: 'Not applicable (Diesel powered backhoe loader)',
      inward_transport: 'Flatbed trailer transport to move the JCB backhoe loader to construction sites.',
      outward_transport: 'Local site excavation, trenching, earthmoving, and material loading services.',
      processing_steps: '1. Site survey and safety assessment -> 2. Transporting loader to site -> 3. Earthmoving & excavation operations -> 4. Trenching/loading -> 5. Daily machine maintenance & cleanup.',
      experience_details: 'The promoter has 7 years of contract experience in civil excavation, land leveling, and utility trenching.',
      experience: '7 years in earthmoving and civil contracting.',
      key_attributes: 'Expert operator supervision, thorough knowledge of soil conditions, and a strong network with local real estate builders.',
      swot_strengths: 'Versatile dual-bucket machine; high utility in both urban and rural projects; robust demand from builders; low maintenance costs.',
      swot_weaknesses: 'Weather-dependent work (monsoons slow down earthworks); dependency on driver skills; high fuel consumption during heavy digging.',
      swot_opportunities: 'Urban real estate construction; government highway projects; irrigation canal cleaning contracts.',
      swot_threats: 'Unregulated local price competition; delay in builder payments; fuel cost escalation.',
      competitor_notes: 'Competitors offer similar rental equipment; differentiation through guaranteed operator availability, punctual service, and well-maintained machinery.',
      market_trend_notes: 'Mechanized excavation is highly preferred over manual labor due to tight project timelines and cost efficiency in real estate.',
    },
    TERM_LOAN_DRONE_VEHICLE: {
      nature_of_business: 'Agricultural Spraying, Aerial Mapping & Drone Survey Services',
      raw_materials: 'Not applicable for drone services. Consumables include drone batteries, battery charger, and spare propellers.',
      machinery_list: 'DGCA Approved Agri Spraying Drone (10L capacity), high-capacity smart batteries, charging hub, and hand-held controller.',
      machinery_supplier: 'AgriBot Drone Systems, Hyderabad',
      total_machinery_cost: '8,50,000',
      power_load_required: '5 kW for battery charging station',
      inward_transport: 'Compact utility vehicle or specialized rugged cases for transporting drone to fields.',
      outward_transport: 'Aerial crop spraying, crop health monitoring, and high-resolution mapping operations.',
      processing_steps: '1. Pre-flight check & GPS signal sync -> 2. Mixing pesticide/fertilizer (for spraying) -> 3. Flight path calibration via mobile app -> 4. Automated aerial spraying/mapping -> 5. Battery swap & reload -> 6. Data log upload.',
      experience_details: 'The promoter is a certified drone pilot (DGCA licensed) with a background in agricultural science and GIS mapping.',
      experience: '4 years in agricultural technology and aerial mapping.',
      key_attributes: 'Licensed drone operator, deep technical understanding of multispectral cameras, and strong ties with farmer cooperatives.',
      swot_strengths: 'DGCA certified operation; precise fertilizer spraying with minimal chemical waste; 10x faster than manual spraying.',
      swot_weaknesses: 'Weather-dependent flights (cannot operate in heavy wind/rain); limited battery life (15-20 min per charge).',
      swot_opportunities: 'Smart farming initiatives; government subsidies for agri-drones; commercial mapping for land surveys.',
      swot_threats: 'Strict DGCA flight zones/permissions; high cost of replacement parts; risk of accidental crashes.',
      competitor_notes: 'Very few licensed drone service providers operate in this district; our DGCA-compliant certified pilot status sets us apart from local hobbyists.',
      market_trend_notes: 'Agri-drones are seeing massive adoption due to labor shortages in spraying operations and government encouragement of precision agriculture.',
    }
  };

  return data[tid]?.[fieldName] || null;
};

/**
 * Generic, config-driven renderer for the Stage-2 "PROJECT PROFILE AND BUSINESS
 * ANALYSIS" form. Each business category supplies its own `sectionConfig`
 * (and optionally overrides the auto-map / skip-validation config) and renders
 * this base. Section numbers are derived automatically from the order of
 * `sectionConfig`.
 */
const SectionSelectorBase = ({
  onBack,
  onSubmit,
  initialData = {},
  onStage2Change,
  onSaveDraft,
  savingDraft = false,
  isVisible = true,
  onRegisterSnapshotGetter,
  sectionConfig,
  mappedFieldsConfig = MAPPED_FIELDS_CONFIG,
  skipValidationSectionIds = SKIP_VALIDATION_SECTION_IDS,
  templateId,
}) => {
  const SECTION_CONFIG = sectionConfig;
  const SKIP_VALIDATION_SECTIONS = new Set(skipValidationSectionIds);

  const [selectedSections, setSelectedSections] = useState({});
  const [sectionData, setSectionData] = useState({});
  const [expandedSection, setExpandedSection] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const [relatedDocuments, setRelatedDocuments] = useState([]);

  const [hiddenFields, setHiddenFields] = useState({});
  const docsRestoreToastShown = useRef(false);
  const stage2InitializedRef = useRef(false);
  const initAppliedRef = useRef(false);

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
          } else if (field.name === 'products') {
            testData[section.id][field.name] = [
              { name: "Sample Item A" },
              { name: "Sample Item B" }
            ];
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
              { description: "Construction", start_date: "01/04/2026", end_date: "30/06/2026" },
              { description: "Machinery/Equipment Erection", start_date: "01/07/2026", end_date: "15/08/2026" },
              { description: "Machinery/Equipment Trail Run", start_date: "16/08/2026", end_date: "31/08/2026" },
              { description: "Commercial Run start date", start_date: "01/09/2026", end_date: "01/09/2026" }
            ];
          } else if (field.name === 'manpower_requirements') {
            testData[section.id][field.name] = [
              { designation: "Plant Manager", count: "1" },
              { designation: "Skilled Operators", count: "2" },
              { designation: "Semi-Skilled Helpers", count: "4" },
              { designation: "Unskilled Workers", count: "8" },
              { designation: "Admin Staff", count: "2" }
            ];
          } else if (field.name === 'inventory_items') {
            testData[section.id][field.name] = [
              {
                type_of_material: "Raw material",
                quantity_to_be_stored_per_month: "12 Tonnes",
                no_of_days_stock: "30",
                justification: "To ensure uninterrupted production cycle"
              },
              {
                type_of_material: "Finished product",
                quantity_to_be_stored_per_month: "2 Tonnes",
                no_of_days_stock: "10",
                justification: "Based on dispatch schedule and local demand"
              }
            ];
          } else if (field.type === 'group_list') {
            const sub0 = field.subFields?.[0]?.name;
            const sub1 = field.subFields?.[1]?.name;
            const sampleRow = {};
            if (sub0) sampleRow[sub0] = "Initial Item";
            if (sub1) sampleRow[sub1] = "Initial Value";
            testData[section.id][field.name] = [sampleRow];
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
            const vehicleMatch = getVehicleTestData(field.name, templateId);
            if (vehicleMatch !== null) {
              testData[section.id][field.name] = vehicleMatch;
            } else if (field.name === 'key_attributes') {
              testData[section.id][field.name] = "The promoter possesses strong leadership qualities, technical proficiency in production management, and an extensive network within the local construction industry. Recognized for commitment to quality and timely delivery.";
            } else if (field.name === 'raw_materials') {
              testData[section.id][field.name] = "Key materials include Eco-friendly Fly Ash (sourced from Thermal Power Plants), Cement (53 Grade OPC/PPC), Quarry Dust/Sand, and specialized hardening chemicals.";
            } else if (field.name === 'machinery_list') {
              testData[section.id][field.name] = "Fully Automatic Hydraulic Brick Making Machine (100 Tons), Heavy Duty Pan Mixer (500kg), Pallet Conveyor System, and Industrial Grade Air Compressor.";
            } else if (field.name === 'processing_steps') {
              testData[section.id][field.name] = "1. Raw Material Batching -> 2. Pan Mixing with Water -> 3. Automated Molding under high pressure -> 4. Stacking on Pallets -> 5. Water Curing (14-21 days) -> 6. Quality Testing and Dispatch.";
            } else if (field.name === 'experience_details') {
              testData[section.id][field.name] = "The proprietor has over 10 years of hands-on experience in the civil construction sector, previously managing several small-scale subcontracting projects.";
            } else if (field.name === 'experience') {
              testData[section.id][field.name] = "Extensive experience in production planning and supply chain management.";
            } else if (field.name === 'swot_strengths') {
              testData[section.id][field.name] = "Consistent local demand; quality production; experienced promoter; favourable plant location.";
            } else if (field.name === 'swot_weaknesses') {
              testData[section.id][field.name] = "Limited initial production capacity; dependence on a few key suppliers.";
            } else if (field.name === 'swot_opportunities') {
              testData[section.id][field.name] = "Growing government infrastructure projects; rising preference for eco-friendly products.";
            } else if (field.name === 'swot_threats') {
              testData[section.id][field.name] = "Price fluctuations of raw materials; competition from established players.";
            } else if (field.name === 'competitor_notes') {
              testData[section.id][field.name] = "Local competitors are small and medium units focused on nearby construction projects; differentiation through consistent quality and timely delivery.";
            } else if (field.name === 'market_trend_notes') {
              testData[section.id][field.name] = "Demand is rising due to housing and infrastructure expansion; buyers prefer eco-friendly materials with consistent supply.";
            } else {
              testData[section.id][field.name] = `Detailed sample content for ${field.label} providing a professional narrative for the project report.`;
            }
          } else {
            const vehicleMatch = getVehicleTestData(field.name, templateId);
            if (vehicleMatch !== null) {
              testData[section.id][field.name] = vehicleMatch;
            } else if (field.name.includes('area_')) {
              testData[section.id][field.name] = "500";
            } else if (field.name === 'machinery_supplier') {
              testData[section.id][field.name] = "Reva Engineering Pvt Ltd, Ahmedabad";
            } else if (field.name === 'total_machinery_cost') {
              testData[section.id][field.name] = "28,50,000";
            } else if (field.name === 'nature_of_business') {
              testData[section.id][field.name] = "Fly Ash Brick Manufacturing";
            } else if (field.name === 'power_load_required') {
              testData[section.id][field.name] = "45 HP";
            } else if (field.name === 'inward_transport') {
              testData[section.id][field.name] = "Own Tractor/Trailers and external hired trucks for raw materials.";
            } else if (field.name === 'outward_transport') {
              testData[section.id][field.name] = "Dedicated delivery trucks for customer site supply.";
            } else if (field.name === 'location_name') {
              testData[section.id][field.name] = "Mangalagiri";
            } else if (field.name === 'district') {
              testData[section.id][field.name] = "Vijayawada";
            } else if (field.name === 'state') {
              testData[section.id][field.name] = "Andhra Pradesh";
            } else if (field.name === 'nearest_city') {
              testData[section.id][field.name] = "Vijayawada";
            } else {
              testData[section.id][field.name] = `Test ${field.label}`;
            }
          }
        }
      });
    });

    // Stage-1 / auto-map often creates non-empty group_list rows with empty subfields
    // (experience, installed capacity, milestone dates). The loop above skips those
    // because the array length > 0 — patch missing subfields without wiping mapped data.
    if (testData.promoter_details?.promoters?.length) {
      testData.promoter_details.promoters = testData.promoter_details.promoters.map((p) => ({
        ...p,
        experience:
          p.experience !== undefined && p.experience !== null && String(p.experience).trim() !== ''
            ? p.experience
            : (getVehicleTestData('experience', templateId) || '15 years in manufacturing, production planning, and plant operations.'),
      }));
    }

    const hasManufacturingCapacity = SECTION_CONFIG.some((s) => s.id === 'manufacturing_capacity');
    if (hasManufacturingCapacity) {
      if (!testData.manufacturing_capacity) testData.manufacturing_capacity = {};
      const capList = testData.manufacturing_capacity.product_capacity_list;
      if (Array.isArray(capList) && capList.length > 0) {
        testData.manufacturing_capacity.product_capacity_list = capList.map((row) => ({
          ...row,
          product_name:
            row.product_name !== undefined && row.product_name !== null && String(row.product_name).trim() !== ''
              ? row.product_name
              : 'Fly Ash Bricks',
          capacity:
            row.capacity !== undefined && row.capacity !== null && String(row.capacity).trim() !== ''
              ? row.capacity
              : '60,00,000 bricks per annum (installed capacity)',
        }));
      } else {
        testData.manufacturing_capacity.product_capacity_list = [
          { product_name: 'Fly Ash Bricks', capacity: '60,00,000 bricks per annum (installed capacity)' },
        ];
      }
    }

    const milestoneDateDefaults = [
      { start_date: '01/04/2026', end_date: '30/06/2026' },
      { start_date: '01/07/2026', end_date: '15/08/2026' },
      { start_date: '16/08/2026', end_date: '31/08/2026' },
      { start_date: '01/09/2026', end_date: '01/09/2026' },
    ];
    if (!testData.implementation_timeline) testData.implementation_timeline = {};
    if (testData.implementation_timeline.milestones?.length) {
      testData.implementation_timeline.milestones = testData.implementation_timeline.milestones.map((m, idx) => {
        const d = milestoneDateDefaults[idx] || { start_date: '01/01/2026', end_date: '31/01/2026' };
        const isCommercialRun = m.description === 'Commercial Run start date';
        const start =
          m.start_date !== undefined && m.start_date !== null && String(m.start_date).trim() !== ''
            ? String(m.start_date).trim()
            : d.start_date;
        let end =
          m.end_date !== undefined && m.end_date !== null && String(m.end_date).trim() !== ''
            ? String(m.end_date).trim()
            : d.end_date;
        if (isCommercialRun) end = end || start;
        return { ...m, start_date: start, end_date: end };
      });
    } else {
      testData.implementation_timeline.milestones = [
        { description: 'Construction', start_date: '01/04/2026', end_date: '30/06/2026' },
        { description: 'Machinery/Equipment Erection', start_date: '01/07/2026', end_date: '15/08/2026' },
        { description: 'Machinery/Equipment Trail Run', start_date: '16/08/2026', end_date: '31/08/2026' },
        { description: 'Commercial Run start date', start_date: '01/09/2026', end_date: '01/09/2026' },
      ];
    }

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
    if (initAppliedRef.current) return;
    initAppliedRef.current = true;

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

      const formatLakhAsRupees = (value) => {
        if (value === undefined || value === null || value === '') return '';
        const cleaned = String(value).replace(/[₹,\s]/g, '').trim();
        const numeric = Number(cleaned);
        if (!Number.isFinite(numeric)) return String(value);
        const rupees = Math.round(numeric * 100000);
        return `₹ ${rupees.toLocaleString('en-IN')}`;
      };

      const extractPlantMachineryFromFixedAssets = () => {
        const fixedAssets = stage1?.['Fixed Assets Schedule'] || stage1?.fixedAssetsSchedule || {};
        const plantCategory = fixedAssets?.['Plant and Machinery'] || fixedAssets?.plant_and_machinery;
        if (!plantCategory || typeof plantCategory !== 'object') return [];

        const normalizedItems = [];

        if (Array.isArray(plantCategory?.items)) {
          plantCategory.items.forEach((item = {}) => {
            const machineryName = (item.description || item.machinery_name || '').toString().trim();
            const rawCost = (item.amount ?? item.total_machinery_cost ?? '').toString().trim();
            const machineryCost = formatLakhAsRupees(rawCost);
            if (machineryName || machineryCost) {
              normalizedItems.push({
                machinery_name: machineryName,
                machinery_supplier: item.machinery_supplier || '',
                total_machinery_cost: machineryCost,
                quotations_taken: item.quotations_taken || '',
                machinery_origin: item.machinery_origin || ''
              });
            }
          });
          return normalizedItems;
        }

        Object.keys(plantCategory)
          .sort((a, b) => Number(a) - Number(b))
          .forEach((rowKey) => {
            const item = plantCategory[rowKey] || {};
            const machineryName = (item.description || item.machinery_name || '').toString().trim();
            const rawCost = (item.amount ?? item.total_machinery_cost ?? '').toString().trim();
            const machineryCost = formatLakhAsRupees(rawCost);
            const isActive = item?.isActive === undefined || item?.isActive === true;
            if (isActive && (machineryName || machineryCost)) {
              normalizedItems.push({
                machinery_name: machineryName,
                machinery_supplier: item.machinery_supplier || '',
                total_machinery_cost: machineryCost,
                quotations_taken: item.quotations_taken || '',
                machinery_origin: item.machinery_origin || ''
              });
            }
          });

        return normalizedItems;
      };

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
          const firmFromForm =
            getS1('General Information', 'i17') || getS1('General Information', 'i8');
          setMapped('firm_constitution', 'firm_name', firmFromForm);
          setMapped('firm_constitution', 'organisation_type', getS1('General Information', 'i14'));
          // Nature of Business comes only from the dedicated Stage-1 field (i15).
          setMapped('firm_constitution', 'nature_of_business', getS1('General Information', 'i15'));
          setMapped('firm_constitution', 'proprietor_name', getS1('General Information', 'i8'));
          setMapped('firm_constitution', 'pan_number', getS1('General Information', 'i18') || getS1('General Information', 'i11'));
          setMapped('firm_constitution', 'aadhar_number', getS1('General Information', 'i10'));
          setMapped('firm_constitution', 'caste', getS1('General Information', 'i21'));
          // Residential Address must come from the dedicated Stage-1 residential
          // address field — NOT the business/unit address (i16).
          const residential = getS1('General Information', 'residential_address');
          setMapped('firm_constitution', 'residential_address', residential);
        } else if (section.id === 'promoter_details') {
          // Flatten previous mappings into the list if available
           const name = getS1('General Information', 'i8') || stage1.proprietorName || '';
           if (name) {
              const caste = getS1('General Information', 'i21') || stage1.caste || '';
              const pan = getS1('General Information', 'i11') || stage1.panNo || '';
              const aadhar = getS1('General Information', 'i10') || stage1.aadharNo || '';
              // Proprietor's residential address — prefer the dedicated residential
              // field, falling back to legacy address only when unavailable.
              const address = getS1('General Information', 'residential_address') || getS1('General Information', 'i16') || stage1.address || '';
              const edu = getS1('General Information', 'i19') || stage1.education || '';
              const ageRaw = getS1('General Information', 'i12') ?? stage1.age ?? '';
              const age =
                ageRaw !== undefined && ageRaw !== null && String(ageRaw).trim() !== ''
                  ? String(ageRaw).trim()
                  : '';

              if (!autoMapped[section.id]) autoMapped[section.id] = {};
              autoMapped[section.id]['promoters'] = [{
                 name, caste, pan_number: pan, aadhar_number: aadhar, address, education: edu,
                 designation: "Proprietor", share_ratio: "100%", age, experience: ""
              }];
           }
        } else if (section.id === 'product_details') {
          // Only Nature of Business is pre-filled (read-only). The product /
          // service list is entered manually by the user (no prefill).
          setMapped('product_details', 'nature_of_business', getS1('General Information', 'i15'));
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
        } else if (section.id === 'plant_machinery') {
          const hasExistingMachinery = Array.isArray(stage1?.plant_machinery?.machinery_items) && stage1.plant_machinery.machinery_items.length > 0;
          if (!hasExistingMachinery) {
            const prefilledMachinery = extractPlantMachineryFromFixedAssets();
            if (prefilledMachinery.length > 0) {
              if (!autoMapped[section.id]) autoMapped[section.id] = {};
              autoMapped[section.id].machinery_items = prefilledMachinery;
            }
          }
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
        } else {
          // Ensure "Commercial Run start date" always has end_date mirrored from start_date
          next.implementation_timeline.milestones = next.implementation_timeline.milestones.map(m =>
            m.description === 'Commercial Run start date'
              ? { ...m, end_date: m.end_date || m.start_date }
              : m
          );
        }

        // Seed an empty product/service row so the manual entry field is visible.
        const productSection = SECTION_CONFIG.find((s) => s.id === 'product_details');
        const hasProductsField = productSection?.fields?.some((f) => f.name === 'products' && f.type === 'group_list');
        if (hasProductsField) {
          if (!next.product_details) next.product_details = {};
          if (!Array.isArray(next.product_details.products) || next.product_details.products.length === 0) {
            next.product_details.products = [{}];
          }
        }

        Object.keys(autoMapped).forEach(sId => {
          if (!next[sId]) next[sId] = {};
          Object.assign(next[sId], autoMapped[sId]);
        });

        // Overlay saved draft section data (user edits take precedence over auto-map)
        SECTION_CONFIG.forEach((section) => {
          const saved = stage1[section.id];
          if (saved && typeof saved === 'object' && Object.keys(saved).length > 0) {
            if (!next[section.id]) next[section.id] = {};
            Object.assign(next[section.id], saved);
          }
        });

        return next;
      });
    }

    const relatedMeta = initialData.related_documents_meta;
    if (Array.isArray(relatedMeta) && relatedMeta.length > 0) {
      setRelatedDocuments(
        relatedMeta.map((d) => ({
          title: d?.title || '',
          file: null,
          fileName: d?.fileName || '',
        }))
      );
      if (!docsRestoreToastShown.current && relatedMeta.some((d) => d?.fileName)) {
        docsRestoreToastShown.current = true;
        toast('Draft loaded — please re-attach PDF documents if needed.', { icon: '📄' });
      }
    }

    stage2InitializedRef.current = true;
  }, [initialData]);

  const getStage2Snapshot = useCallback(
    () => normalizeStage2Snapshot(selectedSections, sectionData, relatedDocuments),
    [selectedSections, sectionData, relatedDocuments]
  );

  useEffect(() => {
    if (!onStage2Change || !stage2InitializedRef.current) return undefined;
    const timer = setTimeout(() => {
      onStage2Change(getStage2Snapshot());
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedSections, sectionData, relatedDocuments, onStage2Change, getStage2Snapshot]);

  useEffect(() => {
    if (isVisible || !stage2InitializedRef.current || !onStage2Change) return;
    onStage2Change(getStage2Snapshot());
  }, [isVisible, onStage2Change, getStage2Snapshot]);

  const handleBack = () => {
    if (onStage2Change) {
      onStage2Change(getStage2Snapshot());
    }
    onBack?.();
  };

  const handleSaveDraftClick = () => {
    const snapshot = getStage2Snapshot();
    if (onStage2Change) {
      onStage2Change(snapshot);
    }
    onSaveDraft?.(snapshot);
  };

  useEffect(() => {
    if (!onRegisterSnapshotGetter) return undefined;
    onRegisterSnapshotGetter(() => getStage2Snapshot());
    return () => onRegisterSnapshotGetter(null);
  }, [onRegisterSnapshotGetter, getStage2Snapshot]);

  const toggleSection = (id) => {
    const newValue = !selectedSections[id];
    setSelectedSections(prev => ({ ...prev, [id]: newValue }));

    if (!newValue) {
      setValidationErrors((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }

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

      // Keep Manufacturing Capacity product names in sync with Section 5 products.
      if (sectionId === 'product_details' && field === 'products' && Array.isArray(value)) {
        const names = value
          .map((p) => (p && p.name ? String(p.name).trim() : ''))
          .filter(Boolean);
        if (names.length > 0) {
          if (!next.manufacturing_capacity) next.manufacturing_capacity = {};
          const currentList = next.manufacturing_capacity.product_capacity_list || [];
          next.manufacturing_capacity.product_capacity_list = names.map((name, idx) => ({
            ...(currentList[idx] || {}),
            product_name: name,
            capacity: currentList[idx]?.capacity || ''
          }));
        }
      }

      return next;
    });

    setValidationErrors((prev) => {
      if (!prev[sectionId]) return prev;
      const next = { ...prev };
      delete next[sectionId];
      return next;
    });
  };

  const isValuePresent = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.values(value).some(isValuePresent);
    return true;
  };

  const isFieldVisible = (field, currentSectionData) => {
    if (!field.dependsOn) return true;
    return currentSectionData[field.dependsOn.field] === field.dependsOn.value;
  };

  const getSectionValidationError = (section) => {
    // Skip validation entirely for configured sections
    if (SKIP_VALIDATION_SECTIONS.has(section.id)) return null;
    if (!selectedSections[section.id]) return null;

    const currentSectionData = sectionData[section.id] || {};
    const visibleFields = section.fields.filter((field) => {
      if (!isFieldVisible(field, currentSectionData)) return false;
      if (hiddenFields[section.id]?.includes(field.name)) return false;
      return true;
    });

    if (visibleFields.length === 0) return null;

    let hasCheckedCheckbox = false;

    for (const field of visibleFields) {
      const value = currentSectionData[field.name];
      if (field.required && !isValuePresent(value)) {
        return `Please fill ${field.label}.`;
      }

      if (field.type === 'group_list') {
        const isOptionalManpowerBreakdown = section.id === 'manpower' && field.name === 'manpower_requirements';
        if (isOptionalManpowerBreakdown) {
          continue;
        }

        if (!Array.isArray(value) || value.length === 0) {
          return `Please add ${field.label}.`;
        }

        const hasIncompleteItem = value.some((item = {}) => {
          const subFields = field.subFields || [];
          return subFields.some((subField) => {
            if (subField.readOnly) return false;
            if (subField.required === false) return false;
            return !isValuePresent(item[subField.name]);
          });
        });

        if (hasIncompleteItem) {
          return `Please complete all fields in ${field.label}.`;
        }

        continue;
      }

      if (field.type === 'statutory_list') {
        const checkedItems = Array.isArray(value)
          ? value.filter((item) => item?.checked)
          : [];

        if (checkedItems.length === 0) {
          return `Please select at least one option in ${field.label}.`;
        }

        const missingDescription = checkedItems.some((item) => !isValuePresent(item.description));
        if (missingDescription) {
          return `Please add details for selected ${field.label}.`;
        }

        continue;
      }

      if (field.type === 'checkbox') {
        if (value === true) {
          hasCheckedCheckbox = true;
        }
        continue;
      }

      if (!field.required && !isValuePresent(value)) {
        continue;
      }

      if (!isValuePresent(value)) {
        return `Please fill ${field.label}.`;
      }
    }

    const hasOnlyCheckboxFields = visibleFields.length > 0 && visibleFields.every((field) => field.type === 'checkbox');
    if (hasOnlyCheckboxFields && !hasCheckedCheckbox) {
      return 'Please select at least one option in this section.';
    }

    return null;
  };

  const validateSelectedSections = () => {
    const nextErrors = {};
    let firstInvalidSectionId = null;

    SECTION_CONFIG.forEach((section) => {
      // Do not validate these sections
      if (SKIP_VALIDATION_SECTIONS.has(section.id)) return;
      if (!selectedSections[section.id]) return;
      const error = getSectionValidationError(section);
      if (error) {
        nextErrors[section.id] = error;
        if (!firstInvalidSectionId) {
          firstInvalidSectionId = section.id;
        }
      }
    });

    setValidationErrors(nextErrors);

    if (firstInvalidSectionId) {
      setExpandedSection(firstInvalidSectionId);
      const sectionEl = document.getElementById(`section-card-${firstInvalidSectionId}`);
      if (sectionEl) {
        sectionEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    return Object.keys(nextErrors).length === 0;
  };

  const handleGroupListChange = (sectionId, fieldName, index, subField, value) => {
    const list = [...(sectionData[sectionId]?.[fieldName] || [])];
    if (!list[index]) list[index] = {};
    list[index][subField] = value;
    // "Commercial Run start date" has no end_date UI — mirror start_date so validation passes
    if (sectionId === 'implementation_timeline' && fieldName === 'milestones' &&
        list[index].description === 'Commercial Run start date' && subField === 'start_date') {
      list[index].end_date = value;
    }
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

    // A field is rendered read-only ("pre-filled") only when the prefill step
    // actually mapped a value into it from Stage 1 (tracked in hiddenFields).
    // mappedFieldsConfig documents which fields are eligible for that treatment.
    const isHidden = hiddenFields[sectionId]?.includes(field.name);

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
             <p className="text-xs text-[#7e22ce] flex items-center gap-1">
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

      // ── Special renderer for Implementation Timeline milestones ──────────
      if (sectionId === 'implementation_timeline' && field.name === 'milestones') {
        const FIXED_DESCRIPTIONS = [
          "Construction",
          "Machinery/Equipment Erection",
          "Machinery/Equipment Trail Run",
          "Commercial Run start date"
        ];
        const isFixedItem = (item) => FIXED_DESCRIPTIONS.includes(item.description);

        const insertMilestone = (beforeIndex) => {
          const list = [...items];
          list.splice(beforeIndex, 0, { description: '', start_date: '', end_date: '' });
          handleFieldChange(sectionId, field.name, list);
        };

        return (
          <div key={field.name} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">{field.label}</label>
            <div className="space-y-3">
              {items.map((item, idx) => {
                const isFixed = isFixedItem(item);
                const isCommercialRun = item.description === 'Commercial Run start date';
                return (
                  <React.Fragment key={idx}>
                    {/* "+" insert button before Commercial Run start date (and after any custom items) */}
                    {isCommercialRun && (
                      <div className="flex justify-center my-1">
                        <button
                          type="button"
                          onClick={() => insertMilestone(idx)}
                          className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium px-4 py-1.5 rounded-full border border-purple-300 hover:bg-purple-50 transition-colors shadow-sm"
                          title="Add custom stage before Commercial Run"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Stage
                        </button>
                      </div>
                    )}
                    <div className={`relative p-4 bg-gray-50 border rounded-lg border-purple-200 bg-purple-50/20`}>
                      <div className={`grid grid-cols-1 gap-4 ${isCommercialRun ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                        {/* Description */}
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                          <input
                            type="text"
                            placeholder="Stage description"
                            className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500`}
                            value={item.description || ''}
                            onChange={(e) => handleGroupListChange(sectionId, field.name, idx, 'description', e.target.value)}
                          />
                        </div>
                        {/* Start Date */}
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {isCommercialRun ? 'Date' : 'Start Date'}
                          </label>
                          <input
                            type="text"
                            placeholder="DD/MM/YYYY"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                            value={item.start_date || ''}
                            onChange={(e) => handleGroupListChange(sectionId, field.name, idx, 'start_date', e.target.value)}
                          />
                        </div>
                        {/* End Date — hidden for Commercial Run */}
                        {!isCommercialRun && (
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">End Date</label>
                            <input
                              type="text"
                              placeholder="DD/MM/YYYY"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                              value={item.end_date || ''}
                              onChange={(e) => handleGroupListChange(sectionId, field.name, idx, 'end_date', e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                      {/* Remove button only for custom (non-fixed) items */}
                      {!isFixed && (
                        <button
                          type="button"
                          onClick={() => removeGroupItem(sectionId, field.name, idx)}
                          className="absolute top-4 right-4 text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-full transition-colors"
                          title="Remove Stage"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        );
      }
      // ─────────────────────────────────────────────────────────────────────

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
      const isChildCheckbox = !!field.dependsOn;
      return (
        <div
          key={field.name}
          className={`flex items-center ${isChildCheckbox ? 'ml-7 pl-2 border-l border-gray-200' : ''}`}
        >
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

  const buildSubmitPromptsData = () => preparePromptsDataForBackend(sectionData);

  const handleSubmit = () => {
    if (!validateSelectedSections()) {
      return;
    }

    onSubmit({
      selected_sections: selectedSections,
      prompts_data: buildSubmitPromptsData(),
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
              <h2 className="text-2xl font-bold text-gray-900">PROJECT PROFILE AND BUSINESS ANALYSIS:</h2>
            </div>
            <button
              onClick={fillTestData}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md hover:bg-indigo-100 transition-colors text-sm font-medium"
            >
              Fill Test Data
            </button>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {/* Sections List */}
            <div className="space-y-3">
              {SECTION_CONFIG.map((section, index) => (
                <div
                  key={section.id}
                  id={`section-card-${section.id}`}
                  className={`border rounded-lg transition-all ${validationErrors[section.id]
                    ? 'border-red-300 bg-red-50/20'
                    : selectedSections[section.id]
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
                        {index + 1}. {section.title}
                      </span>
                    </div>

                    {section.fields.length > 0 && selectedSections[section.id] && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedSection(expandedSection === section.id ? null : section.id);
                        }}
                        className="inline-flex items-center justify-center p-1.5 rounded-md bg-gray-8 0 border border-gray-200 text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                      >
                        {expandedSection === section.id ?
                          <ChevronUpIcon className="w-5 h-5" /> :
                          <ChevronDownIcon className="w-5 h-5" />
                        }
                      </button>
                    )}
                  </div>

                  {selectedSections[section.id] && validationErrors[section.id] && (
                    <div className="px-4 pb-3 text-sm text-red-600">
                      {validationErrors[section.id]}
                    </div>
                  )}

                  {/* Expandable Fields Section */}
                  {selectedSections[section.id] && section.fields.length > 0 && expandedSection === section.id && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="pt-4 space-y-4">
                        {(() => {
                          const renderedFields = section.fields.map(field => renderField(field, section.id)).filter(f => f !== null);
                          return renderedFields.length > 0 ? renderedFields : (
                            <div className="flex items-center gap-2 p-3 bg-purple-50 text-purple-700 rounded-md text-sm border border-purple-100">
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
                onClick={handleBack}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Previous
              </Button>

              <div className="flex items-center gap-3">
                {onSaveDraft && (
                  <button
                    type="button"
                    onClick={handleSaveDraftClick}
                    disabled={savingDraft}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingDraft ? 'Saving…' : 'Save & draft'}
                  </button>
                )}
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
    </div>

  );
};

export default SectionSelectorBase;
