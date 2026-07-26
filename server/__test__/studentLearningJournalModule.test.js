jest.mock('../modules/student-learning-journal/student-learning-journal.repository', () => ({
  createJournalEntry: jest.fn(),
  findEvidenceForStudent: jest.fn(),
  findJournalEntries: jest.fn(),
  findJournalEntry: jest.fn(),
  findStudentForRequester: jest.fn(),
  retractJournalEntry: jest.fn(),
  updateJournalEntry: jest.fn(),
}));
jest.mock('../realtime/student-record-events', () => ({
  emitStudentRecordUpdated: jest.fn(),
}));

const {
  emitStudentRecordUpdated,
} = require('../realtime/student-record-events');
const studentLearningJournalRepository = require(
  '../modules/student-learning-journal/student-learning-journal.repository'
);
const {
  createJournalEntry,
  listJournalEntries,
  retractJournalEntry,
  updateJournalEntry,
} = require(
  '../modules/student-learning-journal/student-learning-journal.service'
);

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
const validJournalPayload = {
  type: 'observation',
  content: 'Ari mencoba dua strategi saat menyelesaikan latihan.',
  observedAt: '2026-07-25T08:00:00Z',
};

function buildEvidence(overrides = {}) {
  return {
    id: 31,
    StudentId: 7,
    title: 'Eksperimen warna',
    category: 'activity',
    observedAt: new Date('2026-07-24T08:00:00Z'),
    fileUrl: 'https://res.cloudinary.com/demo/image/upload/evidence.webp',
    cloudinaryPublicId: 'must-not-leak',
    format: 'webp',
    fileSize: 2048,
    ...overrides,
  };
}

function buildJournalEntry(overrides = {}) {
  return {
    id: 41,
    StudentId: 7,
    TeacherId: 5,
    EvidenceId: null,
    type: 'observation',
    content: 'Ari mencoba dua strategi saat menyelesaikan latihan.',
    voiceCaptureType: null,
    observedAt: new Date('2026-07-25T08:00:00Z'),
    createdAt: new Date('2026-07-25T09:00:00Z'),
    updatedAt: new Date('2026-07-25T09:00:00Z'),
    deletedAt: null,
    Teacher: {
      id: 5,
      name: 'Teacher One',
    },
    StudentEvidence: null,
    ...overrides,
  };
}

