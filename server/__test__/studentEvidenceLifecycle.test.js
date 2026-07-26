jest.mock('../modules/student-evidence/student-evidence.repository', () => ({
  findActiveStudentEvidence: jest.fn(),
  findStudentInClass: jest.fn(),
  retractStudentEvidence: jest.fn(),
  updateStudentEvidence: jest.fn(),
}));
jest.mock('../integrations/cloudinary', () => ({
  deleteStudentEvidenceImage: jest.fn(),
  destroyStudentEvidenceAsset: jest.fn(),
  uploadStudentEvidenceImage: jest.fn(),
}));
jest.mock('../realtime/student-record-events', () => ({
  emitStudentRecordUpdated: jest.fn(),
}));

const cloudinaryIntegration = require('../integrations/cloudinary');
const {
  emitStudentRecordUpdated,
} = require('../realtime/student-record-events');
const studentEvidenceRepository = require(
  '../modules/student-evidence/student-evidence.repository'
);
const {
  correctStudentEvidence,
  retractStudentEvidence,
} = require('../modules/student-evidence/student-evidence.service');

const teacherRequester = {
  role: 'teacher',
  teacherId: 5,
  classId: 3,
};
const otherTeacherRequester = {
  role: 'teacher',
  teacherId: 6,
  classId: 3,
};
const parentRequester = {
  role: 'parent',
  userId: 21,
  studentId: 7,
  classId: 3,
};

function buildEvidence(overrides = {}) {
  return {
    id: 31,
    StudentId: 7,
    TeacherId: 5,
    title: 'Science activity',
    category: 'activity',
    description: 'Plant growth observation',
    observedAt: new Date('2026-07-25T08:00:00Z'),
    fileUrl: 'https://res.cloudinary.com/demo/image/upload/evidence.webp',
    cloudinaryPublicId: 'issa/student-evidence/7/server-record-id',
    format: 'webp',
    fileSize: 2048,
    createdAt: new Date('2026-07-25T09:00:00Z'),
    updatedAt: new Date('2026-07-25T09:00:00Z'),
    Teacher: {
      id: 5,
      name: 'Teacher One',
    },
    ...overrides,
  };
}

