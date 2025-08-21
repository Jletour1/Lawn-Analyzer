import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET!;
const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL;

export interface UploadResult {
  url: string;
  filename: string;
  key: string;
}

export const uploadToS3 = async (
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<UploadResult> => {
  try {
    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const filename = `${uuidv4()}.${fileExtension}`;
    const key = `${folder}/${filename}`;

    // Optimize image using Sharp
    let processedBuffer = file.buffer;
    
    if (file.mimetype.startsWith('image/')) {
      processedBuffer = await sharp(file.buffer)
        .resize(1200, 1200, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ 
          quality: 85,
          progressive: true 
        })
        .toBuffer();
    }

    // Upload to S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: processedBuffer,
      ContentType: file.mimetype,
      CacheControl: 'max-age=31536000', // 1 year cache
      Metadata: {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString()
      }
    };

    const result = await s3.upload(uploadParams).promise();

    // Return CloudFront URL if available, otherwise S3 URL
    const url = CLOUDFRONT_URL 
      ? `${CLOUDFRONT_URL}/${key}`
      : result.Location;

    return {
      url,
      filename,
      key
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload file to S3');
  }
};

export const deleteFromS3 = async (key: string): Promise<void> => {
  try {
    await s3.deleteObject({
      Bucket: BUCKET_NAME,
      Key: key
    }).promise();
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('Failed to delete file from S3');
  }
};

export const getSignedUrl = (key: string, expiresIn: number = 3600): string => {
  return s3.getSignedUrl('getObject', {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: expiresIn
  });
};