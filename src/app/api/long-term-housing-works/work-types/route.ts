import { NextResponse } from 'next/server';
import { LONG_TERM_HOUSING_WORK_TYPES, getLongTermHousingWorkTypesByCategory } from '@/lib/long-term-housing-work-types';

/**
 * GET /api/long-term-housing-works/work-types
 * 長期優良住宅化改修工事の種別一覧を取得
 */
export async function GET() {
  try {
    // カテゴリ別にグループ化したデータも返す
    const categoryMap = getLongTermHousingWorkTypesByCategory();
    const categories = Array.from(categoryMap.entries()).map(([category, works]) => ({
      category,
      works,
    }));

    return NextResponse.json({
      success: true,
      data: {
        all: LONG_TERM_HOUSING_WORK_TYPES,
        byCategory: categories,
      },
    });
  } catch (error) {
    console.error('Error fetching long-term housing work types:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch work types',
      },
      { status: 500 }
    );
  }
}
