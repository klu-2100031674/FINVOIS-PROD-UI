export function getIncomeTaxTestData() {
  return {
    sub: 'Confirmation of Income Tax Return Acknowledgements-Reg.',
    rlms: '501260416071248',
    branch: 'RACPC-2, VIJAYAWADA',
    name: 'MR. SANTOSH KUMAR JAJU',
    pan: 'ARQPS8056F',
    udin: '26222863TIQNXH9953',
    place: 'Vijayawada',
    date: '12/05/2026',
    returns: [
      {
        sno: '1',
        type: 'ITR-3',
        section: '139(1)',
        fy: '2024-25',
        ay: '2025-26',
        date: '16-09-2025',
        ack: '650408500160925',
        income: '15,81,480',
        remark: 'VALID'
      },
      {
        sno: '2',
        type: 'ITR-3',
        section: '139(1)',
        fy: '2023-24',
        ay: '2024-25',
        date: '30-07-2024',
        ack: '230867170300724',
        income: '14,80,790',
        remark: 'VALID'
      }
    ]
  };
}

