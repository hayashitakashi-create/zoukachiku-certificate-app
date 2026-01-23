import { NextResponse } from 'next/server';
import { OTHER_RENOVATION_CATEGORIES } from '@/lib/other-renovation-work-types';

/**
 * GET /api/other-renovation-works/categories
 * その他増改築工事のカテゴリ一覧を取得
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: OTHER_RENOVATION_CATEGORIES,
    });
  } catch (error) {
    console.error('Error fetching other renovation categories:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories',
      },
      { status: 500 }
    );
  }
}