describe('Student Evidence metadata correction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    studentEvidenceRepository.findStudentInClass.mockResolvedValue({
      id: 7,
      ClassId: 3,
    });
    studentEvidenceRepository.findActiveStudentEvidence.mockResolvedValue(
      buildEvidence()
    );
    studentEvidenceRepository.updateStudentEvidence.mockImplementation(
      async (evidence, updates) => ({ ...evidence, ...updates })
    );
  });

  test('creator Teacher can PATCH trimmed metadata without replacing file', async () => {
    const result = await correctStudentEvidence({
      studentId: '7',
      evidenceId: '31',
      requester: teacherRequester,
      patchPayload: {
        title: '  Corrected science activity  ',
        description: null,
        observedAt: '2026-07-26T08:00:00Z',
      },
    });

    expect(studentEvidenceRepository.updateStudentEvidence).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 31,
        cloudinaryPublicId: 'issa/student-evidence/7/server-record-id',
      }),
      {
        title: 'Corrected science activity',
        description: null,
        observedAt: new Date('2026-07-26T08:00:00Z'),
      }
    );
    expect(cloudinaryIntegration.destroyStudentEvidenceAsset)
      .not.toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({
      id: 31,
      title: 'Corrected science activity',
      file: {
        url: 'https://res.cloudinary.com/demo/image/upload/evidence.webp',
        format: 'webp',
        size: 2048,
      },
    }));
    expect(result).not.toHaveProperty('cloudinaryPublicId');
  });

  test('Teacher for another class is denied', async () => {
    studentEvidenceRepository.findStudentInClass.mockResolvedValue(null);

    await expect(correctStudentEvidence({
      studentId: '7',
      evidenceId: '31',
      requester: teacherRequester,
      patchPayload: { title: 'Denied correction' },
    })).rejects.toEqual({ name: 'unauthorized' });

    expect(studentEvidenceRepository.findActiveStudentEvidence)
      .not.toHaveBeenCalled();
  });

  test('Teacher with student access but not creator is denied', async () => {
    studentEvidenceRepository.findActiveStudentEvidence.mockResolvedValue(
      buildEvidence({ TeacherId: 5 })
    );

    await expect(correctStudentEvidence({
      studentId: '7',
      evidenceId: '31',
      requester: otherTeacherRequester,
      patchPayload: { title: 'Denied correction' },
    })).rejects.toEqual({ name: 'unauthorized' });

    expect(studentEvidenceRepository.updateStudentEvidence)
      .not.toHaveBeenCalled();
  });

  test('Parent is denied before database access', async () => {
    await expect(correctStudentEvidence({
      studentId: '7',
      evidenceId: '31',
      requester: parentRequester,
      patchPayload: { title: 'Denied correction' },
    })).rejects.toEqual({ name: 'unauthorized' });

    expect(studentEvidenceRepository.findStudentInClass).not.toHaveBeenCalled();
  });

  test.each([
    ['file', { file: 'replacement' }],
    ['storage ID', { cloudinaryPublicId: 'client-value' }],
    ['student ownership', { StudentId: 99 }],
    ['teacher ownership', { TeacherId: 99 }],
    ['retraction metadata', { retractionReason: 'client-value' }],
  ])('forbidden %s field rejects the entire PATCH', async (caseName, patchPayload) => {
    await expect(correctStudentEvidence({
      studentId: '7',
      evidenceId: '31',
      requester: teacherRequester,
      patchPayload,
    })).rejects.toEqual({ name: 'invalidEvidencePatchField' });

    expect(studentEvidenceRepository.updateStudentEvidence)
      .not.toHaveBeenCalled();
  });

  test('empty PATCH is rejected', async () => {
    await expect(correctStudentEvidence({
      studentId: '7',
      evidenceId: '31',
      requester: teacherRequester,
      patchPayload: {},
    })).rejects.toEqual({ name: 'invalidEvidencePatch' });
  });

  test('no-op PATCH returns current evidence without database write or event', async () => {
    const result = await correctStudentEvidence({
      studentId: '7',
      evidenceId: '31',
      requester: teacherRequester,
      patchPayload: {
        title: '  Science activity ',
        category: 'activity',
        description: 'Plant growth observation',
        observedAt: '2026-07-25T08:00:00Z',
      },
    });

    expect(result.id).toBe(31);
    expect(studentEvidenceRepository.updateStudentEvidence)
      .not.toHaveBeenCalled();
    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
  });

  test('actual PATCH writes once and emits one evidence event', async () => {
    await correctStudentEvidence({
      studentId: '7',
      evidenceId: '31',
      requester: teacherRequester,
      patchPayload: { category: 'assessment' },
    });

    expect(studentEvidenceRepository.updateStudentEvidence)
      .toHaveBeenCalledTimes(1);
    expect(emitStudentRecordUpdated).toHaveBeenCalledTimes(1);
    expect(emitStudentRecordUpdated).toHaveBeenCalledWith({
      studentId: 7,
      recordType: 'evidence',
      occurredAt: new Date('2026-07-25T08:00:00Z'),
    });
  });

  test('failed PATCH write does not emit realtime', async () => {
    const databaseError = new Error('evidence update failed');
    studentEvidenceRepository.updateStudentEvidence.mockRejectedValue(
      databaseError
    );

    await expect(correctStudentEvidence({
      studentId: '7',
      evidenceId: '31',
      requester: teacherRequester,
      patchPayload: { category: 'assessment' },
    })).rejects.toBe(databaseError);

    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
  });
});

