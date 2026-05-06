[← README に戻る](../README.md)

# 技術スタック

## 概要

| 役割 | 技術 | 理由 |
|------|------|------|
| フロントエンド | React | コンポーネント設計・状態管理の学習 |
| バックエンド | Java / Spring Boot | REST API開発・サーバーサイド処理の学習 |
| データベース | PostgreSQL | データの永続化。Spring Boot（JPA）と連携 |
| API通信 | REST API（JSON） | フロントエンドとバックエンドのデータのやり取り |

## バックエンド詳細

| 項目 | 採用技術 | 補足 |
|------|----------|------|
| 言語 | Java 21（LTS） | 長期サポート版 |
| フレームワーク | Spring Boot 3.x | |
| ビルドツール | **Gradle** | Groovy DSL（`build.gradle`）を使用 |
| ORM / DBアクセス | Spring Data JPA | |
| 入力検証 | Spring Validation | リクエストの値チェック |
| ボイラープレート削減 | Lombok | |
| DBマイグレーション | Flyway | スキーマ変更を SQL ファイルで管理 |
| API ドキュメント | springdoc-openapi | Swagger UI を自動生成 |
| テスト | JUnit 5 / Spring Boot Test | 単体テスト・Web 層テスト中心。DB 統合テストは H2（インメモリ DB）で代用、Docker 導入後に Testcontainers へ移行検討 |

## フロントエンド詳細

| 項目 | 採用技術 | 補足 |
|------|----------|------|
| ライブラリ | React 18+ | |
| 言語 | TypeScript | 型安全性の確保 |
| ビルドツール | Vite | 高速な開発サーバー |
| ルーティング | React Router | |
| サーバー状態管理 | TanStack Query + Axios | API通信とキャッシュ |
| スタイリング | Tailwind CSS | ユーティリティファースト |
| ドラッグ&ドロップ | @dnd-kit | カードのカラム間移動・並び替え |

## データベース詳細

| 項目 | 採用技術 | 補足 |
|------|----------|------|
| RDBMS | PostgreSQL | |
| ローカル起動（当面） | Mac に直接インストール | Postgres.app または Homebrew（`brew install postgresql@16`）で起動 |
| ローカル起動（将来） | Docker Compose（任意・後日導入検討） | 学習が進んだ段階で環境統一のため導入を検討 |

## 開発ツール

| 項目 | 採用技術 | 補足 |
|------|----------|------|
| バージョン管理 | Git / GitHub | |
| エディタ | Cursor | |
| コンテナ（任意・後日導入検討） | Docker / Docker Compose | 当面は使用しない。プロジェクト稼働後に学習ステップとして導入を検討 |
