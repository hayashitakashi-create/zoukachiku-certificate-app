# デプロイ時のトラブルシューティング

## データベース接続エラーの原因と対策

### 問題の概要

本番環境へのデプロイ後、証明書作成時に以下のエラーが発生しました：

1. **初回エラー**: `Can't reach database server at 127.0.0.1:5432`
2. **2回目エラー**: `The table 'public.Certificate' does not exist in the current database`

### 根本原因

#### 1. データベースが存在しなかった
- **ローカル環境**: PostgreSQLデータベースが動作
- **本番環境**: データベースが全く存在せず、環境変数も未設定
- **結果**: localhostへの接続試行でエラー

#### 2. テーブルが作成されていなかった
- データベースは作成されたが、空の状態
- Prismaマイグレーションが実行されていなかった
- **結果**: テーブル不存在エラー

### 解決手順

#### ステップ1: データベースの作成

1. Vercelダッシュボードを開く
2. プロジェクト → **Storage** タブ → **Create Database**
3. **Neon** (Serverless Postgres) を選択
4. 設定:
   - Region: **Singapore (Southeast)** (日本に最も近い)
   - Plan: **Free**
5. **Create** をクリック

#### ステップ2: プロジェクトへの接続

1. **Connect Project** ボタンをクリック
2. 対象プロジェクトを選択
3. Environments: **Development, Preview, Production** すべて選択
4. **Connect** をクリック

これにより、以下の環境変数が自動的に追加されます：
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `DATABASE_URL`
- その他Postgres関連の環境変数（計16個）

#### ステップ3: データベースマイグレーション実行

本番データベースに対してマイグレーションを実行：

```bash
# 本番環境変数を取得
npx vercel env pull .env.production.local

# マイグレーションを実行
POSTGRES_PRISMA_URL="<接続文字列>" npx prisma migrate deploy
```

#### ステップ4: 動作確認

デプロイされたサイトで証明書作成フローをテスト：
1. 新規証明書作成
2. 基本情報入力
3. 証明書の用途選択
4. 「次へ」をクリック → 正常に遷移すればOK

---

## 恒久的な解決策（推奨）

### ビルド時の自動マイグレーション

**問題**: 手動でマイグレーションを実行し忘れる可能性がある

**解決**: `package.json`のbuildスクリプトを修正して、ビルド時に自動実行

#### 修正内容

```json
// 修正前
"build": "prisma generate && SKIP_DB_INIT=true next build"

// 修正後
"build": "prisma generate && prisma migrate deploy && SKIP_DB_INIT=true next build"
```

#### メリット

- Vercelでのビルド時に自動的にマイグレーション実行
- 手動実行が不要
- デプロイの度にスキーマが最新状態に保たれる

---

## 今後のデプロイフロー

### 新規プロジェクトのデプロイ

1. **データベース作成**: Vercel Storage → Neon → Create
2. **プロジェクト接続**: Connect Project
3. **コードデプロイ**: `git push`
4. **完了**: マイグレーションは自動実行される

### スキーマ変更時

1. **ローカルでマイグレーション作成**:
   ```bash
   npx prisma migrate dev --name <変更内容>
   ```

2. **コミット&プッシュ**:
   ```bash
   git add .
   git commit -m "データベーススキーマ更新: <変更内容>"
   git push
   ```

3. **完了**: Vercelが自動でマイグレーション適用

---

## よくある問題と対処法

### Q1: ローカルで動くが本番で動かない

**原因**: 本番環境変数が未設定 or データベース未作成

**確認方法**:
```bash
npx vercel env ls production
```

**対処法**: 上記「解決手順」を実施

### Q2: マイグレーションが失敗する

**原因**: 既存データとスキーマの不整合

**対処法**:
```bash
# マイグレーション履歴を確認
npx prisma migrate status

# 必要に応じてリセット（開発環境のみ！）
npx prisma migrate reset
```

### Q3: ビルドは成功するがランタイムエラー

**原因**: 環境変数がビルド時には不要だが、実行時に必要

**確認**: Vercel → Settings → Environment Variables でPOSTGRES_*が設定されているか確認

---

## 参考リンク

- [Prisma Migrate in Production](https://www.prisma.io/docs/orm/prisma-migrate/workflows/production-troubleshooting)
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [Next.js Deployment Best Practices](https://nextjs.org/docs/deployment)

---

**最終更新**: 2026-01-26
