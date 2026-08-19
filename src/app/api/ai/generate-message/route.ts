import { NextRequest, NextResponse } from 'next/server';
import {
  generateCollectionMessage,
  type GenerateCollectionMessageInput,
} from '@/ai/flows/generate-collection-message-flow';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateCollectionMessageInput;

    if (!body.debtorId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'debtorId es requerido.' },
        { status: 400 }
      );
    }

    if (body.riskScore === undefined || body.riskScore < 0 || body.riskScore > 1) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'riskScore es requerido y debe estar entre 0 y 1.' },
        { status: 400 }
      );
    }

    const result = await generateCollectionMessage(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'AI_ERROR',
        message: error instanceof Error ? error.message : 'Error al generar mensaje',
      },
      { status: 500 }
    );
  }
}
