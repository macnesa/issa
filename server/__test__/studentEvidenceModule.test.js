jest.mock('../modules/student-evidence/student-evidence.repository', () => ({
  createStudentEvidence: jest.fn(),
  findStudentEvidences: jest.fn(),
  findStudentForRequester: jest.fn(),
  findStudentInClass: jest.fn(),
}));
jest.mock('../integrations/cloudinary', () => ({
  deleteStudentEvidenceImage: jest.fn(),
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
  createStudentEvidence,
  listStudentEvidences,
} = require('../modules/student-evidence/student-evidence.service');
const {
  maximumEvidenceFileSize,
  validateEvidenceFile,
} = require('../modules/student-evidence/student-evidence.validator');

const teacherRequester = {
  role: 'teacher',
  teacherId: 5,
  classId: 3,
};
const parentRequester = {
  role: 'parent',
  userId: 21,
  studentId: 7,
  classId: 3,
};
const validMetadata = {
  title: 'Science activity',
  category: 'activity',
  description: 'Plant growth observation',
  observedAt: '2026-07-25T08:00:00Z',
};
const validUploadResult = {
  secure_url: 'https://res.cloudinary.com/demo/image/upload/evidence.webp',
  public_id: 'issa/student-evidence/7/evidence-1',
  format: 'webp',
  bytes: 2048,
  resource_type: 'image',
};

function buildFile(mimetype = 'image/webp', size = 1024) {
  return {
    buffer: Buffer.alloc(Math.min(size, 16)),
    mimetype,
    size,
  };
}

function buildEvidence(overrides = {}) {
  return {
    id: 31,
    StudentId: 7,
    TeacherId: 5,
    title: 'Science activity',
    category: 'activity',
    description: 'Plant growth observation',
    observedAt: new Date('2026-07-25T08:00:00Z'),
    fileUrl: validUploadResult.secure_url,
    format: 'webp',
    fileSize: 2048,
    createdAt: new Date('2026-07-25T09:00:00Z'),
    ...overrides,
  };
}

describe('Student Evidence create authorization and lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    studentEvidenceRepository.findStudentInClass.mockResolvedValue({
      id: 7,
      ClassId: 3,
      Class: {
        Teacher: {
          id: 5,
          name: 'Teacher One',
        },
      },
    });
    studentEvidenceRepository.createStudentEvidence.mockResolvedValue(
      buildEvidence()
    );
    cloudinaryIntegration.uploadStudentEvidenceImage.mockResolvedValue(
      validUploadResult
    );
    cloudinaryIntegration.deleteStudentEvidenceImage.mockResolvedValue(true);
  });

  test('Teacher can create evidence for a student in their class', async () => {
    await expect(createStudentEvidence({
      studentId: '7',
      requester: teacherRequester,
      metadata: validMetadata,
      file: buildFile(),
    })).resolves.toEqual(expect.objectContaining({
      studentId: 7,
      teacher: {
        id: 5,
        name: 'Teacher One',
      },
      file: {
        url: validUploadResult.secure_url,
        format: 'webp',
        size: 2048,
      },
    }));

    expect(studentEvidenceRepository.findStudentInClass).toHaveBeenCalledWith(7, 3);
    expect(studentEvidenceRepository.createStudentEvidence).toHaveBeenCalledWith(
      expect.objectContaining({
        StudentId: 7,
        TeacherId: 5,
        title: 'Science activity',
        cloudinaryPublicId: validUploadResult.public_id,
      })
    );
  });

  test('Teacher is denied for a student outside their class', async () => {
    studentEvidenceRepository.findStudentInClass.mockResolvedValue(null);

    await expect(createStudentEvidence({
      studentId: '99',
      requester: teacherRequester,
      metadata: validMetadata,
      file: buildFile(),
    })).rejects.toEqual({ name: 'unauthorized' });

    expect(cloudinaryIntegration.uploadStudentEvidenceImage).not.toHaveBeenCalled();
  });

  test('Parent is denied on create before metadata or upload work', async () => {
    await expect(createStudentEvidence({
      studentId: '7',
      requester: parentRequester,
      metadata: validMetadata,
      file: buildFile(),
    })).rejects.toEqual({ name: 'unauthorized' });

    expect(studentEvidenceRepository.findStudentInClass).not.toHaveBeenCalled();
    expect(cloudinaryIntegration.uploadStudentEvidenceImage).not.toHaveBeenCalled();
  });

  test('invalid metadata is rejected before access lookup or upload', async () => {
    await expect(createStudentEvidence({
      studentId: '7',
      requester: teacherRequester,
      metadata: {
        ...validMetadata,
        title: '   ',
      },
      file: buildFile(),
    })).rejects.toEqual({ name: 'invalidEvidenceTitle' });

    expect(studentEvidenceRepository.findStudentInClass).not.toHaveBeenCalled();
    expect(cloudinaryIntegration.uploadStudentEvidenceImage).not.toHaveBeenCalled();
  });

  test('Cloudinary failure does not create a database row', async () => {
    cloudinaryIntegration.uploadStudentEvidenceImage.mockRejectedValue({
      name: 'evidenceUploadFailed',
    });

    await expect(createStudentEvidence({
      studentId: '7',
      requester: teacherRequester,
      metadata: validMetadata,
      file: buildFile(),
    })).rejects.toEqual({ name: 'evidenceUploadFailed' });

    expect(studentEvidenceRepository.createStudentEvidence).not.toHaveBeenCalled();
    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
  });

  test('database failure after upload triggers best-effort Cloudinary cleanup', async () => {
    const databaseError = new Error('database insert failed');
    studentEvidenceRepository.createStudentEvidence.mockRejectedValue(databaseError);

    await expect(createStudentEvidence({
      studentId: '7',
      requester: teacherRequester,
      metadata: validMetadata,
      file: buildFile(),
    })).rejects.toBe(databaseError);

    expect(cloudinaryIntegration.deleteStudentEvidenceImage)
      .toHaveBeenCalledWith(validUploadResult.public_id);
    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
  });

  test('cleanup failure does not replace the database error', async () => {
    const databaseError = new Error('database insert failed');
    studentEvidenceRepository.createStudentEvidence.mockRejectedValue(databaseError);
    cloudinaryIntegration.deleteStudentEvidenceImage.mockRejectedValue(
      new Error('cleanup failed')
    );

    await expect(createStudentEvidence({
      studentId: '7',
      requester: teacherRequester,
      metadata: validMetadata,
      file: buildFile(),
    })).rejects.toBe(databaseError);
  });

  test('invalid Cloudinary image response is rejected and cleaned up', async () => {
    cloudinaryIntegration.uploadStudentEvidenceImage.mockResolvedValue({
      ...validUploadResult,
      format: 'pdf',
      resource_type: 'raw',
    });

    await expect(createStudentEvidence({
      studentId: '7',
      requester: teacherRequester,
      metadata: validMetadata,
      file: buildFile(),
    })).rejects.toEqual({ name: 'invalidEvidenceUploadResult' });

    expect(studentEvidenceRepository.createStudentEvidence).not.toHaveBeenCalled();
    expect(cloudinaryIntegration.deleteStudentEvidenceImage)
      .toHaveBeenCalledWith(validUploadResult.public_id);
  });

  test('successful write emits one evidence invalidation event', async () => {
    await createStudentEvidence({
      studentId: '7',
      requester: teacherRequester,
      metadata: validMetadata,
      file: buildFile(),
    });

    expect(emitStudentRecordUpdated).toHaveBeenCalledTimes(1);
    expect(emitStudentRecordUpdated).toHaveBeenCalledWith({
      studentId: 7,
      recordType: 'evidence',
      occurredAt: new Date('2026-07-25T08:00:00Z'),
    });
  });

  test('failed write does not emit a realtime event', async () => {
    studentEvidenceRepository.createStudentEvidence.mockRejectedValue(
      new Error('database insert failed')
    );

    await expect(createStudentEvidence({
      studentId: '7',
      requester: teacherRequester,
      metadata: validMetadata,
      file: buildFile(),
    })).rejects.toThrow('database insert failed');

    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
  });
});

