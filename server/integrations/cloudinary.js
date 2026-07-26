const { v2: cloudinary } = require('cloudinary');

function getCloudinaryConfiguration() {
  const configuration = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  };

  if (Object.values(configuration).some((value) => !String(value || '').trim())) {
    throw { name: 'cloudinaryConfigurationError' };
  }

  return configuration;
}

function uploadStudentEvidenceImage({ studentId, fileBuffer }) {
  void 'ISSA:SERVER.STUDENT_EVIDENCE.UPLOAD_IMAGE';
  const configuration = getCloudinaryConfiguration();
  cloudinary.config(configuration);

  return new Promise((resolve, reject) => {
    try {
      const uploadStream = cloudinary.uploader.upload_stream({
        folder: `issa/student-evidence/${studentId}`,
        resource_type: 'image',
        unique_filename: true,
        use_filename: false,
        overwrite: false,
      }, (error, uploadResult) => {
        if (error) {
          reject({ name: 'evidenceUploadFailed' });
          return;
        }

        resolve(uploadResult);
      });

      uploadStream.on('error', () => {
        reject({ name: 'evidenceUploadFailed' });
      });
      uploadStream.end(fileBuffer);
    } catch (error) {
      reject({ name: 'evidenceUploadFailed' });
    }
  });
}

async function deleteStudentEvidenceImage(cloudinaryPublicId) {
  const configuration = getCloudinaryConfiguration();
  cloudinary.config(configuration);

  try {
    await cloudinary.uploader.destroy(cloudinaryPublicId, {
      resource_type: 'image',
      invalidate: true,
    });
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  deleteStudentEvidenceImage,
  uploadStudentEvidenceImage,
};
