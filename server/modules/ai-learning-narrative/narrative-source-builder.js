const maximumSourcesPerType = 8;
const maximumSourcesTotal = 30;

function plain(record) {
  if (record && typeof record.get === 'function') {
    return record.get({ plain: true });
  }
  return record;
}

function isoDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return new Date(value).toISOString().slice(0, 10);
}

function mapAttendance(record) {
  const attendance = plain(record);
  return {
    sourceRef: `ATT-${attendance.id}`,
    sourceType: 'attendance',
    observedAt: isoDate(attendance.attendanceDate),
    facts: { status: attendance.status },
  };
}

function mapScores(records) {
  const scores = records.map(plain);
  return scores.map((score, index) => {
    const previousScore = scores
      .slice(index + 1)
      .find((candidate) => Number(candidate.LessonId) === Number(score.LessonId));

    return {
      sourceRef: `SCR-${score.id}`,
      sourceType: 'score',
      observedAt: isoDate(score.recordedAt),
      facts: {
        subject: score.Lesson.name,
        value: score.value,
        previousValue: previousScore ? previousScore.value : null,
        minimumPassingScore: score.Lesson.KKM,
        assignment: score.Assignment.name,
      },
    };
  });
}

function mapJournal(record) {
  const journal = plain(record);
  return {
    sourceRef: `JRN-${journal.id}`,
    sourceType: 'journal',
    journalType: journal.type,
    captureType: journal.voiceCaptureType,
    observedAt: isoDate(journal.observedAt),
    content: journal.content,
    edited: new Date(journal.updatedAt).getTime() >
      new Date(journal.createdAt).getTime(),
  };
}

function mapEvidence(record) {
  const evidence = plain(record);
  if (evidence.deletedAt || evidence.retractedAt) return null;
  return {
    sourceRef: `EVD-${evidence.id}`,
    sourceType: 'evidence',
    observedAt: isoDate(evidence.observedAt),
    facts: {
      title: evidence.title,
      category: evidence.category,
      description: evidence.description || null,
    },
  };
}

function mapFeedback(record) {
  const feedback = plain(record);
  return {
    sourceRef: `FDB-${feedback.id}`,
    sourceType: 'feedback',
    observedAt: isoDate(feedback.observedAt),
    content: feedback.content,
  };
}

function mapCurrentFeedback(student) {
  const currentStudent = plain(student);
  if (!String(currentStudent.feedback || '').trim() || !currentStudent.updatedAt) {
    return null;
  }
  return {
    sourceRef: `FDB-${currentStudent.id}`,
    sourceType: 'feedback',
    observedAt: isoDate(currentStudent.updatedAt),
    content: currentStudent.feedback.trim(),
  };
}

function sourceSort(left, right) {
  if (left.observedAt !== right.observedAt) {
    return right.observedAt.localeCompare(left.observedAt);
  }
  if (left.sourceType !== right.sourceType) {
    return left.sourceType.localeCompare(right.sourceType);
  }
  return right.sourceRef.localeCompare(left.sourceRef, undefined, {
    numeric: true,
  });
}

function mapSourceRecords({
  student,
  recordsByType,
  sourceTypes,
  dateFrom,
  dateTo,
}) {
  const mappedSources = [];

  for (const sourceType of sourceTypes) {
    const records = (recordsByType[sourceType] || []).slice(
      0,
      maximumSourcesPerType
    );

    if (sourceType === 'attendance') {
      mappedSources.push(...records.map(mapAttendance));
    } else if (sourceType === 'score') {
      mappedSources.push(...mapScores(records));
    } else if (sourceType === 'journal') {
      mappedSources.push(...records.map(mapJournal));
    } else if (sourceType === 'evidence') {
      mappedSources.push(...records.map(mapEvidence).filter(Boolean));
    } else if (sourceType === 'feedback') {
      const feedbackSources = records.map(mapFeedback);
      if (feedbackSources.length === 0) {
        const currentFeedback = mapCurrentFeedback(student);
        if (
          currentFeedback &&
          currentFeedback.observedAt >= dateFrom &&
          currentFeedback.observedAt <= dateTo
        ) {
          feedbackSources.push(currentFeedback);
        }
      }
      mappedSources.push(...feedbackSources);
    }
  }

  return mappedSources.sort(sourceSort).slice(0, maximumSourcesTotal);
}

function buildSourcePacket({
  student,
  dateFrom,
  dateTo,
  purpose,
  sourceTypes,
  recordsByType,
}) {
  void 'ISSA:SERVER.AI_NARRATIVE.AUTHORIZED_SOURCE_PACKET';
  const currentStudent = plain(student);
  return {
    purpose,
    student: {
      id: currentStudent.id,
      displayName: currentStudent.name,
    },
    period: { dateFrom, dateTo },
    sourceTypes: [...sourceTypes],
    sources: mapSourceRecords({
      student: currentStudent,
      recordsByType,
      sourceTypes,
      dateFrom,
      dateTo,
    }),
  };
}

function truncate(value, maximumLength = 180) {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= maximumLength) return normalized;
  return `${normalized.slice(0, maximumLength - 1).trimEnd()}…`;
}

function safeSourceReference(source) {
  if (source.sourceType === 'attendance') {
    return {
      sourceRef: source.sourceRef,
      sourceType: source.sourceType,
      observedAt: source.observedAt,
      label: `Kehadiran ${source.observedAt}`,
      preview: `Status ${source.facts.status}`,
    };
  }
  if (source.sourceType === 'score') {
    const previous = source.facts.previousValue === null
      ? ''
      : `, sebelumnya ${source.facts.previousValue}`;
    return {
      sourceRef: source.sourceRef,
      sourceType: source.sourceType,
      observedAt: source.observedAt,
      label: `Nilai ${source.facts.subject}`,
      preview: truncate(
        `Nilai ${source.facts.value}${previous}, KKM ${source.facts.minimumPassingScore}`
      ),
    };
  }
  if (source.sourceType === 'journal') {
    return {
      sourceRef: source.sourceRef,
      sourceType: source.sourceType,
      observedAt: source.observedAt,
      label: 'Catatan perjalanan belajar',
      preview: truncate(source.content),
    };
  }
  if (source.sourceType === 'evidence') {
    return {
      sourceRef: source.sourceRef,
      sourceType: source.sourceType,
      observedAt: source.observedAt,
      label: `Evidence: ${source.facts.title}`,
      preview: truncate(
        source.facts.description || `Kategori ${source.facts.category}`
      ),
    };
  }
  return {
    sourceRef: source.sourceRef,
    sourceType: source.sourceType,
    observedAt: source.observedAt,
    label: 'Feedback guru',
    preview: truncate(source.content),
  };
}

function sourceSummary(sources) {
  const summary = {
    total: sources.length,
    attendance: 0,
    score: 0,
    journal: 0,
    evidence: 0,
    feedback: 0,
  };
  sources.forEach((source) => {
    summary[source.sourceType] += 1;
  });
  return summary;
}

module.exports = {
  buildSourcePacket,
  safeSourceReference,
  sourceSummary,
};
