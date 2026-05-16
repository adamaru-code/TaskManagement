[← README に戻る](../README.md)

# 技術スタック

各バージョンは現時点で実際に導入済みのもの。「導入予定」と注記したものは、後続の Issue で追加予定。

## 概要

| 役割 | 技術 | 理由 |
|------|------|------|
| フロントエンド | React | コンポーネント設計・状態管理の学習 |
| バックエンド | Java / Spring Boot | REST API開発・サーバーサイド処理の学習 |
| データベース | PostgreSQL | データの永続化。Spring Boot（JPA）と連携 |
| API通信 | REST API（JSON） | フロントエンドとバックエンドのデータのやり取り |

## バックエンド詳細

| 項目 | 採用技術 | バージョン | 補足 |
|------|----------|------------|------|
| 言語 | Java | **25**（LTS） | `backend/build.gradle` の toolchain で固定 |
| フレームワーク | Spring Boot | **4.0.6** | 最新安定版（GA） |
| ビルドツール | Gradle | **9.4.1** | Wrapper 経由（`./gradlew`）。Groovy DSL（`build.gradle`） |
| パッケージ管理 | Gradle（Maven Central） | Gradle 9.4.1 と一体 | `build.gradle` の `dependencies {}` で管理。ビルドツールが依存管理を兼ねる。dependency locking は未設定（必要になったら導入検討） |
| ORM / DBアクセス | Spring Data JPA | Spring Boot 4.0.6 同梱版 | `spring-boot-starter-data-jpa` |
| 入力検証 | Spring Validation | Spring Boot 4.0.6 同梱版 | `spring-boot-starter-validation` |
| ボイラープレート削減 | Lombok | Spring Boot 4.0.6 管理版 | `compileOnly` + `annotationProcessor` |
| DBマイグレーション | Flyway | Spring Boot 4.0.6 管理版 | `flyway-core` + `flyway-database-postgresql` |
| JDBC ドライバ | PostgreSQL JDBC | Spring Boot 4.0.6 管理版 | `runtimeOnly 'org.postgresql:postgresql'` |
| テスト | JUnit 5 / Spring Boot Test | Spring Boot 4.0.6 同梱版 | `spring-boot-starter-webmvc-test` |
| API ドキュメント | springdoc-openapi | **導入予定** | Swagger UI を自動生成（未導入） |
| DB 統合テスト | H2 / Testcontainers | **導入予定** | Docker 導入後に Testcontainers へ移行検討 |

> Spring Boot Starter で取り込まれるライブラリは、Spring Boot の BOM によりバージョンが揃えられる。個別に固定したい場合のみバージョン明記する方針。

## フロントエンド詳細

| 項目 | 採用技術 | バージョン | 補足 |
|------|----------|------------|------|
| ランタイム | Node.js | ローカル開発で v26 系を使用（未固定） | `engines` / `.nvmrc` での強制は未設定。必要になったら `.nvmrc` 追加を検討 |
| パッケージ管理 | npm | Node.js 同梱版（ローカルは npm 11 系） | `package.json` + `package-lock.json` で依存を固定。Yarn / pnpm は不採用 |
| ライブラリ | React / React DOM | **19.2.6** | `frontend/package.json` |
| 言語 | TypeScript | **~6.0.2** | 型安全性の確保 |
| ビルドツール / 開発サーバー | Vite | **8.0.12** | `npm run dev` で 5173 番ポート |
| React 用 Vite プラグイン | @vitejs/plugin-react | **6.0.1** | |
| スタイリング | Tailwind CSS | **4.3.0** | `@tailwindcss/vite` 経由 |
| Lint | ESLint | **10.3.0** | `typescript-eslint` 8.59.2 / `eslint-plugin-react-hooks` 7.1.1 |
| Node 型定義 | @types/node | **24.12.3** | |
| ルーティング | React Router | **導入予定** | 画面遷移が必要になった段階で導入 |
| サーバー状態管理 | TanStack Query + Axios | **導入予定** | API 通信・キャッシュ層を整備するタイミングで導入 |
| ドラッグ&ドロップ | HTML5 Drag and Drop API | **採用** | カラム間移動・並び替えに使用。@dnd-kit などの外部ライブラリは追加せずブラウザ標準APIで実装 |

## データベース詳細

| 項目 | 採用技術 | バージョン | 補足 |
|------|----------|------------|------|
| RDBMS | PostgreSQL | **17**（`postgres:17` イメージ） | |
| ローカル起動 | Docker Compose | Docker Desktop 同梱版 | プロジェクトルートの `docker-compose.yml` で起動 |
| 接続情報（開発用） | host=localhost / port=5432 / db=taskmanagement / user=taskmanagement / password=taskmanagement | - | パスワードは開発用固定値。本番では別管理 |

## 開発ツール

| 項目 | 採用技術 | 補足 |
|------|----------|------|
| バージョン管理 | Git / GitHub | リポジトリ: [adamaru-code/TaskManagement](https://github.com/adamaru-code/TaskManagement) |
| エディタ | Cursor | |
| コンテナ | Docker Desktop / Docker Compose | PostgreSQL のローカル起動に使用（必須） |
