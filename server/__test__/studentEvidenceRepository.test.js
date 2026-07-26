jest.mock('../models', () => ({
  Class: {},
  Student: {},
  StudentEvidence: {},
  Teacher: {},
  sequelize: {
    transaction: jest.fn(),
  },
}));

const { sequelize } = require('../models');
const {
  retractStudentEvidence,
} = require('../modules/student-evidence/student-evidence.repository');

describe('Student Evidence repository retraction transaction', () => {
  test('stores retraction metadata and soft deletes in one transaction', async () => {
    const transaction = { id: 'evidence-retraction-transaction' };
    sequelize.transaction.mockImplementation(async (transactionWork) =>
      transactionWork(transaction)
    );
    const evidenceRecord = {
      update: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn().mockResolvedValue(undefined),
    };
    const retractionMetadata = {
      retractedAt: new Date('2026-07-26T10:00:00Z'),
      retractionReason: 'Incorrect evidence.',
      RetractedByTeacherId: 5,
    };

    await expect(retractStudentEvidence(
      evidenceRecord,
      retractionMetadata
    )).resolves.toBe(evidenceRecord);

    expect(evidenceRecord.update).toHaveBeenCalledWith(
      retractionMetadata,
      { transaction }
    );
    expect(evidenceRecord.destroy).toHaveBeenCalledWith({ transaction });
  });
});
