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
| 言語 | Java 25（LTS） | 長期サポート版 |
| フレームワーク | Spring Boot 4.0.x | 最新安定版（GA） |
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
| バージョン | PostgreSQL 17 | `postgres:17` イメージを使用 |
| ローカル起動 | Docker Compose | プロジェクトルートの `docker-compose.yml` で起動 |
| 接続情報（開発用） | host=localhost / port=5432 / db=taskmanagement / user=taskmanagement / password=taskmanagement | パスワードは開発用固定値。本番では別管理 |

## 開発ツール

| 項目 | 採用技術 | 補足 |
|------|----------|------|
| バージョン管理 | Git / GitHub | |
| エディタ | Cursor | |
| コンテナ | Docker Desktop / Docker Compose | PostgreSQL のローカル起動に使用（必須） |