describe('Shared Learning Journal create and validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    studentLearningJournalRepository.findStudentForRequester.mockResolvedValue({
      id: 7,
      ClassId: 3,
    });
    studentLearningJournalRepository.findEvidenceForStudent.mockResolvedValue(
      buildEvidence()
    );
    studentLearningJournalRepository.createJournalEntry.mockResolvedValue({
      id: 41,
    });
    studentLearningJournalRepository.findJournalEntry.mockResolvedValue(
      buildJournalEntry()
    );
  });

  test('Teacher creates an entry for a student in their class', async () => {
    await expect(createJournalEntry({
      studentId: '7',
      requester: teacherRequester,
      journalPayload: validJournalPayload,
    })).resolves.toEqual(expect.objectContaining({
      id: 41,
      studentId: 7,
      type: 'observation',
      teacher: {
        id: 5,
        name: 'Teacher One',
      },
      evidence: null,
      wasEdited: false,
    }));

    expect(studentLearningJournalRepository.findStudentForRequester)
      .toHaveBeenCalledWith({
        studentId: 7,
        requesterRole: 'teacher',
        requesterClassId: 3,
        requesterStudentId: undefined,
      });
    expect(studentLearningJournalRepository.createJournalEntry)
      .toHaveBeenCalledWith(expect.objectContaining({
        StudentId: 7,
        TeacherId: 5,
        type: 'observation',
        content: validJournalPayload.content,
        voiceCaptureType: null,
        EvidenceId: null,
      }));
  });

  test('Teacher is denied for a student outside their class', async () => {
    studentLearningJournalRepository.findStudentForRequester.mockResolvedValue(
      null
    );

    await expect(createJournalEntry({
      studentId: '8',
      requester: teacherRequester,
      journalPayload: validJournalPayload,
    })).rejects.toEqual({ name: 'unauthorized' });

    expect(studentLearningJournalRepository.createJournalEntry)
      .not.toHaveBeenCalled();
    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
  });

  test('Parent is denied before create validation or database work', async () => {
    await expect(createJournalEntry({
      studentId: '7',
      requester: parentRequester,
      journalPayload: {},
    })).rejects.toEqual({ name: 'unauthorized' });

    expect(studentLearningJournalRepository.findStudentForRequester)
      .not.toHaveBeenCalled();
    expect(studentLearningJournalRepository.createJournalEntry)
      .not.toHaveBeenCalled();
  });

  test('invalid type is rejected', async () => {
    await expect(createJournalEntry({
      studentId: '7',
      requester: teacherRequester,
      journalPayload: {
        ...validJournalPayload,
        type: 'student_voice',
      },
    })).rejects.toEqual({ name: 'invalidJournalType' });
  });

  test.each([
    ['empty', '   '],
    ['short', 'ab'],
    ['too long', 'a'.repeat(1501)],
  ])('%s content is rejected', async (caseName, content) => {
    await expect(createJournalEntry({
      studentId: '7',
      requester: teacherRequester,
      journalPayload: {
        ...validJournalPayload,
        content,
      },
    })).rejects.toEqual({ name: 'invalidJournalContent' });
  });

  test('student reflection requires a capture type', async () => {
    await expect(createJournalEntry({
      studentId: '7',
      requester: teacherRequester,
      journalPayload: {
        ...validJournalPayload,
        type: 'student_reflection',
      },
    })).rejects.toEqual({ name: 'invalidJournalVoiceCaptureType' });
  });

  test.each(['direct_quote', 'paraphrased'])(
    'student reflection accepts %s',
    async (voiceCaptureType) => {
      studentLearningJournalRepository.findJournalEntry.mockResolvedValue(
        buildJournalEntry({
          type: 'student_reflection',
          voiceCaptureType,
        })
      );

      await expect(createJournalEntry({
        studentId: '7',
        requester: teacherRequester,
        journalPayload: {
          ...validJournalPayload,
          type: 'student_reflection',
          voiceCaptureType,
        },
      })).resolves.toEqual(expect.objectContaining({
        type: 'student_reflection',
        voiceCaptureType,
      }));
    }
  );

  test('voice capture type is rejected for a non-reflection entry', async () => {
    await expect(createJournalEntry({
      studentId: '7',
      requester: teacherRequester,
      journalPayload: {
        ...validJournalPayload,
        voiceCaptureType: 'direct_quote',
      },
    })).rejects.toEqual({ name: 'invalidJournalVoiceCaptureType' });
  });

  test('observedAt more than 24 hours in the future is rejected', async () => {
    await expect(createJournalEntry({
      studentId: '7',
      requester: teacherRequester,
      journalPayload: {
        ...validJournalPayload,
        observedAt: '2999-01-01T00:00:00Z',
      },
    })).rejects.toEqual({ name: 'invalidJournalObservedAt' });
  });

  test('evidence owned by the same student can be linked', async () => {
    studentLearningJournalRepository.findJournalEntry.mockResolvedValue(
      buildJournalEntry({
        EvidenceId: 31,
        StudentEvidence: buildEvidence(),
      })
    );

    const result = await createJournalEntry({
      studentId: '7',
      requester: teacherRequester,
      journalPayload: {
        ...validJournalPayload,
        evidenceId: 31,
      },
    });

    expect(studentLearningJournalRepository.findEvidenceForStudent)
      .toHaveBeenCalledWith(31, 7);
    expect(result.evidence).toEqual({
      id: 31,
      title: 'Eksperimen warna',
      category: 'activity',
      observedAt: new Date('2026-07-24T08:00:00Z'),
      file: {
        url: 'https://res.cloudinary.com/demo/image/upload/evidence.webp',
        format: 'webp',
        size: 2048,
      },
    });
    expect(result.evidence).not.toHaveProperty('cloudinaryPublicId');
  });

  test('evidence owned by another student is rejected', async () => {
    studentLearningJournalRepository.findEvidenceForStudent.mockResolvedValue(
      null
    );

    await expect(createJournalEntry({
      studentId: '7',
      requester: teacherRequester,
      journalPayload: {
        ...validJournalPayload,
        evidenceId: 99,
      },
    })).rejects.toEqual({ name: 'unauthorized' });

    expect(studentLearningJournalRepository.createJournalEntry)
      .not.toHaveBeenCalled();
    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
  });

  test('successful create emits exactly one journal event', async () => {
    await createJournalEntry({
      studentId: '7',
      requester: teacherRequester,
      journalPayload: validJournalPayload,
    });

    expect(emitStudentRecordUpdated).toHaveBeenCalledTimes(1);
    expect(emitStudentRecordUpdated).toHaveBeenCalledWith({
      studentId: 7,
      recordType: 'journal',
      occurredAt: new Date('2026-07-25T08:00:00Z'),
    });
  });

  test('failed create does not emit realtime', async () => {
    const databaseError = new Error('journal insert failed');
    studentLearningJournalRepository.createJournalEntry.mockRejectedValue(
      databaseError
    );

    await expect(createJournalEntry({
      studentId: '7',
      requester: teacherRequester,
      journalPayload: validJournalPayload,
    })).rejects.toBe(databaseError);

    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
  });
});

