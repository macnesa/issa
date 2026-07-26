import {
  isEvidenceRecordEventForActiveStudent,
  isStudentRecordEventForActiveStudent,
} from './parentSocket';

describe('Parent evidence realtime event routing', () => {
  it('mengabaikan event milik siswa lain', () => {
    const event = { studentId: 2, recordType: 'evidence' };

    expect(isStudentRecordEventForActiveStudent(event, 1)).toBe(false);
    expect(isEvidenceRecordEventForActiveStudent(event, 1)).toBe(false);
  });

  it('tidak menginvalidasi evidence untuk record type lain', () => {
    const event = { studentId: 1, recordType: 'score' };

    expect(isStudentRecordEventForActiveStudent(event, 1)).toBe(true);
    expect(isEvidenceRecordEventForActiveStudent(event, 1)).toBe(false);
    expect(isEvidenceRecordEventForActiveStudent(
      { studentId: 1, recordType: 'evidence' },
      1
    )).toBe(true);
  });
});
