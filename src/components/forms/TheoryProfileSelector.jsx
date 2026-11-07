import React from 'react';
import SectionSelectorBase from './SectionSelectorBase';
import { THEORY_PROFILE_CONFIGS } from './theoryProfileSections';

/**
 * Project Profile used only by theory pages.
 * Passes marketLocationFromProfile so SWOT and market sections use
 * District and State from Overview of the Location.
 */
const TheoryProfileSelector = ({ category, ...props }) => (
  <SectionSelectorBase
    {...props}
    sectionConfig={THEORY_PROFILE_CONFIGS[category] || THEORY_PROFILE_CONFIGS.manufacturing}
    marketLocationFromProfile
  />
);

export default TheoryProfileSelector;
