/** Sample fill data for SBI Business verification (V R JEWELLERS layout). */
export function getSbiBussinessTestData(user) {
  return {
    report_date: '29-03-2026',
    rlms_number: '501260326010982',
    applicant_name: 'APPLICANT NAME AS PER FILE',
    applicant_phone: '9849509761',
    address:
      'SHOP NO 12, MAIN BAZAR, NEAR CLOCK TOWER, VIJAYAWADA, KRISHNA, AP - 520003',
    premises_name: 'V R JEWELLERS',
    building_description: 'GROUND FLOOR COMMERCIAL SHOP IN MIXED USE BUILDING',
    premises_owned_rented: 'RENTED',
    observed_staff_seen: '04',
    total_staff: '06',
    field_executive_intro: 'VISITED THE GIVEN ADDRESS AND MET THE APPLICANT,',
    business_name: 'V R JEWELLERS',
    applicant_designation: 'PARTNER',
    nature_of_business: 'GOLD & SILVER SHOP',
    nature_of_business_detail:
      'V R JEWELLERS IS A PARTNERSHIP FIRM, AND THE APPLICANT IS ONE OF THE PARTNERS- (OUT OF FOUR PARTNERS) THE FIRM IS SELLING ALL TYPES OF GOLD ORNAMENTS AND- SILVER ARTICLES)',
    business_experience: '7 YEARS',
    business_activities_seen: 'YES',
    business_name_board_seen: 'YES',
    turnover_declared: '15 CRORES',
    business_transaction_account: 'SBI OD  ACCOUNT  NO :  38755740706',
    activity_confirmed_by: 'MR.HARANATH',
    activity_confirmed_relationship: 'APPLICANT- NEIGHBOUR',
    business_note:
      'WE SEARCHED THE GST NUMBER OF V R JEWELLERS ON THE GST PORTAL TO CONFIRM THE APPLICANT  PARTNERSHIP, AS PER THE GST PORTAL RECORDS, THE APPLICANT IS ONE OF THE  PARTNER IN V R JEWELLERS, FURTHER WE FOUND ANNUAL AGGREGATE TURNOVER OF V R JEWELLERS  UNDER THE ₹ 5 CRORE TO 25 CRORES SLAB AS PER THE GST PORTAL RECORDS, AND V R JEWELLERS GST NUMBER  37AARFV4636J1ZG IS FOUND TO BE ACTIVE, AND SAME ARE ATTACHED.',
    supervised_by: 'MD.Khaja',
    verified_by: 'M.Suresh Babu',
    firm_contact: '9014221011, 9491349091, 0866-6551011, 6464786',
    status_positive: true,
    verification_status: 'Positive',
    executive_name: user?.name || 'M.Suresh Babu',
    executive_mobile: user?.phone || '9703960940'
  };
}
