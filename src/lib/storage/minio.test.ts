import { describe, it, expect } from 'vitest';
import { sanitizeFilename, getBucketName } from './minio';

describe('sanitizeFilename', () => {
  it('mantiene nombres válidos', () => {
    expect(sanitizeFilename('ine.pdf')).toBe('ine.pdf');
    expect(sanitizeFilename('CURP_2024.jpg')).toBe('CURP_2024.jpg');
  });

  it('reemplaza caracteres inválidos por guion bajo', () => {
    expect(sanitizeFilename('mi documento!.pdf')).toBe('mi_documento_.pdf');
    expect(sanitizeFilename('acta constitutiva.docx')).toBe('acta_constitutiva.docx');
    expect(sanitizeFilename('archivo/extraño.txt')).toBe('archivo_extra_o.txt');
  });

  it('no contiene espacios', () => {
    expect(sanitizeFilename('con espacios.pdf')).not.toContain(' ');
  });
});

describe('getBucketName', () => {
  it('retorna el bucket por defecto cuando no hay variable', () => {
    delete process.env.MINIO_BUCKET;
    expect(getBucketName()).toBe('crediat');
  });

  it('retorna el bucket configurado', () => {
    process.env.MINIO_BUCKET = 'mi-bucket';
    expect(getBucketName()).toBe('mi-bucket');
    delete process.env.MINIO_BUCKET;
  });
});
