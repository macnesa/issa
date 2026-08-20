'use strict';

const classroomDebriefRepository = require('./classroom-debrief.repository');
const narrativeProvider = require(
  '../ai-learning-narrative/narrative-provider'
);
const {
  CLASSROOM_DEBRIEF_JSON_SCHEMA,
  classroomDebriefError,
  parseDebriefOutput,
} = require('./classroom-debrief.contract');
const {
  CLASSROOM_DEBRIEF_INSTRUCTION,
} = require('./classroom-debrief.prompt');
const { resolveDrafts } = require('./classroom-debrief.resolver');
const {
  MAXIMUM_ROSTER_SIZE,
} = require('./classroom-debrief.repository');
const {
  validateClassroomDebriefRequest,
} = require('./classroom-debrief.validator');

function toPlainRecord(record) {
  if (record && typeof record.get === 'function') {
    return record.get({ plain: true });
  }
  if (record && typeof record.toJSON === 'function') return record.toJSON();
  return record;
}

function compactText(value, maximumLength) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length <= maximumLength ? text : text.slice(0, maximumLength);
}

function buildInferenceContext({ request, teacherClass, roster, lesson, assignments }) {
  return {
    actor: { role: 'teacher' },
    debriefText: request.text,
    class: { name: compactText(teacherClass.name, 120) },
    roster: roster.map((student) => ({
      name: compactText(toPlainRecord(student).name, 120),
    })),
    selectedLesson: lesson
      ? { name: compactText(toPlainRecord(lesson).name, 120) }
      : null,
    candidateAssignments: assignments.map((assignment) => {
      const plainAssignment = toPlainRecord(assignment);
      return {
        name: compactText(plainAssignment.name, 120),
        type: compactText(plainAssignment.type, 80) || null,
        description: compactText(plainAssignment.desc, 240) || null,
      };
    }),
  };
}

function safeContext({ teacherClass, lesson }) {
  const plainClass = toPlainRecord(teacherClass);
  const plainLesson = lesson ? toPlainRecord(lesson) : null;
  return {
    class: { id: plainClass.id, name: plainClass.name },
    lesson: plainLesson
      ? { id: plainLesson.id, name: plainLesson.name }
      : null,
  };
}

function createClassroomDebriefService({
  repository = classroomDebriefRepository,
  provider = narrativeProvider,
  clock = () => new Date(),
} = {}) {
  async function createDrafts({ requester, requestBody }) {
    void 'ISSA:SERVER.CLASSROOM_DEBRIEF.CREATE_DRAFTS';
    const request = validateClassroomDebriefRequest({ requester, requestBody });
    const teacherClass = await repository.findTeacherClass({
      teacherId: requester.teacherId,
      classId: requester.classId,
    });
    if (!teacherClass) {
      throw classroomDebriefError('classroom_debrief_access_denied');
    }

    const roster = await repository.findClassRoster(requester.classId);
    if (roster.length > MAXIMUM_ROSTER_SIZE) {
      throw classroomDebriefError('classroom_debrief_context_too_large');
    }

    let lesson = null;
    if (request.lessonId) {
      lesson = await repository.findLessonForClass({
        lessonId: request.lessonId,
        classId: requester.classId,
      });
      if (!lesson) {
        throw classroomDebriefError('classroom_debrief_context_not_found');
      }
    }

    const assignments = await repository.findAssignmentCandidates({
      classId: requester.classId,
      lessonId: lesson?.id,
    });
    const inferenceContext = buildInferenceContext({
      request,
      teacherClass: toPlainRecord(teacherClass),
      roster,
      lesson,
      assignments,
    });

    const generationResult = await provider.generateClassroomDebrief({
      context: inferenceContext,
      instructions: CLASSROOM_DEBRIEF_INSTRUCTION,
      outputSchema: CLASSROOM_DEBRIEF_JSON_SCHEMA,
    });
    const extraction = parseDebriefOutput(
      generationResult.outputText,
      request.text
    );
    if (extraction.items.length === 0) {
      throw classroomDebriefError('classroom_debrief_no_usable_drafts');
    }

    const resolutionContext = safeContext({ teacherClass, lesson });
    const drafts = resolveDrafts({
      items: extraction.items,
      roster,
      assignments,
      context: resolutionContext,
    });

    return {
      generatedAt: clock().toISOString(),
      text: request.text,
      context: resolutionContext,
      drafts,
      provider: generationResult.providerMetadata,
    };
  }

  return { createDrafts };
}

module.exports = createClassroomDebriefService();
module.exports.buildInferenceContext = buildInferenceContext;
module.exports.createClassroomDebriefService = createClassroomDebriefService;
