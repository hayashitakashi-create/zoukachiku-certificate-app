import { NextResponse } from 'next/server';
import { COHABITATION_WORK_TYPES, getCohabitationWorkTypesByCategory } from '@/lib/cohabitation-work-types';

/**
 * GET /api/cohabitation-works/work-types
 * 同居対応改修工事の種別一覧を取得
 */
export async function GET() {
  try {
    // カテゴリ別にグループ化したデータも返す
    const categoryMap = getCohabitationWorkTypesByCategory();
    const categories = Array.from(categoryMap.entries()).map(([category, works]) => ({
      category,
      works,
    }));

    return NextResponse.json({
      success: true,
      data: {
        all: COHABITATION_WORK_TYPES,
        byCategory: categories,
      },
    });
  } catch (error) {
    console.error('Error fetching cohabitation work types:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch work types',
      },
      { status: 500 }
    );
  }
}
