const express = require('express');
const request = require('supertest');
const {
  createAiLearningNarrativeService,
} = require('../modules/ai-learning-narrative/ai-learning-narrative.service');
const {
  createAiLearningNarrativeRouter,
} = require('../modules/ai-learning-narrative/ai-learning-narrative.route');
const {
  createNarrativeProvider,
} = require('../modules/ai-learning-narrative/narrative-provider');
const {
  validateGroundedNarrative,
} = require('../modules/ai-learning-narrative/narrative-output-validator');
const {
  errorHandler,
} = require('../middlewares/errorHandler');

const validRequestBody = {
  dateFrom: '2026-06-27',
  dateTo: '2026-07-27',
  sourceTypes: ['evidence'],
  length: 'short',
};

test('authorized Teacher builds a source packet without retracted Evidence or asset fields', async () => {
  const provider = {
    assertAvailable: jest.fn(),
    generateLearningNarrative: jest.fn(async ({ sourcePacket }) => ({
      narrative: {
        title: 'Ringkasan perkembangan Ari',
        sections: [{
          sectionType: 'summary',
          text: 'Evidence latihan pecahan tercatat sebagai karya siswa.',
          sourceRefs: [sourcePacket.sources[0].sourceRef],
          directQuote: null,
        }],
        missingContext: [],
      },
      providerMetadata: { model: 'mock-model', latencyMs: 1 },
    })),
  };
  const repository = {
    findStudentById: jest.fn(async () => ({
      id: 1,
      name: 'Ari Wibowo',
      ClassId: 7,
      feedback: null,
      updatedAt: new Date('2026-07-20T00:00:00.000Z'),
    })),
    findEvidenceSources: jest.fn(async () => [
      {
        id: 4,
        title: 'Latihan pecahan',
        category: 'work',
        description: 'Diagram pecahan.',
        observedAt: new Date('2026-07-22T00:00:00.000Z'),
        fileUrl: 'https://res.cloudinary.com/private/evidence.png',
        cloudinaryPublicId: 'private-id',
      },
      {
        id: 5,
        title: 'Sudah dicabut',
        category: 'work',
        description: 'Tidak boleh masuk packet.',
        observedAt: new Date('2026-07-21T00:00:00.000Z'),
        retractedAt: new Date('2026-07-23T00:00:00.000Z'),
        deletedAt: new Date('2026-07-23T00:00:00.000Z'),
        fileUrl: 'https://res.cloudinary.com/private/retracted.png',
      },
    ]),
  };
  const service = createAiLearningNarrativeService({
    repository,
    provider,
    clock: () => new Date('2026-07-27T10:00:00.000Z'),
  });
  const app = express();
  app.use(express.json());
  app.use('/students', createAiLearningNarrativeRouter({
    service,
    authenticateTeacher(req, res, next) {
      req.user = { teacherId: 11, classId: 7, role: 'teacher' };
      next();
    },
  }));
  app.use(errorHandler);

  const endpointResponse = await request(app)
    .post('/students/1/ai/narrative-draft')
    .send(validRequestBody);
  expect(endpointResponse.status).toBe(200);
  const response = endpointResponse.body.data;
  const sourcePacket = provider.generateLearningNarrative.mock.calls[0][0]
    .sourcePacket;

  expect(sourcePacket.sources).toHaveLength(1);
  expect(sourcePacket.sources[0]).toEqual(expect.objectContaining({
    sourceRef: 'EVD-4',
    sourceType: 'evidence',
  }));
  expect(JSON.stringify(sourcePacket)).not.toMatch(
    /cloudinary|fileUrl|private-id|retracted/i
  );
  expect(response.sourceSummary).toEqual(expect.objectContaining({
    total: 1,
    evidence: 1,
  }));
  expect(response.student).toEqual({
    id: 1,
    name: 'Ari Wibowo',
  });
});

