const multer = require('multer');
const {
  maximumEvidenceFileSize,
  supportedMimeTypes,
} = require('./student-evidence.validator');

const studentEvidenceUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maximumEvidenceFileSize,
    files: 1,
  },
  fileFilter(req, file, callback) {
    if (!supportedMimeTypes.has(file.mimetype)) {
      callback({ name: 'invalidEvidenceFileType' });
      return;
    }
    callback(null, true);
  },
});

module.exports = studentEvidenceUpload;
