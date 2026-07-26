const evidenceCategories = new Set([
  'work',
  'assignment',
  'assessment',
  'activity',
  'documentation',
]);
const supportedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const supportedCloudinaryFormats = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
]);
const formatsByMimeType = {
  'image/jpeg': new Set(['jpg', 'jpeg']),
  'image/png': new Set(['png']),
  'image/webp': new Set(['webp']),
};
const maximumEvidenceFileSize = 5 * 1024 * 1024;

function validateStudentId(studentId) {
  if (typeof studentId !== 'string' || !/^[1-9]\d*$/.test(studentId)) {
    throw { name: 'notFound' };
  }

  const parsedStudentId = Number(studentId);
  if (!Number.isSafeInteger(parsedStudentId)) throw { name: 'notFound' };
  return parsedStudentId;
}

function validateObservedAt(observedAt) {
  if (typeof observedAt !== 'string' || !observedAt.trim()) {
    throw { name: 'invalidEvidenceObservedAt' };
  }

  const observedAtInput = observedAt.trim();
  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  const isoDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
  if (!isoDate.test(observedAtInput) && !isoDateTime.test(observedAtInput)) {
    throw { name: 'invalidEvidenceObservedAt' };
  }

  const parsedObservedAt = new Date(observedAtInput);
  if (Number.isNaN(parsedObservedAt.getTime())) {
    throw { name: 'invalidEvidenceObservedAt' };
  }

  if (isoDate.test(observedAtInput)) {
    const [year, month, day] = observedAtInput.split('-').map(Number);
    if (
      parsedObservedAt.getUTCFullYear() !== year ||
      parsedObservedAt.getUTCMonth() + 1 !== month ||
      parsedObservedAt.getUTCDate() !== day
    ) {
      throw { name: 'invalidEvidenceObservedAt' };
    }
  }

  return parsedObservedAt;
}

function validateEvidenceMetadata(metadata) {
  const title = typeof metadata.title === 'string' ? metadata.title.trim() : '';
  if (!title || title.length > 120) throw { name: 'invalidEvidenceTitle' };

  if (!evidenceCategories.has(metadata.category)) {
    throw { name: 'invalidEvidenceCategory' };
  }

  let description = null;
  if (typeof metadata.description !== 'undefined' && metadata.description !== null) {
    if (typeof metadata.description !== 'string') {
      throw { name: 'invalidEvidenceDescription' };
    }
    description = metadata.description.trim() || null;
    if (description && description.length > 500) {
      throw { name: 'invalidEvidenceDescription' };
    }
  }

  return {
    title,
    category: metadata.category,
    description,
    observedAt: validateObservedAt(metadata.observedAt),
  };
}

function validateEvidenceFile(file) {
  if (!file || !Buffer.isBuffer(file.buffer)) {
    throw { name: 'evidenceFileRequired' };
  }
  if (!supportedMimeTypes.has(file.mimetype)) {
    throw { name: 'invalidEvidenceFileType' };
  }
  if (
    !Number.isInteger(file.size) ||
    file.size < 1 ||
    file.size > maximumEvidenceFileSize
  ) {
    throw { name: 'invalidEvidenceFileSize' };
  }

  return file;
}

function validateCloudinaryImage(uploadResult, expectedMimeType) {
  const secureUrl = typeof uploadResult?.secure_url === 'string'
    ? uploadResult.secure_url.trim()
    : '';
  const cloudinaryPublicId = typeof uploadResult?.public_id === 'string'
    ? uploadResult.public_id.trim()
    : '';
  const format = typeof uploadResult?.format === 'string'
    ? uploadResult.format.toLowerCase()
    : '';
  const fileSize = Number(uploadResult?.bytes);

  if (
    uploadResult?.resource_type !== 'image' ||
    !secureUrl.startsWith('https://') ||
    !cloudinaryPublicId ||
    !supportedCloudinaryFormats.has(format) ||
    !formatsByMimeType[expectedMimeType]?.has(format) ||
    !Number.isInteger(fileSize) ||
    fileSize < 1 ||
    fileSize > maximumEvidenceFileSize
  ) {
    throw { name: 'invalidEvidenceUploadResult' };
  }

  return {
    fileUrl: secureUrl,
    cloudinaryPublicId,
    format,
    fileSize,
  };
}

module.exports = {
  evidenceCategories,
  maximumEvidenceFileSize,
  supportedMimeTypes,
  validateCloudinaryImage,
  validateEvidenceFile,
  validateEvidenceMetadata,
  validateObservedAt,
  validateStudentId,
};