describe('Shared Learning Journal read contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    studentLearningJournalRepository.findStudentForRequester.mockResolvedValue({
      id: 7,
      ClassId: 3,
    });
    studentLearningJournalRepository.findJournalEntries.mockResolvedValue([]);
  });

  test('Parent reads journal for their linked student', async () => {
    studentLearningJournalRepository.findJournalEntries.mockResolvedValue([
      buildJournalEntry(),
    ]);

    await expect(listJournalEntries({
      studentId: '7',
      requester: parentRequester,
    })).resolves.toEqual([
      expect.objectContaining({
        id: 41,
        studentId: 7,
      }),
    ]);
  });

  test('Parent is denied when reading another student journal', async () => {
    await expect(listJournalEntries({
      studentId: '8',
      requester: parentRequester,
    })).rejects.toEqual({ name: 'unauthorized' });

    expect(studentLearningJournalRepository.findStudentForRequester)
      .not.toHaveBeenCalled();
    expect(studentLearningJournalRepository.findJournalEntries)
      .not.toHaveBeenCalled();
  });

  test('list is ordered by observedAt then createdAt and limited to 50', async () => {
    const records = Array.from({ length: 52 }, (_, index) =>
      buildJournalEntry({
        id: index + 1,
        observedAt: new Date(index === 0
          ? '2026-07-20T08:00:00Z'
          : '2026-07-25T08:00:00Z'),
        createdAt: new Date(
          Date.UTC(2026, 6, 25, 9, 0, Math.min(index, 59))
        ),
      })
    );
    studentLearningJournalRepository.findJournalEntries.mockResolvedValue(
      records
    );

    const result = await listJournalEntries({
      studentId: '7',
      requester: teacherRequester,
    });

    expect(result).toHaveLength(50);
    expect(result[0].id).toBe(52);
    expect(result.some((entry) => entry.id === 1)).toBe(false);
  });

  test('normal response excludes deletedAt and Cloudinary public ID', async () => {
    studentLearningJournalRepository.findJournalEntries.mockResolvedValue([
      buildJournalEntry({
        EvidenceId: 31,
        StudentEvidence: buildEvidence(),
      }),
    ]);

    const [result] = await listJournalEntries({
      studentId: '7',
      requester: parentRequester,
    });

    expect(result).not.toHaveProperty('deletedAt');
    expect(result.evidence).not.toHaveProperty('cloudinaryPublicId');
    expect(result.evidence.file).toEqual({
      url: 'https://res.cloudinary.com/demo/image/upload/evidence.webp',
      format: 'webp',
      size: 2048,
    });
  });
});

