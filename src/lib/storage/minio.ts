'server-only';

import { Client } from 'minio';

/**
 * Capa de almacenamiento de objetos usando MinIO (compatible con S3).
 * Se usa para guardar los archivos adjuntos de las solicitudes de crédito.
 */

let client: Client | null = null;
let bucketReady = false;

function getClient(): Client {
  if (!client) {
    client = new Client({
      endPoint: process.env.MINIO_ENDPOINT || 'minio',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || '',
      secretKey: process.env.MINIO_SECRET_KEY || '',
    });
  }
  return client;
}

export function getBucketName(): string {
  return process.env.MINIO_BUCKET || 'crediat';
}

/** Sanea un nombre de archivo para usarlo como clave segura en el bucket. */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/** Verifica que MinIO esté configurado. */
export function isStorageConfigured(): boolean {
  return Boolean(process.env.MINIO_ACCESS_KEY && process.env.MINIO_SECRET_KEY);
}

/** Asegura que el bucket exista, creándolo si es necesario. */
export async function ensureBucket(): Promise<void> {
  if (bucketReady) return;
  if (!isStorageConfigured()) return;

  const c = getClient();
  const bucket = getBucketName();
  const exists = await c.bucketExists(bucket);
  if (!exists) {
    await c.makeBucket(bucket);
  }
  bucketReady = true;
}

/**
 * Sube un archivo al bucket de la app.
 * @returns la clave (ruta) del objeto almacenado.
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  contentType: string,
  folder: string
): Promise<string> {
  await ensureBucket();
  const c = getClient();
  const bucket = getBucketName();

  // Nombre seguro y único: prefijo + timestamp + nombre saneado
  const safeName = sanitizeFilename(filename);
  const key = `${folder}/${Date.now()}-${safeName}`;

  await c.putObject(bucket, key, buffer, buffer.length, { 'Content-Type': contentType });
  return key;
}

/** Obtiene la URL pública temporal (presigned GET) de un objeto. */
export async function getFileUrl(key: string, expirySeconds = 3600): Promise<string> {
  const c = getClient();
  const bucket = getBucketName();
  return c.presignedGetObject(bucket, key, expirySeconds);
}

/** Obtiene un objeto como Buffer. */
export async function getFile(key: string): Promise<Buffer | null> {
  const c = getClient();
  const bucket = getBucketName();
  try {
    const stream = await c.getObject(bucket, key);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks);
  } catch {
    return null;
  }
}

/** Elimina un objeto del bucket. */
export async function deleteFile(key: string): Promise<void> {
  const c = getClient();
  const bucket = getBucketName();
  await c.removeObject(bucket, key);
}
