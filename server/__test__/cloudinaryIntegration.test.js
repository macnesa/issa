jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      destroy: jest.fn(),
      upload_stream: jest.fn(() => ({
        end: jest.fn(),
        on: jest.fn(),
      })),
    },
  },
}));

const { v2: cloudinary } = require('cloudinary');
const {
  deleteStudentEvidenceImage,
  destroyStudentEvidenceAsset,
  uploadStudentEvidenceImage,
} = require('../integrations/cloudinary');

const cloudinaryEnvironment = {
  CLOUDINARY_CLOUD_NAME: 'demo-cloud',
  CLOUDINARY_API_KEY: 'demo-key',
  CLOUDINARY_API_SECRET: 'demo-secret',
};

describe('Cloudinary Student Evidence integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(process.env, cloudinaryEnvironment);
  });

  afterAll(() => {
    Object.keys(cloudinaryEnvironment).forEach((environmentKey) => {
      delete process.env[environmentKey];
    });
  });

  test('fails only when upload is used with incomplete configuration', () => {
    expect.assertions(2);
    delete process.env.CLOUDINARY_API_SECRET;

    try {
      uploadStudentEvidenceImage({
        studentId: 7,
        fileBuffer: Buffer.from('image'),
      });
    } catch (error) {
      expect(error).toEqual({ name: 'cloudinaryConfigurationError' });
    }

    expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
  });

  test('uploads an image buffer to the server-derived student folder', async () => {
    const uploadResult = {
      secure_url: 'https://res.cloudinary.com/demo/image/upload/evidence.webp',
      public_id: 'issa/student-evidence/7/evidence-1',
      format: 'webp',
      bytes: 2048,
      resource_type: 'image',
    };
    const fileBuffer = Buffer.from('image');
    const uploadPromise = uploadStudentEvidenceImage({
      studentId: 7,
      fileBuffer,
    });
    const [uploadOptions, uploadCallback] =
      cloudinary.uploader.upload_stream.mock.calls[0];
    const uploadStream =
      cloudinary.uploader.upload_stream.mock.results[0].value;

    uploadCallback(null, uploadResult);

    await expect(uploadPromise).resolves.toBe(uploadResult);
    expect(uploadOptions).toEqual({
      folder: 'issa/student-evidence/7',
      resource_type: 'image',
      unique_filename: true,
      use_filename: false,
      overwrite: false,
    });
    expect(uploadStream.end).toHaveBeenCalledWith(fileBuffer);
  });

  test('normalizes provider upload failure', async () => {
    const uploadPromise = uploadStudentEvidenceImage({
      studentId: 7,
      fileBuffer: Buffer.from('image'),
    });
    const uploadCallback =
      cloudinary.uploader.upload_stream.mock.calls[0][1];

    uploadCallback(new Error('provider failure'));

    await expect(uploadPromise).rejects.toEqual({
      name: 'evidenceUploadFailed',
    });
  });

  test('cleanup destroys the image by server-stored public ID', async () => {
    cloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });

    await expect(deleteStudentEvidenceImage(
      'issa/student-evidence/7/evidence-1'
    )).resolves.toBe(true);

    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
      'issa/student-evidence/7/evidence-1',
      {
        resource_type: 'image',
        invalidate: true,
      }
    );
  });

  test.each(['ok', 'deleted', 'not found', 'not_found'])(
    'strict destroy accepts provider result %s',
    async (result) => {
      cloudinary.uploader.destroy.mockResolvedValue({ result });

      await expect(destroyStudentEvidenceAsset(
        'issa/student-evidence/7/evidence-1'
      )).resolves.toBe(true);

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        'issa/student-evidence/7/evidence-1',
        {
          resource_type: 'image',
          invalidate: true,
        }
      );
    }
  );

  test('strict destroy normalizes provider failure', async () => {
    cloudinary.uploader.destroy.mockRejectedValue(new Error('provider failure'));

    await expect(destroyStudentEvidenceAsset(
      'issa/student-evidence/7/evidence-1'
    )).rejects.toEqual({ name: 'evidenceAssetDeleteFailed' });
  });

  test('strict destroy rejects an unexpected provider result', async () => {
    cloudinary.uploader.destroy.mockResolvedValue({ result: 'pending' });

    await expect(destroyStudentEvidenceAsset(
      'issa/student-evidence/7/evidence-1'
    )).rejects.toEqual({ name: 'evidenceAssetDeleteFailed' });
  });
});