describe('Shared Learning Journal update ownership and realtime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    studentLearningJournalRepository.findStudentForRequester.mockResolvedValue({
      id: 7,
      ClassId: 3,
    });
    studentLearningJournalRepository.findEvidenceForStudent.mockResolvedValue(
      buildEvidence()
    );
    studentLearningJournalRepository.findJournalEntry.mockResolvedValue(
      buildJournalEntry()
    );
    studentLearningJournalRepository.updateJournalEntry.mockResolvedValue(
      buildJournalEntry()
    );
  });

  test('Teacher updates their own entry without changing identity fields', async () => {
    const updatedEntry = buildJournalEntry({
      content: 'Ari mencoba strategi visual dan meminta umpan balik.',
      updatedAt: new Date('2026-07-25T10:00:00Z'),
    });
    studentLearningJournalRepository.findJournalEntry
      .mockResolvedValueOnce(buildJournalEntry())
      .mockResolvedValueOnce(updatedEntry);

    const result = await updateJournalEntry({
      studentId: '7',
      entryId: '41',
      requester: teacherRequester,
      journalPayload: {
        content: '  Ari mencoba strategi visual dan meminta umpan balik.  ',
        StudentId: 99,
        TeacherId: 99,
      },
    });

    expect(studentLearningJournalRepository.updateJournalEntry)
      .toHaveBeenCalledWith(
        expect.objectContaining({ id: 41 }),
        {
          content: 'Ari mencoba strategi visual dan meminta umpan balik.',
        }
      );
    expect(result).toEqual(expect.objectContaining({
      studentId: 7,
      content: 'Ari mencoba strategi visual dan meminta umpan balik.',
      wasEdited: true,
    }));
  });

  test('another Teacher cannot update the entry', async () => {
    await expect(updateJournalEntry({
      studentId: '7',
      entryId: '41',
      requester: otherTeacherRequester,
      journalPayload: { content: 'Perubahan tidak sah.' },
    })).rejects.toEqual({ name: 'unauthorized' });

    expect(studentLearningJournalRepository.updateJournalEntry)
      .not.toHaveBeenCalled();
    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
  });

  test('no-op update does not write or emit realtime', async () => {
    const result = await updateJournalEntry({
      studentId: '7',
      entryId: '41',
      requester: teacherRequester,
      journalPayload: {
        content: `  ${validJournalPayload.content}  `,
        StudentId: 99,
        TeacherId: 99,
      },
    });

    expect(result.id).toBe(41);
    expect(studentLearningJournalRepository.updateJournalEntry)
      .not.toHaveBeenCalled();
    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
  });

  test('valid update emits exactly one journal event', async () => {
    const updatedEntry = buildJournalEntry({
      observedAt: new Date('2026-07-26T08:00:00Z'),
      updatedAt: new Date('2026-07-26T09:00:00Z'),
    });
    studentLearningJournalRepository.findJournalEntry
      .mockResolvedValueOnce(buildJournalEntry())
      .mockResolvedValueOnce(updatedEntry);

    await updateJournalEntry({
      studentId: '7',
      entryId: '41',
      requester: teacherRequester,
      journalPayload: {
        observedAt: '2026-07-26T08:00:00Z',
      },
    });

    expect(emitStudentRecordUpdated).toHaveBeenCalledTimes(1);
    expect(emitStudentRecordUpdated).toHaveBeenCalledWith({
      studentId: 7,
      recordType: 'journal',
      occurredAt: updatedEntry.observedAt,
    });
  });

  test('changing away from reflection clears capture type', async () => {
    const reflectionEntry = buildJournalEntry({
      type: 'student_reflection',
      voiceCaptureType: 'direct_quote',
    });
    const updatedEntry = buildJournalEntry({
      type: 'observation',
      voiceCaptureType: null,
      updatedAt: new Date('2026-07-25T10:00:00Z'),
    });
    studentLearningJournalRepository.findJournalEntry
      .mockResolvedValueOnce(reflectionEntry)
      .mockResolvedValueOnce(updatedEntry);

    await updateJournalEntry({
      studentId: '7',
      entryId: '41',
      requester: teacherRequester,
      journalPayload: {
        type: 'observation',
      },
    });

    expect(studentLearningJournalRepository.updateJournalEntry)
      .toHaveBeenCalledWith(
        reflectionEntry,
        {
          type: 'observation',
          voiceCaptureType: null,
        }
      );
  });

  test('evidence from another student is rejected on update', async () => {
    studentLearningJournalRepository.findEvidenceForStudent.mockResolvedValue(
      null
    );

    await expect(updateJournalEntry({
      studentId: '7',
      entryId: '41',
      requester: teacherRequester,
      journalPayload: { evidenceId: 99 },
    })).rejects.toEqual({ name: 'unauthorized' });

    expect(studentLearningJournalRepository.updateJournalEntry)
      .not.toHaveBeenCalled();
    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
  });

  test('failed update does not emit realtime', async () => {
    const databaseError = new Error('journal update failed');
    studentLearningJournalRepository.updateJournalEntry.mockRejectedValue(
      databaseError
    );

    await expect(updateJournalEntry({
      studentId: '7',
      entryId: '41',
      requester: teacherRequester,
      journalPayload: { content: 'Perubahan valid untuk dicatat.' },
    })).rejects.toBe(databaseError);

    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
  });
});

