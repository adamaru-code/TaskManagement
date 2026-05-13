---
name: enforce-default-ports
description: TaskManagement プロジェクトのローカル開発サーバーを起動する前に必ず参照する。Spring Boot バックエンドは 8080、Vite フロントエンドは 5173 を必須とし、別ポートでのフォールバックを禁止する。`./gradlew bootRun` / `npm run dev` などサーバー起動の話題が出た時に発動。
---

# ローカル開発サーバーの起動ポート（厳守）

このプロジェクトでサーバーを起動する際は、必ず以下のデフォルトポートを使用すること。
別ポートでの一時起動は**禁止**（CORS とプロキシ設定が固定ポート前提のため動かない）。

| サーバー | 必須ポート |
|---|---|
| Backend (Spring Boot) | **8080** |
| Frontend (Vite) | **5173** |

## 起動前チェック（必須手順）

サーバーを起動する前に、必ずポート使用状況を確認する:

```bash
lsof -i :8080
lsof -i :5173
```

判断フロー:

1. **何も出力されない** → ポートは空いている。そのまま起動してよい。
2. **プロセスが居る、かつ自分（Claude）が前のターンで起動したもの** → `kill <PID>` で停止してから起動する。
3. **プロセスが居るが、何のプロセスかわからない** → 勝手に停止せず、ユーザーに確認する。
   - `ps -p <PID> -o command=` でプロセスの素性を確認できる
4. **Vite が「Port 5173 is in use, trying another one...」と 5174 等にフォールバックした** → 即座に停止し、5173 を空けてからやり直す。

## なぜこのルールがあるか

- バックエンドの CORS は `http://localhost:5173` のみ許可（[backend/src/main/java/com/example/taskmanagement/WebConfig.java](../../../backend/src/main/java/com/example/taskmanagement/WebConfig.java)）
- フロントの Vite プロキシは `/api → http://localhost:8080`（[frontend/vite.config.ts](../../../frontend/vite.config.ts)）

別ポートで起動すると見かけ上は立ち上がるが、ブラウザから API を叩いた瞬間に CORS エラーまたはプロキシ失敗で動かない。

## 起動コマンド（参考）

```bash
# バックエンド
cd backend && ./gradlew bootRun        # → http://localhost:8080

# フロントエンド
cd frontend && npm run dev             # → http://localhost:5173

# データベース（先に起動しておく）
docker compose up -d
```

## 関連

- プロジェクト規約: [CLAUDE.md](../../../CLAUDE.md) 第 9 章
