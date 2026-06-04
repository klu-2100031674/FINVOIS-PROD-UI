/**
 * Sample fill data aligned with SBI House PDF reference layout.
 */
export function getSbiHouseTestData(user) {
  return {
    receipt_date: '17-04-2026',
    report_date: '18-04-2026',
    rlms_number: '501260420053255',
    reference_number: '1368 / 501260420053255',
    applicant_name: 'AMJURI SATYANARAYANA',
    co_applicant_name: 'AMJURI KANAKA DURGA BHAVANI',
    address:
      'D.no: 20-6-138/b, ground floor, near ramalayam, ramalingeswarapeta 6th lane, vijayawada, krishna, ap -520003',
    locality_surrounding: '3',
    accessibility: '1',
    entrance_motorable: 'yes',
    address_confirmed: 'yes',
    pin_code: '520003',
    landmark: 'Near ramalayam',
    accommodation_type: '1',
    supervised_by: 'MD.Khaja',
    verified_by: 'M.Suresh Babu',
    firm_contact: '9014221011, 9491349091, 0866-6551011, 6464786',
    floors: 'Ground + 1 Floors',
    watchman: 'no',
    lift: 'no',
    name_outside: 'no',
    appearance: 'good',
    entry_permitted: 'yes',
    person_contacted: 'AMJURI KANAKA DURGA BHAVANI',
    relationship: 'CO-APPLICANT',
    neighbour_verification: 'Positive',
    neighbour_comments:
      'Neighbours recognized the both applicant and confirmed the stay',
    applicant_mobile: '9347422584',
    co_applicant_mobile: '8374593674',
    field_executive_intro:
      'VISITED THE GIVEN ADDRESS, AND MET THE CO-APPLICANT, APPLICANT AND CO-APPLICANT ARE HUSBAND AND WIFE,',
    field_executive_comment_items: [
      { text: "BOTH APPLICANT'S HOUSE TYPE : ", emphasis: 'RESIDENTIAL HOUSE' },
      { text: "BOTH APPLICANT'S GIVEN FLAT OWNERSHIP: ", emphasis: 'RENTED (6,500 PER MONTH)' },
      { text: "BOTH APPLICANT'S DURATION OF STAY AT GIVEN ADDRESS : ", emphasis: '7 YEARS' },
      { text: "BOTH APPLICANT'S TOTAL FAMILY MEMBERS : ", emphasis: '04' },
      { text: 'NUMBER OF DEPENDENTS : APPLICANT : ', emphasis: '2' },
      { text: 'CO-APPLICANT : ', emphasis: '0' },
      { text: 'GIVEN DOCUMENTS WERE CHECKED, STANDARD OF LIVING IS SATISFACTORY,' },
      {
        text:
          "RESIDENCE CONFIRMATION: BOTH APPLICANT'S STAY CONFIRMED BY RAMANA (BOTH APPLICANT'S-NEIGHBOUR), NOTE: WE TOOK BOTH APPLICANT'S AADHAAR CARDS AS A SUPPORTING DOCUMENT FOR BOTH APPLICANT'S GIVEN RESIDENTIAL ADDRESS CONFIRMATION,AND SAME ARE ATTACHED."
      }
    ],
    status_positive: true,
    executive_name: user?.name || 'M.Suresh Babu',
    executive_mobile: user?.phone || '9703960940'
  };
}

/** SBI Business verification – sample V R JEWELLERS layout. */
export function getSbiBussinessTestData(user) {
  return {
    report_date: '18-04-2026',
    rlms_number: '501260420053255',
    applicant_name: 'APPLICANT NAME AS PER FILE',
    applicant_phone: '9347422584',
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