describe('Student Evidence privacy-first retraction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    studentEvidenceRepository.findStudentInClass.mockResolvedValue({
      id: 7,
      ClassId: 3,
    });
    studentEvidenceRepository.findActiveStudentEvidence.mockResolvedValue(
      buildEvidence()
    );
    studentEvidenceRepository.retractStudentEvidence.mockResolvedValue(
      buildEvidence()
    );
    cloudinaryIntegration.destroyStudentEvidenceAsset.mockResolvedValue(true);
  });

  test('creator retracts using server-stored public ID and complete metadata', async () => {
    await expect(retractStudentEvidence({
      studentId: '7',
      evidenceId: '31',
      requester: teacherRequester,
      reason: '  Evidence dibagikan pada siswa yang keliru.  ',
    })).resolves.toEqual({
      id: 31,
      studentId: 7,
      retracted: true,
    });

    expect(cloudinaryIntegration.destroyStudentEvidenceAsset)
      .toHaveBeenCalledWith('issa/student-evidence/7/server-record-id');
    expect(studentEvidenceRepository.retractStudentEvidence)
      .toHaveBeenCalledWith(
        expect.objectContaining({ id: 31 }),
        {
          retractedAt: expect.any(Date),
          retractionReason: 'Evidence dibagikan pada siswa yang keliru.',
          RetractedByTeacherId: 5,
        }
      );
    expect(emitStudentRecordUpdated).toHaveBeenCalledTimes(1);
  });

  test.each([
    undefined,
    null,
    '  ',
    'ab',
    'a'.repeat(301),
  ])('invalid reason %p is rejected before access or Cloudinary', async (reason) => {
    await expect(retractStudentEvidence({
      studentId: '7',
      evidenceId: '31',
      requester: teacherRequester,
      reason,
    })).rejects.toEqual({ name: 'invalidEvidenceRetractionReason' });

    expect(studentEvidenceRepository.findStudentInClass).not.toHaveBeenCalled();
    expect(cloudinaryIntegration.destroyStudentEvidenceAsset)
      .not.toHaveBeenCalled();
  });

  test('Teacher with access but not creator cannot retract', async () => {
    await expect(retractStudentEvidence({
      studentId: '7',
      evidenceId: '31',
      requester: otherTeacherRequester,
      reason: 'Incorrect evidence.',
    })).rejects.toEqual({ name: 'unauthorized' });

    expect(cloudinaryIntegration.destroyStudentEvidenceAsset)
      .not.toHaveBeenCalled();
  });

  test('Parent cannot retract', async () => {
    await expect(retractStudentEvidence({
      studentId: '7',
      evidenceId: '31',
      requester: parentRequester,
      reason: 'Incorrect evidence.',
    })).rejects.toEqual({ name: 'unauthorized' });

    expect(studentEvidenceRepository.findStudentInClass).not.toHaveBeenCalled();
  });

  test('Cloudinary failure keeps the database row active and does not emit', async () => {
    cloudinaryIntegration.destroyStudentEvidenceAsset.mockRejectedValue({
      name: 'evidenceAssetDeleteFailed',
    });

    await expect(retractStudentEvidence({
      studentId: '7',
      evidenceId: '31',
      requester: teacherRequester,
      reason: 'Incorrect evidence.',
    })).rejects.toEqual({ name: 'evidenceAssetDeleteFailed' });

    expect(studentEvidenceRepository.retractStudentEvidence)
      .not.toHaveBeenCalled();
    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
  });

  test('Cloudinary not-found result allows a safe retry to complete', async () => {
    cloudinaryIntegration.destroyStudentEvidenceAsset.mockResolvedValue(true);

    await expect(retractStudentEvidence({
      studentId: '7',
      evidenceId: '31',
      requester: teacherRequester,
      reason: 'Retry after provider removal.',
    })).resolves.toEqual(expect.objectContaining({ retracted: true }));

    expect(studentEvidenceRepository.retractStudentEvidence)
      .toHaveBeenCalledTimes(1);
  });

  test('database failure after destroy preserves the original error and no event', async () => {
    const databaseError = new Error('evidence retraction transaction failed');
    studentEvidenceRepository.retractStudentEvidence.mockRejectedValue(
      databaseError
    );

    await expect(retractStudentEvidence({
      studentId: '7',
      evidenceId: '31',
      requester: teacherRequester,
      reason: 'Incorrect evidence.',
    })).rejects.toBe(databaseError);

    expect(cloudinaryIntegration.destroyStudentEvidenceAsset)
      .toHaveBeenCalledTimes(1);
    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
  });
});
