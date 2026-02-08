'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    setIsLoading(true);

    try {
      // ユーザー登録API呼び出し
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'ユーザー登録に失敗しました');
        return;
      }

      // 登録成功 → 自動ログイン
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // 登録は成功したがログインに失敗
        router.push('/login');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('登録中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            増改築等工事証明書
          </h1>
          <h2 className="mt-2 text-xl text-gray-600">ユーザー登録</h2>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              氏名
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                         focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="山田 太郎"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                         focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="example@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              パスワード <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                         focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="8文字以上"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              パスワード（確認） <span className="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                         focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="パスワードを再入力"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md
                       shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '登録中...' : 'ユーザー登録'}
          </button>

          <div className="text-center text-sm text-gray-600">
            既にアカウントをお持ちの方は{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
              ログイン
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
