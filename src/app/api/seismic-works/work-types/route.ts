import { NextResponse } from 'next/server';
import { SEISMIC_WORK_TYPES } from '@/lib/seismic-work-types';

/**
 * GET /api/seismic-works/work-types
 * 耐震改修工事の種別一覧を取得
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: SEISMIC_WORK_TYPES,
    });
  } catch (error) {
    console.error('Error fetching seismic work types:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch work types',
      },
      { status: 500 }
    );
  }
}
