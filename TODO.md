# 対応すべき作業一覧

## 1. 直近対応（すぐやる）

- [x] `refactor-audit` ブランチを `main` にマージ（PR作成 → マージ）
- [x] `.env.example` を作成（必要な環境変数を記載）

## 2. コード修正（TODO箇所の解消）

- [x] `src/lib/renovationCalculator.ts` - 長期優良住宅化リフォームの控除計算関数を追加（`calculateLongTermHousingRenovation`）
- [x] `src/lib/renovationCalculator.ts` - パターン2・パターン3（長期優良住宅化の組み合わせ最適化）を実装
- [x] `src/app/certificate/create/page.tsx` - 証明書発行時に実際の工事データを取得して検証するロジックを実装
- [x] `src/app/api/certificates/[id]/calculate-combined/route.ts` - 長期優良住宅化サマリーの取得と組み合わせ計算への反映

## 3. テスト整備

- [x] テストフレームワーク導入（Vitest v4.0.18）
- [x] `renovationCalculator.ts` の計算ロジックのユニットテスト（38テスト全パス）
- [x] 工事種別計算ライブラリのユニットテスト（45テスト全パス）
- [ ] 証明書作成フローのE2Eテスト

## 4. 認証・認可の実装

- [x] NextAuth.js v5（Auth.js）による認証基盤の導入
- [x] Credentials Provider（メール/パスワード認証）
- [x] ロールベースのアクセス制御（管理者 / 建築士）
- [x] APIルートへの認証ガード追加（証明書CRUD）
- [x] ログイン / ユーザー登録ページ
- [x] middleware.ts によるルート保護

## 5. PDF生成の拡充

- [x] PDF共通ユーティリティ作成（テンプレート読込・フォント埋込・描画ヘルパー）
- [x] 固定資産税減額用の証明書PDF生成（暫定座標、本番前に実測要）
- [x] PDFルートのpurposeType分岐対応（housing_loan / property_tax）
- [ ] 買取再販住宅用の証明書PDF生成
- [ ] 固定資産税PDFの座標実測（PyMuPDF）
- [ ] その他証明書タイプのPDF対応

## 6. 本番インフラ・運用

- [x] エラー監視導入（Sentry SDK統合済み、DSN設定で有効化）
- [x] CI/CDパイプライン構築（GitHub Actions）
- [ ] データベースバックアップ戦略の策定
- [x] APIレートリミットの実装（トークンバケット方式、認証10/分・PDF10/分・一般60/分）
- [x] セキュリティ監査・強化
  - [x] 全工事データAPIに認証ガード＋所有権チェック追加（9ルート対応）
  - [x] セキュリティヘッダー追加（X-Frame-Options, CSP, HSTS, X-Content-Type-Options等）
  - [x] ユーザー登録APIにZodバリデーション追加（メール形式・パスワード長）
  - [x] エラーメッセージの安全化（内部エラー詳細を非公開化、全17ルート対応）
  - [x] レートリミットテスト追加（5テスト）

## 7. あると良い機能（優先度低）

- [ ] 証明書の履歴・バージョン管理
- [ ] CSV/Excel一括エクスポート
- [ ] 日付範囲・金額範囲の詳細検索フィルター
- [ ] 証明書テンプレート複製機能
- [ ] メール通知（証明書発行時の確認メール等）
