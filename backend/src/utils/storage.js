const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const useS3 = !!(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);

let s3Client = null;
if (useS3) {
  const { S3Client } = require('@aws-sdk/client-s3');
  s3Client = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT || undefined, // ex.: URL do Supabase Storage (S3-compatible)
    forcePathStyle: !!process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    }
  });
}

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Salva um arquivo (buffer em memória) e devolve a URL pública.
// Usa S3/Supabase Storage se as variáveis S3_* estiverem configuradas;
// caso contrário, cai no disco local (bom para desenvolvimento).
async function saveFile(buffer, originalName, mimetype, publicBaseUrl) {
  const ext = path.extname(originalName) || '.jpg';
  const key = `${crypto.randomUUID()}${ext}`;

  if (useS3) {
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      ACL: process.env.S3_ENDPOINT ? undefined : 'public-read' // Supabase Storage gerencia isso pelo bucket
    }));
    const publicUrl = process.env.S3_PUBLIC_URL_BASE
      ? `${process.env.S3_PUBLIC_URL_BASE.replace(/\/$/, '')}/${key}`
      : `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`;
    return publicUrl;
  }

  fs.writeFileSync(path.join(uploadsDir, key), buffer);
  return `${publicBaseUrl}/uploads/${key}`;
}

module.exports = { saveFile, usingS3: useS3 };
