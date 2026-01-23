import { NextResponse } from 'next/server';
import { ENERGY_SAVING_WORK_TYPES, getEnergySavingWorkTypesByCategory } from '@/lib/energy-saving-work-types';

/**
 * GET /api/energy-saving-works/work-types
 * 省エネ改修工事の種別一覧を取得
 */
export async function GET() {
  try {
    // カテゴリ別にグループ化したデータも返す
    const categoryMap = getEnergySavingWorkTypesByCategory();
    const categories = Array.from(categoryMap.entries()).map(([category, works]) => ({
      category,
      works,
    }));

    return NextResponse.json({
      success: true,
      data: {
        all: ENERGY_SAVING_WORK_TYPES,
        byCategory: categories,
      },
    });
  } catch (error) {
    console.error('Error fetching energy-saving work types:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch work types',
      },
      { status: 500 }
    );
  }
}