describe('Shared Learning Journal soft delete ownership and realtime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    studentLearningJournalRepository.findStudentForRequester.mockResolvedValue({
      id: 7,
      ClassId: 3,
    });
    studentLearningJournalRepository.findJournalEntry.mockResolvedValue(
      buildJournalEntry()
    );
    studentLearningJournalRepository.retractJournalEntry.mockResolvedValue(
      undefined
    );
  });

  test('Teacher soft deletes their own entry and emits one event', async () => {
    await expect(retractJournalEntry({
      studentId: '7',
      entryId: '41',
      requester: teacherRequester,
    })).resolves.toEqual({
      id: 41,
      studentId: 7,
      retracted: true,
    });

    expect(studentLearningJournalRepository.retractJournalEntry)
      .toHaveBeenCalledWith(expect.objectContaining({ id: 41 }));
    expect(emitStudentRecordUpdated).toHaveBeenCalledTimes(1);
    expect(emitStudentRecordUpdated).toHaveBeenCalledWith({
      studentId: 7,
      recordType: 'journal',
      occurredAt: new Date('2026-07-25T08:00:00Z'),
    });
  });

  test('Parent cannot delete an entry', async () => {
    await expect(retractJournalEntry({
      studentId: '7',
      entryId: '41',
      requester: parentRequester,
    })).rejects.toEqual({ name: 'unauthorized' });

    expect(studentLearningJournalRepository.retractJournalEntry)
      .not.toHaveBeenCalled();
  });

  test('another Teacher cannot delete the entry', async () => {
    await expect(retractJournalEntry({
      studentId: '7',
      entryId: '41',
      requester: otherTeacherRequester,
    })).rejects.toEqual({ name: 'unauthorized' });

    expect(studentLearningJournalRepository.retractJournalEntry)
      .not.toHaveBeenCalled();
    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
  });

  test('failed soft delete does not emit realtime', async () => {
    const databaseError = new Error('journal delete failed');
    studentLearningJournalRepository.retractJournalEntry.mockRejectedValue(
      databaseError
    );

    await expect(retractJournalEntry({
      studentId: '7',
      entryId: '41',
      requester: teacherRequester,
    })).rejects.toBe(databaseError);

    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
  });

  test('a retracted entry no longer appears in Parent list', async () => {
    studentLearningJournalRepository.findJournalEntries.mockResolvedValue([]);

    await retractJournalEntry({
      studentId: '7',
      entryId: '41',
      requester: teacherRequester,
    });
    const parentList = await listJournalEntries({
      studentId: '7',
      requester: parentRequester,
    });

    expect(parentList).toEqual([]);
  });
});
