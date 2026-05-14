# タスク管理アプリ（Trello風）

未着手 / 進行中 / 完了の 3 カラムでタスクを視覚的に管理する、Trello 風のカンバンボードアプリ。
RaiseTech Web アプリ開発コースの学習成果物として、React + Spring Boot + PostgreSQL のフルスタック構成で開発する。

## 目次

- [1. アプリ概要](#1-アプリ概要)
- [2. ドキュメント一覧](#2-ドキュメント一覧)
- [3. プロジェクト構成](#3-プロジェクト構成)
- [4. 技術スタック（概要）](#4-技術スタック概要)
- [5. ローカル起動手順](#5-ローカル起動手順)
- [6. 開発ワークフロー](#6-開発ワークフロー)
- [7. リンク](#7-リンク)

---

## 1. アプリ概要

| 項目 | 内容 |
|------|------|
| アプリ名 | タスク管理アプリ（Trello 風） |
| 目的 | 自分のタスクを「未着手・進行中・完了」の 3 段階で視覚的に管理する |
| 対象ユーザー | 個人でタスクを管理したい人 |
| 学習目標 | React によるコンポーネント設計・状態管理と、Spring Boot による REST API 開発・DB 連携を経験し、フルスタック開発の基礎を習得する |

### 主要機能

タスクの作成・表示・編集・削除（CRUD）と、ドラッグ&ドロップによるステータス変更・並び替えを中心に提供する。

| 機能 | 概要 |
|------|------|
| タスク作成 | フォームから新規タスクを登録する |
| タスク表示 | ステータス別カラムにカード形式で一覧表示する |
| タスク編集 | タイトル・説明文・優先度・期限を変更する |
| タスク削除 | カードまたは編集モーダルからタスクを削除する |
| ステータス変更 | ドラッグ&ドロップでカラム間を移動する |
| カード並び替え | カラム内でカードをドラッグして任意の位置に並び替える |
| ソート | ボタン操作でカラム内を優先度順 / 期限順に並び替える |
| データ永続化 | API を通じて PostgreSQL にデータを保存・取得する |

---

## 2. ドキュメント一覧

要件定義から技術選定まで、設計ドキュメントは [docs/](docs/) に集約している。

| ドキュメント | 内容 |
|--------------|------|
| [要件定義](docs/requirements.md) | 機能要件・非機能要件の全体像 |
| [ユースケース](docs/use-cases.md) | ユーザー操作ごとのシナリオ |
| [画面設計](docs/screen-design.md) | ボード画面・モーダルのレイアウトと挙動 |
| [データ定義](docs/data-definition.md) | `tasks` テーブルのスキーマ詳細 |
| [非機能要件](docs/non-functional-requirements.md) | 性能・可用性・セキュリティなど |
| [技術スタック](docs/tech-stack.md) | 採用技術と確定バージョン |

開発ルール（Issue → Branch → PR のフロー、コミット規約、起動ポート）は [CLAUDE.md](CLAUDE.md) に集約している。

---

## 3. プロジェクト構成

```
TaskManagement/
├── backend/              Spring Boot アプリ（Java 25 / Gradle）
│   ├── src/main/java/    REST API 実装
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── db/migration/  Flyway マイグレーション SQL
│   └── build.gradle
├── frontend/             React + Vite アプリ（TypeScript）
│   ├── src/              コンポーネント・ページ
│   ├── vite.config.ts    /api → :8080 プロキシ設定
│   └── package.json
├── docs/                 設計・要件定義ドキュメント
├── mock/                 画面モックアップ（静的 HTML）
├── docker-compose.yml    PostgreSQL 17 のローカル起動設定
├── CLAUDE.md             Claude Code / 開発者向けの作業ルール
└── README.md
```

---

## 4. 技術スタック（概要）

| 役割 | 技術 | バージョン |
|------|------|------------|
| フロントエンド | React + TypeScript + Vite | React 19.2.6 / TypeScript ~6.0.2 / Vite 8.0.12 |
| スタイリング | Tailwind CSS | 4.3.0 |
| バックエンド | Java + Spring Boot（Gradle） | Java 25 / Spring Boot 4.0.6 / Gradle 9.4.1 |
| DB アクセス | Spring Data JPA + Flyway | Spring Boot 同梱版 |
| データベース | PostgreSQL（Docker） | 17 |
| API 通信 | REST API（JSON） | - |

詳細・導入予定の技術は [技術スタック](docs/tech-stack.md) を参照。

---

## 5. ローカル起動手順

> **ポートは厳守**: バックエンドは **8080**、フロントエンドは **5173** で起動する。
> CORS / Vite プロキシが固定ポート前提のため、別ポートでは動作しない（[CLAUDE.md §9](CLAUDE.md) 参照）。

事前に Docker Desktop / Java 25 / Node.js が利用できる状態にしておくこと。

### 5.1 データベース（PostgreSQL）

リポジトリルートで:

```bash
docker compose up -d        # PostgreSQL 17 コンテナを起動
docker compose ps           # 起動確認（STATUS が healthy になればOK）
docker compose down         # 停止（データは保持）
docker compose down -v      # 停止＋データ削除（リセット）
```

接続確認:

```bash
docker exec -it taskmanagement-postgres psql -U taskmanagement -d taskmanagement -c '\l'
```

### 5.2 バックエンド（Spring Boot）

```bash
cd backend
./gradlew bootRun           # http://localhost:8080 で起動
```

起動後、`http://localhost:8080/api/tasks` で JSON 形式のタスク一覧が取得できれば成功。

### 5.3 フロントエンド（React + Vite）

DB とバックエンドが起動している前提で、別ターミナルから:

```bash
cd frontend
npm install                 # 初回のみ
npm run dev                 # http://localhost:5173 で起動
```

ブラウザで `http://localhost:5173` を開くと、3 カラム（未着手 / 進行中 / 完了）のボード画面にタスクが表示される。
開発時は Vite のプロキシ機能により、`/api/*` へのリクエストが自動で `http://localhost:8080` に転送される。

### 5.4 ポートが衝突したとき

```bash
lsof -i :8080
lsof -i :5173
```

既存プロセスがいれば停止してから起動し直す。Vite が自動で 5174 等にフォールバックした場合も、即座に停止して 5173 を空けること（CORS 設定が `localhost:5173` のみ許可しているため）。

---

## 6. 開発ワークフロー

このリポジトリでは **Issue → Branch → PR → セルフマージ → Branch 削除** のフローを厳守する。
`main` ブランチへの直接 push は GitHub 側で Branch protection により禁止されている。

```
Issue 作成 → Branch 作成 → 実装 → Push → Pull Request → セルフマージ → Branch 削除
```

ブランチ命名・コミット規約（Conventional Commits、説明は日本語）の詳細は [CLAUDE.md](CLAUDE.md) を参照。

---

## 7. リンク

- **GitHub リポジトリ**: https://github.com/adamaru-code/TaskManagement
- **設計ドキュメント**: [docs/](docs/)
- **開発ルール**: [CLAUDE.md](CLAUDE.md)