test('Teacher outside the student class is rejected before source queries', async () => {
  const repository = {
    findStudentById: jest.fn(async () => ({
      id: 1,
      name: 'Ari Wibowo',
      ClassId: 8,
    })),
    findEvidenceSources: jest.fn(),
  };
  const provider = {
    assertAvailable: jest.fn(),
    generateLearningNarrative: jest.fn(),
  };
  const service = createAiLearningNarrativeService({ repository, provider });

  await expect(service.generateNarrativeDraft({
    studentId: '1',
    classId: 7,
    requestBody: validRequestBody,
  })).rejects.toMatchObject({ name: 'student_access_denied' });
  expect(repository.findEvidenceSources).not.toHaveBeenCalled();
  expect(provider.assertAvailable).not.toHaveBeenCalled();
});

test('grounding validator rejects fake source references and quote mismatch', () => {
  const sourcePacket = {
    sourceTypes: ['journal'],
    sources: [{
      sourceRef: 'JRN-18',
      sourceType: 'journal',
      captureType: 'direct_quote',
      content: 'Aku lebih mudah memahami pecahan ketika digambar.',
    }],
  };
  const narrative = {
    title: 'Ringkasan perkembangan Ari',
    sections: [{
      sectionType: 'student_reflection',
      text: 'Ari menyampaikan bahwa gambar membantu memahami pecahan.',
      sourceRefs: ['JRN-18'],
      directQuote: {
        sourceRef: 'JRN-18',
        text: 'Kutipan yang sudah diubah.',
      },
    }],
    missingContext: [],
  };

  expect(() => validateGroundedNarrative({
    ...narrative,
    sections: [{
      ...narrative.sections[0],
      sourceRefs: ['JRN-999'],
      directQuote: null,
    }],
  }, sourcePacket)).toThrow(expect.objectContaining({
    name: 'ai_generation_invalid_output',
  }));
  expect(() => validateGroundedNarrative(
    narrative,
    sourcePacket
  )).toThrow(expect.objectContaining({
    name: 'ai_generation_invalid_output',
  }));
  expect(() => validateGroundedNarrative({
    ...narrative,
    sections: [{
      ...narrative.sections[0],
      text: 'Ari memperoleh nilai 99 pada catatan refleksi ini.',
      directQuote: null,
    }],
  }, sourcePacket)).toThrow(expect.objectContaining({
    name: 'ai_generation_invalid_output',
  }));
});

