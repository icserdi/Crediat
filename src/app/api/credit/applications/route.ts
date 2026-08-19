import { NextRequest, NextResponse } from 'next/server';
import {
  createCreditApplication,
  listCreditApplications,
  validateCreditApplication,
  type CreditApplicationInput,
} from '@/lib/credit/application';
import { uploadFile, isStorageConfigured } from '@/lib/storage/minio';
import { initializeDb } from '@/lib/db';

let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initializeDb();
    dbInitialized = true;
  }
}

/** GET /api/credit/applications — Lista solicitudes. */
export async function GET() {
  try {
    await ensureDb();
    const applications = await listCreditApplications();
    return NextResponse.json({ applications });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Error al listar solicitudes',
      },
      { status: 500 }
    );
  }
}

/** POST /api/credit/applications — Crea una solicitud (multipart/form-data). */
export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    const formData = await request.formData();

    const input: CreditApplicationInput = {
      personType: (formData.get('personType') as CreditApplicationInput['personType']) || 'fisica',
      fullName: String(formData.get('fullName') || ''),
      city: String(formData.get('city') || ''),
      state: String(formData.get('state') || ''),
      advisor: String(formData.get('advisor') || ''),
      email: String(formData.get('email') || ''),
      phone: String(formData.get('phone') || ''),
    };

    const errors = validateCreditApplication(input);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: errors.join(' ') },
        { status: 400 }
      );
    }

    // Subir archivos adjuntos a MinIO (si está configurado)
    const attachments: string[] = [];
    const files = formData.getAll('files') as File[];
    const storageAvailable = isStorageConfigured();

    for (const file of files) {
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const key = await uploadFile(
          buffer,
          file.name,
          file.type || 'application/octet-stream',
          'credit-applications'
        );
        attachments.push(key);
      }
    }

    // Si se esperaban archivos pero no hay almacenamiento configurado, advertir
    if (files.length > 0 && !storageAvailable) {
      console.warn('MinIO no configurado; archivos no persistidos.');
    }

    const application = await createCreditApplication({ ...input, attachments });
    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Error al crear solicitud',
      },
      { status: 500 }
    );
  }
}
