import { NextRequest, NextResponse } from 'next/server';
import { predictCashFlow, type PredictCashFlowInput } from '@/ai/flows/predict-cash-flow';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PredictCashFlowInput;

    if (
      !body.historicalData ||
      !Array.isArray(body.historicalData) ||
      body.historicalData.length === 0
    ) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'historicalData es requerido y debe ser un array no vacío.',
        },
        { status: 400 }
      );
    }

    if (!body.predictionHorizonDays || body.predictionHorizonDays <= 0) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'predictionHorizonDays es requerido y debe ser positivo.',
        },
        { status: 400 }
      );
    }

    const result = await predictCashFlow(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'AI_ERROR',
        message: error instanceof Error ? error.message : 'Error al generar predicción',
      },
      { status: 500 }
    );
  }
}
