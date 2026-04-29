module.exports = [
  {
    id: 'dispute_mock_001',
    escrowId: 'escrow_mock_003',
    initiatedBy: 'user_mock_003',
    reason: 'property_condition',
    description: 'Retail space plumbing issues discovered during inspection.',
    status: 'open',
    firstResponseDeadline: '2026-03-19T10:30:00.000Z',
    resolutionDeadline: '2026-03-22T10:30:00.000Z',
    documents: [],
    timeline: [
      {
        type: 'dispute_filed',
        timestamp: '2026-03-18T10:30:00.000Z',
        initiatedBy: 'user_mock_003',
        description: 'Issue raised with supporting inspection photos.'
      }
    ],
    createdAt: '2026-03-18T10:30:00.000Z',
    updatedAt: '2026-03-18T10:30:00.000Z'
  },
  {
    id: 'dispute_mock_002',
    escrowId: 'escrow_mock_002',
    initiatedBy: 'user_mock_002',
    reason: 'payment_issues',
    description: 'Buyer reports double debit during closing payment.',
    status: 'resolved',
    resolution: 'partial_refund',
    adminNotes: 'Processed refund for duplicate charge.',
    firstResponseDeadline: '2026-03-29T11:20:00.000Z',
    resolutionDeadline: '2026-04-01T11:20:00.000Z',
    documents: [],
    timeline: [
      {
        type: 'dispute_filed',
        timestamp: '2026-03-29T11:20:00.000Z',
        initiatedBy: 'user_mock_002',
        description: 'Payment reflected twice in dashboard.'
      },
      {
        type: 'dispute_resolved',
        timestamp: '2026-03-30T15:45:00.000Z',
        resolvedBy: 'admin@propertyark.com',
        resolution: 'partial_refund',
        adminNotes: 'Confirmed duplicate debit with gateway logs.'
      }
    ],
    createdAt: '2026-03-29T11:20:00.000Z',
    updatedAt: '2026-03-30T15:45:00.000Z'
  }
];
