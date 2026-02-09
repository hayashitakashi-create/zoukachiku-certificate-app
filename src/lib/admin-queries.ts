import { prisma } from '@/lib/prisma';

// ダッシュボード統計
export async function getDashboardStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalUsers, adminUsers, totalCertificates, newUsersThisMonth] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.certificate.count(),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    ]);

  return { totalUsers, adminUsers, totalCertificates, newUsersThisMonth };
}

// 最近のユーザー登録（最新10件）
export async function getRecentUsers(limit = 10) {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}

// 最近の証明書（最新5件）
export async function getRecentCertificates(limit = 5) {
  return prisma.certificate.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { name: true, email: true } },
    },
  });
}

// ユーザー一覧（検索・ページネーション対応）
export async function getUsers({
  search,
  page = 1,
  perPage = 20,
}: {
  search?: string;
  page?: number;
  perPage?: number;
}) {
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        accounts: { select: { provider: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    total,
    totalPages: Math.ceil(total / perPage),
    currentPage: page,
  };
}

// 証明書一覧（フィルター・検索・ページネーション対応）
export async function getCertificates({
  search,
  status,
  purposeType,
  page = 1,
  perPage = 20,
}: {
  search?: string;
  status?: string;
  purposeType?: string;
  page?: number;
  perPage?: number;
}) {
  const where: Record<string, unknown> = {};

  if (status && status !== 'all') {
    where.status = status;
  }
  if (purposeType && purposeType !== 'all') {
    where.purposeType = purposeType;
  }
  if (search) {
    where.OR = [
      { applicantName: { contains: search, mode: 'insensitive' } },
      { propertyAddress: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [certificates, total] = await Promise.all([
    prisma.certificate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.certificate.count({ where }),
  ]);

  return {
    certificates,
    total,
    totalPages: Math.ceil(total / perPage),
    currentPage: page,
  };
}