describe('Student Evidence file validation', () => {
  test.each([
    'image/jpeg',
    'image/png',
    'image/webp',
  ])('accepts supported MIME type %s', (mimetype) => {
    expect(validateEvidenceFile(buildFile(mimetype))).toEqual(
      expect.objectContaining({ mimetype })
    );
  });

  test('rejects an unsupported MIME type', () => {
    expect.assertions(1);
    try {
      validateEvidenceFile(buildFile('application/pdf'));
    } catch (error) {
      expect(error).toEqual({ name: 'invalidEvidenceFileType' });
    }
  });

  test('rejects a file larger than 5 MB', () => {
    expect.assertions(1);
    try {
      validateEvidenceFile(buildFile(
        'image/jpeg',
        maximumEvidenceFileSize + 1
      ));
    } catch (error) {
      expect(error).toEqual({ name: 'invalidEvidenceFileSize' });
    }
  });
});

describe('Student Evidence read authorization and ordering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    studentEvidenceRepository.findStudentForRequester.mockResolvedValue({ id: 7 });
    studentEvidenceRepository.findStudentEvidences.mockResolvedValue([]);
  });

  test('Parent can read evidence for their linked student', async () => {
    studentEvidenceRepository.findStudentEvidences.mockResolvedValue([
      buildEvidence({
        Teacher: {
          id: 5,
          name: 'Teacher One',
        },
      }),
    ]);

    await expect(listStudentEvidences({
      studentId: '7',
      requester: parentRequester,
    })).resolves.toEqual([
      expect.objectContaining({
        studentId: 7,
        teacher: {
          id: 5,
          name: 'Teacher One',
        },
      }),
    ]);
  });

  test('Parent is denied when reading another student evidence', async () => {
    await expect(listStudentEvidences({
      studentId: '8',
      requester: parentRequester,
    })).rejects.toEqual({ name: 'unauthorized' });

    expect(studentEvidenceRepository.findStudentForRequester).not.toHaveBeenCalled();
    expect(studentEvidenceRepository.findStudentEvidences).not.toHaveBeenCalled();
  });

  test('Teacher is denied when the student is outside their class scope', async () => {
    studentEvidenceRepository.findStudentForRequester.mockResolvedValue(null);

    await expect(listStudentEvidences({
      studentId: '99',
      requester: teacherRequester,
    })).rejects.toEqual({ name: 'unauthorized' });

    expect(studentEvidenceRepository.findStudentEvidences).not.toHaveBeenCalled();
  });

  test('list is ordered by observedAt then createdAt newest first', async () => {
    studentEvidenceRepository.findStudentEvidences.mockResolvedValue([
      buildEvidence({
        id: 1,
        observedAt: new Date('2026-07-20T08:00:00Z'),
        createdAt: new Date('2026-07-25T09:00:00Z'),
        Teacher: { id: 5, name: 'Teacher One' },
      }),
      buildEvidence({
        id: 2,
        observedAt: new Date('2026-07-25T08:00:00Z'),
        createdAt: new Date('2026-07-25T08:30:00Z'),
        Teacher: { id: 5, name: 'Teacher One' },
      }),
      buildEvidence({
        id: 3,
        observedAt: new Date('2026-07-25T08:00:00Z'),
        createdAt: new Date('2026-07-25T10:00:00Z'),
        Teacher: { id: 5, name: 'Teacher One' },
      }),
    ]);

    const evidenceList = await listStudentEvidences({
      studentId: '7',
      requester: teacherRequester,
    });

    expect(evidenceList.map((evidence) => evidence.id)).toEqual([3, 2, 1]);
  });
});
