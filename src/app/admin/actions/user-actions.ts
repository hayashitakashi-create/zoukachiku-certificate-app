'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('認証が必要です');
  }
  if ((session.user as { role?: string }).role !== 'admin') {
    throw new Error('管理者権限が必要です');
  }
  return session.user.id;
}

export async function updateUserRole(userId: string, newRole: string) {
  const currentUserId = await requireAdmin();

  if (userId === currentUserId) {
    return { error: '自分のロールは変更できません' };
  }

  if (newRole !== 'admin' && newRole !== 'architect') {
    return { error: '無効なロールです' };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
    revalidatePath('/admin/users');
    revalidatePath('/admin');
    return { success: true };
  } catch {
    return { error: 'ロールの更新に失敗しました' };
  }
}

export async function deleteUser(userId: string) {
  const currentUserId = await requireAdmin();

  if (userId === currentUserId) {
    return { error: '自分自身を削除することはできません' };
  }

  try {
    await prisma.user.delete({
      where: { id: userId },
    });
    revalidatePath('/admin/users');
    revalidatePath('/admin');
    return { success: true };
  } catch {
    return { error: 'ユーザーの削除に失敗しました' };
  }
}
