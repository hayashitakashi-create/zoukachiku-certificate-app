import { NextResponse } from 'next/server';
import { CHILDCARE_WORK_TYPES, getChildcareWorkTypesByCategory } from '@/lib/childcare-work-types';

/**
 * GET /api/childcare-works/work-types
 * 子育て対応改修工事の種別一覧を取得
 */
export async function GET() {
  try {
    // カテゴリ別にグループ化したデータも返す
    const categoryMap = getChildcareWorkTypesByCategory();
    const categories = Array.from(categoryMap.entries()).map(([category, works]) => ({
      category,
      works,
    }));

    return NextResponse.json({
      success: true,
      data: {
        all: CHILDCARE_WORK_TYPES,
        byCategory: categories,
      },
    });
  } catch (error) {
    console.error('Error fetching childcare work types:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch work types',
      },
      { status: 500 }
    );
  }
}
