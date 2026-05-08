# プロジェクト規約（Claude Code 厳守）

このファイルは、Claude Code がこのリポジトリで作業する際に**必ず**従うルールを定めています。
ユーザーが明示的に「このルールを破って」と指示しない限り、例外は認めません。

---

## 1. 開発ワークフロー（必須順序）

すべての変更は次の順序で進めます：

```
Issue 作成 → Branch 作成 → 実装 → Push → Pull Request → セルフマージ → Branch 削除
```

### NG 行為（禁止）

- ❌ **`main` ブランチへの直接コミット・直接 push**
- ❌ **Issue を立てずにブランチを切る**
- ❌ **PR を作らずにマージする**
- ❌ **`main` への force push、`main` の削除**

例外: `CLAUDE.md` 自体のタイポ修正など、ユーザーが「直接でいい」と明示した場合のみ。
判断に迷ったら必ずユーザーに確認すること。

---

## 2. Issue を作る

実装に取りかかる前に、必ず Issue を立てます。

```bash
gh issue create --title "<簡潔な要約>" --body "<本文>"
```

- タイトルは命令形・簡潔に（例: `Add POST /api/tasks endpoint`）
- 本文は `.github/ISSUE_TEMPLATE/` のテンプレートに沿う
- ラベルは付けなくて良い（運用が複雑になるため当面 OFF）

---

## 3. ブランチを作る

### 命名規則

```
<type>/<issue#>-<short-desc>
```

- `<type>`: `feature` | `fix` | `docs` | `chore` | `refactor` | `test`
- `<issue#>`: 上で作った Issue の番号（必須）
- `<short-desc>`: ハイフン区切りの英小文字（3〜5語）

例:
- `feature/12-add-task-create-endpoint`
- `fix/15-priority-validation-message`
- `docs/8-update-readme-setup`

### 作成手順

```bash
git checkout main
git pull origin main           # 最新を取得
git checkout -b feature/12-add-task-create-endpoint
```

---

## 4. 実装〜コミット

### コミットメッセージのフォーマット

**Conventional Commits 形式**で、説明部分は日本語で記述する：

```
<type>: <日本語の説明>
```

- `<type>` は英語の小文字。次のいずれか：
  - `feat`: 新機能
  - `fix`: バグ修正
  - `docs`: ドキュメントのみの変更
  - `chore`: ビルド・依存・設定など雑務
  - `refactor`: 機能変更を伴わないコード整理
  - `test`: テストの追加・修正
- 1 行目（要約）は簡潔に。50〜70文字程度を目安に
- 詳細が必要なら 2 行目を空けて 3 行目以降に書く
- Co-Authored-By タグを末尾に付ける（Claude が手を動かしたコミットの場合）
- 1 PR の中で複数コミットになっても OK（途中状態のコミットを残してよい）

### type の対応関係（コミット ↔ ブランチ）

Conventional Commits の標準は `feat` だが、ブランチ名は読みやすさ優先で `feature/...` を使う。
両者は意図的に並存させる（`feat` コミットは `feature/...` ブランチに入る）。

| 用途 | コミット type | ブランチ type |
|---|---|---|
| 新機能 | `feat` | `feature` |
| バグ修正 | `fix` | `fix` |
| ドキュメント | `docs` | `docs` |
| 雑務 | `chore` | `chore` |
| リファクタ | `refactor` | `refactor` |
| テスト | `test` | `test` |

### 例

```
feat: タスク作成エンドポイント (POST /api/tasks) を追加

リクエスト本文を Task エンティティへマッピングし、
created_at / updated_at を自動でセットする。バリデーションは
@Valid + @NotBlank で title / priority を必須化。

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

過去のコミット（英語）はそのまま残す。今後のコミットからこのフォーマットに切り替える。

---

## 5. Pull Request を作る

```bash
git push -u origin <branch-name>
gh pr create --title "<title>" --body "..." --base main
```

- PR 本文には **`Closes #<issue#>`** を必ず含める（マージ時に Issue が自動クローズされる）
- `.github/pull_request_template.md` のテンプレートに沿う
- レビュー承認は不要（セルフマージ可）

---

## 6. マージ〜後始末

```bash
gh pr merge --squash --delete-branch
git checkout main
git pull origin main
```

- マージ方式: **squash merge** を基本とする（履歴が線形で読みやすい）
- マージ後は **必ずブランチを削除**（`--delete-branch`）
- ローカル main を最新化して次の作業に入る

---

## 7. Branch protection（GitHub 側の強制ルール）

GitHub 上で `main` に対し以下の保護が掛かっています：

- PR 経由のマージのみ許可（直接 push 不可）
- force push 禁止 / ブランチ削除禁止
- **管理者にも適用**（owner であっても例外なし）

設定確認:
```bash
gh api repos/adamaru-code/TaskManagement/branches/main/protection
```

---

## 8. 自動的に守るために

Claude Code がこのリポジトリで作業を始める際、最初にこのファイルを読み込みます。
ユーザーから「実装して」「修正して」と頼まれたら、上記の **Issue → Branch → PR** のフローを
自動的に開始すること。「コミットして」と言われた場合も、対象が main ブランチであれば
**現在のブランチを確認**し、main にいるなら必ず作業ブランチに切り替えてから進めること。

---

## 参考: プロジェクト固有情報

- **GitHub リポジトリ**: https://github.com/adamaru-code/TaskManagement
- **デフォルトブランチ**: `main`
- **要件定義書**: [docs/](docs/)
- **ローカル起動手順**: [README.md](README.md) 参照