test('provider failure returns a safe error while an unrelated endpoint stays available', async () => {
  const provider = createNarrativeProvider({
    environment: {
      NODE_ENV: 'test',
      AI_NARRATIVE_ENABLED: 'true',
      AI_NARRATIVE_PROVIDER: 'openai',
      AI_NARRATIVE_API_KEY: 'test-key',
      AI_NARRATIVE_BASE_URL: 'https://api.openai.com/v1',
      AI_NARRATIVE_MODEL: 'test-model',
      AI_NARRATIVE_TIMEOUT_MS: '1000',
    },
    clientFactory: () => ({
      responses: {
        create: jest.fn(async () => {
          throw new Error('provider detail that must stay private');
        }),
      },
    }),
  });
  const app = express();
  app.use(express.json());
  app.post('/ai', async (req, res, next) => {
    try {
      await provider.generateLearningNarrative({
        sourcePacket: { sources: [] },
        length: 'short',
      });
      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  });
  app.get('/unrelated', (req, res) => res.status(200).json({ ok: true }));
  app.use(errorHandler);

  const failedResponse = await request(app).post('/ai').send({});
  expect(failedResponse.status).toBe(503);
  expect(failedResponse.body).toEqual({
    error: {
      code: 'ai_provider_unavailable',
      message: 'Draf belum dapat disusun. Coba kembali beberapa saat lagi.',
    },
  });
  expect(JSON.stringify(failedResponse.body)).not.toContain(
    'provider detail that must stay private'
  );
  await request(app).get('/unrelated').expect(200, { ok: true });
});

test('Groq uses the OpenAI SDK boundary without unsupported store field', async () => {
  const clientConfiguration = jest.fn();
  const createResponse = jest.fn(async () => ({
    output_text: JSON.stringify({
      title: 'Ringkasan perkembangan Ari',
      sections: [{
        sectionType: 'summary',
        text: 'Evidence latihan pecahan tercatat sebagai karya siswa.',
        sourceRefs: ['EVD-4'],
        directQuote: null,
      }],
      missingContext: [],
    }),
  }));
  const provider = createNarrativeProvider({
    environment: {
      AI_NARRATIVE_ENABLED: 'true',
      AI_NARRATIVE_PROVIDER: 'groq',
      AI_NARRATIVE_API_KEY: 'test-groq-key',
      AI_NARRATIVE_BASE_URL: 'https://api.groq.com/openai/v1',
      AI_NARRATIVE_MODEL: 'openai/gpt-oss-120b',
      AI_NARRATIVE_TIMEOUT_MS: '20000',
    },
    clientFactory: (configuration) => {
      clientConfiguration(configuration);
      return { responses: { create: createResponse } };
    },
    clock: () => 100,
  });

  const result = await provider.generateLearningNarrative({
    sourcePacket: {
      sources: [{
        sourceRef: 'EVD-4',
        sourceType: 'evidence',
        captureType: 'observation',
        content: 'Evidence latihan pecahan tercatat sebagai karya siswa.',
      }],
    },
    length: 'short',
  });

  expect(clientConfiguration).toHaveBeenCalledWith({
    apiKey: 'test-groq-key',
    baseURL: 'https://api.groq.com/openai/v1',
    timeout: 20000,
    maxRetries: 0,
  });
  expect(createResponse).toHaveBeenCalledTimes(1);
  const request = createResponse.mock.calls[0][0];
  expect(request).toEqual(expect.objectContaining({
    model: 'openai/gpt-oss-120b',
    instructions: expect.stringContaining('Source packet'),
    text: {
      format: expect.objectContaining({
        type: 'json_schema',
        name: 'issa_learning_narrative',
        strict: true,
      }),
    },
  }));
  expect(request).not.toHaveProperty('store');
  expect(JSON.stringify(request.text.format.schema)).not.toContain(
    'uniqueItems'
  );
  expect(request.input).toContain('<issa_source_packet>');
  expect(request.input).toContain('set directQuote ke null');
  expect(result.providerMetadata).toEqual({
    model: 'openai/gpt-oss-120b',
    latencyMs: 0,
  });
});

test('OpenAI keeps store disabled through the same provider boundary', async () => {
  const createResponse = jest.fn(async () => ({
    output_text: JSON.stringify({
      title: 'Ringkasan perkembangan Ari',
      sections: [{
        sectionType: 'summary',
        text: 'Evidence latihan pecahan tercatat sebagai karya siswa.',
        sourceRefs: ['EVD-4'],
        directQuote: null,
      }],
      missingContext: [],
    }),
  }));
  const provider = createNarrativeProvider({
    environment: {
      AI_NARRATIVE_ENABLED: 'true',
      AI_NARRATIVE_PROVIDER: 'openai',
      AI_NARRATIVE_API_KEY: 'test-openai-key',
      AI_NARRATIVE_MODEL: 'gpt-5-mini',
    },
    clientFactory: () => ({ responses: { create: createResponse } }),
  });

  await provider.generateLearningNarrative({
    sourcePacket: {
      sources: [{
        sourceRef: 'EVD-4',
        sourceType: 'evidence',
        captureType: 'observation',
        content: 'Evidence latihan pecahan tercatat sebagai karya siswa.',
      }],
    },
    length: 'short',
  });

  expect(createResponse.mock.calls[0][0]).toEqual(expect.objectContaining({
    model: 'gpt-5-mini',
    store: false,
  }));
  expect(JSON.stringify(
    createResponse.mock.calls[0][0].text.format.schema
  )).toContain('uniqueItems');
});
