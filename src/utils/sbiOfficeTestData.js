/** Sample fill data for SBI Office verification PDF. */
export function getSbiOfficeTestData(user) {
  return {
    report_date: '29-03-2026',
    rlms_number: '501260326010982',
    applicant_name: 'APPLICANT NAME AS PER FILE',
    applicant_phone: '9849509761',
    address:
      'SHOP NO 12, MAIN BAZAR, NEAR CLOCK TOWER, VIJAYAWADA, KRISHNA, AP - 520003',
    applicant_designation: 'Ward planning & regulation secretary',
    working_since: '1 Year 5 months',
    person_contacted: 'Applicant',
    total_service: '6 Years 6 months',
    person_contact_is_applicant: 'yes',
    office_floor: 'Ground+1st Flr',
    field_executive_intro: 'VISITED THE GIVEN ADDRESS AND MET THE APPLICANT.',
    office_department: 'IN TOWN PLANNING SECTION, FOR THE PAST 1 YEAR 6 MONTHS.',
    net_salary: '₹ 33,400 PER MONTH.',
    salary_credited_bank: 'SBI BANK (SNP -BRANCH)',
    employment_confirmed_by: 'MR. RAMBABU',
    employment_confirmed_relationship: 'ATTENDER',
    business_note:
      'WE TOOK APPLICANT EMPLOYEE ID AS A SUPPORTING DOCUMENT OF APPLICANT EMPLOYMENT CONFIRMATION IN GOVERNMENT OF ANDHRA PRADESH VILLAGE / WARD SECRETARIAT DEPARTMENT,AND SAME ARE ATTACHED.',
    supervised_by: 'MD.Khaja',
    verified_by: 'M.Suresh Babu',
    firm_contact: '9014221011, 9491349091, 0866-6551011, 6464786',
    status_positive: true,
    verification_status: 'Positive',
    executive_name: user?.name || 'M.Suresh Babu',
    executive_mobile: user?.phone || '9703960940'
  };
}
