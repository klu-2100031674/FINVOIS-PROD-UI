/** Section IDs from ReportSectionSelector SECTION_CONFIG — used to split Stage 1 vs Stage 2 draft data. */
export const SECTION_SELECTOR_IDS = [
  'firm_constitution',
  'location_overview',
  'access_connectivity',
  'promoter_details',
  'product_details',
  'product_characteristics',
  'manufacturing_capacity',
  'manufacturing_process_flowchart',
  'swot_analysis',
  'target_market_new',
  'competitor_overview',
  'market_trend',
  'statutory_approvals',
  'marketing_techniques',
  'power_requirements',
  'inventory_stock_details',
  'plant_machinery',
  'raw_materials',
  'transportation',
  'manpower',
  'land_requirements',
  'implementation_timeline',
  'conclusion',
];

export const STAGE2_DRAFT_KEYS = [
  'selected_sections',
  'prompts_data',
  'related_documents_meta',
  'related_documents',
];

/** Stage-1 fields stored outside nested form sections (assets, loan %, etc.). */
export const STAGE1_META_KEYS = [
  'Fixed Assets Schedule',
  'Asset Loan Percentages',
  'Asset Loan Amounts',
  'Loan Percentage Cells',
  'rawFormData',
  'excelData',
  'bank_name',
  'branch_name',
];

function isNonEmptyValue(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return false;
}

/** True when prompts_data contains saved section-selector entries (not just Stage 1 Excel keys). */
export function hasSavedSectionPrompts(promptsData) {
  if (!promptsData || typeof promptsData !== 'object') return false;
  return SECTION_SELECTOR_IDS.some((id) => {
    const section = promptsData[id];
    if (!section || typeof section !== 'object') return false;
    return Object.values(section).some(isNonEmptyValue);
  });
}

/** Returns true when the draft should resume on PROJECT PROFILE (Stage 2). */
export function hasStage2DraftData(data, currentStep) {
  if (!data || typeof data !== 'object') return false;
  if (currentStep === 'section_selector') return true;

  const selected = data.selected_sections;
  if (selected && typeof selected === 'object' && Object.values(selected).some(Boolean)) {
    return true;
  }

  return hasSavedSectionPrompts(data.prompts_data);
}

/** Remove Stage 2 keys so Stage 1 forms receive only Excel-input fields. */
export function stripStage2FromDraft(data) {
  if (!data || typeof data !== 'object') return data ?? null;
  const stripped = { ...data };
  STAGE2_DRAFT_KEYS.forEach((key) => {
    delete stripped[key];
  });
  return stripped;
}

/** Build initialData for ReportSectionSelector from a full draft blob. */
export function buildSectionSelectorInitialData(fullDraft) {
  if (!fullDraft || typeof fullDraft !== 'object') {
    return { prompts_data: {}, selected_sections: {}, related_documents_meta: [] };
  }

  const stage1 = stripStage2FromDraft(fullDraft);
  const savedPrompts =
    fullDraft.prompts_data && typeof fullDraft.prompts_data === 'object'
      ? fullDraft.prompts_data
      : {};

  const prompts_data = { ...stage1, ...savedPrompts };

  const relatedMeta =
    fullDraft.related_documents_meta ??
    (Array.isArray(fullDraft.related_documents)
      ? fullDraft.related_documents.map((d) => ({
          title: d?.title || '',
          fileName: d?.fileName || d?.file?.name || '',
        }))
      : []);

  return {
    prompts_data,
    selected_sections: fullDraft.selected_sections || {},
    related_documents_meta: relatedMeta,
  };
}

/** Normalize live ReportSectionSelector state into stage2 draft shape. */
export function normalizeStage2Snapshot(selectedSections, sectionData, relatedDocuments) {
  return {
    selected_sections: selectedSections || {},
    prompts_data: sectionData || {},
    related_documents_meta: (relatedDocuments || []).map((d) => ({
      title: d.title || '',
      fileName: d.file?.name || d.fileName || '',
    })),
  };
}

/** Pull stage2 keys from a flat draft blob. */
export function extractStage2FromDraft(data) {
  if (!data || typeof data !== 'object') {
    return {
      selected_sections: {},
      prompts_data: {},
      related_documents_meta: [],
    };
  }

  const relatedMeta =
    data.related_documents_meta ??
    (Array.isArray(data.related_documents)
      ? data.related_documents.map((d) => ({
          title: d?.title || '',
          fileName: d?.fileName || d?.file?.name || '',
        }))
      : []);

  return {
    selected_sections: data.selected_sections || {},
    prompts_data: data.prompts_data || {},
    related_documents_meta: relatedMeta,
  };
}

/** Merge partial stage1 updates without dropping asset / loan meta from an existing draft. */
export function mergeStage1Preserving(existingStage1, partialUpdate) {
  const base = stripStage2FromDraft(existingStage1 || {});
  const update = stripStage2FromDraft(partialUpdate || {});
  const merged = { ...base, ...update };
  STAGE1_META_KEYS.forEach((key) => {
    if (update[key] === undefined && base[key] !== undefined) {
      merged[key] = base[key];
    }
  });
  return merged;
}

/** Merge stage1 excel form data with stage2 profile data into one flat draft blob. */
export function mergeStage1AndStage2(stage1, stage2) {
  const cleanStage1 = stripStage2FromDraft(stage1 || {});
  const s2 = stage2 || {};
  return {
    ...cleanStage1,
    selected_sections: s2.selected_sections || {},
    prompts_data: s2.prompts_data || {},
    related_documents_meta: s2.related_documents_meta || [],
  };
}

/** Compose the full draft payload when saving from ReportSectionSelector. */
export function buildStage2DraftPayload(stage1FormData, selectedSections, sectionData, relatedDocuments) {
  return mergeStage1AndStage2(
    stage1FormData,
    normalizeStage2Snapshot(selectedSections, sectionData, relatedDocuments)
  );
}
