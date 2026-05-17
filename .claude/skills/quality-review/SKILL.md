---
name: quality-review
description: TaskManagement プロジェクトのコードレビュー / PR 前セルフチェック / 全体品質監査の観点を集約したチェックリスト。Backend（Spring Boot）・Frontend（React + TS）・Docs・PR フローの 4 領域を網羅する。「品質チェック」「レビューして」「PR 出す前に確認」「ベストプラクティスに沿っているか」といった話題で発動。
---

# 品質レビュー チェックポイント

このプロジェクトの **コードレビュー / PR 前セルフチェック / 全体品質監査** で使う観点集。
変更を加える前後、PR を作る前、第三者のコードを読む時に、該当章を上から順に当てて評価する。

> 大規模監査時の進め方: 「Backend → Frontend → Docs → PR フロー」の順で各章を点検し、
> 違反箇所をファイル: 行番号付きで列挙する。修正は CLAUDE.md のフロー（Issue → Branch → PR）に従って分割する。

---

## 1. Backend（Spring Boot）

### 1.1 レイヤ分離

- [ ] **Controller にビジネスロジックが入っていない**（タイムスタンプ生成、`findById/orElseThrow`、集合操作などは Service に置く）
- [ ] **Controller → Service → Repository** の片方向依存になっている
- [ ] Service クラスは `@Service` + `@RequiredArgsConstructor`、フィールドは `private final`

なぜ: テストしやすさ・責務分離・将来の差し替え容易性。Controller に書くと `@WebMvcTest` で全部モックする必要が出てしまう。

### 1.2 トランザクション境界

- [ ] **更新系メソッドに `@Transactional` が付いている**（特に複数 entity を `saveAll` するもの）
- [ ] 参照系の `list()` / `get()` に `@Transactional(readOnly = true)` を付与
- [ ] アノテーションは Service 層に付ける（Controller には付けない）

なぜ: ロールバック保証。途中で例外が出ても DB が中間状態にならない。reorder のような複数更新は特に必須。

### 1.3 DTO / レスポンス契約

- [ ] **Entity を Controller から直接返していない**（レスポンス用 record / DTO に詰め替える）
- [ ] リクエスト DTO（`*Request`）でバリデーションアノテーションを使っている
- [ ] JSON フィールド名・型は API ドキュメントと一致する

なぜ: Entity 直返却は LAZY フェッチや内部フィールドの意図せぬ露出につながる。スキーマ進化と DB スキーマの分離。

### 1.4 例外ハンドリング

- [ ] **`@RestControllerAdvice` が以下を網羅している**
  - `MethodArgumentNotValidException` — 400 + フィールドエラー集約
  - `ResponseStatusException` — そのステータスコードを尊重
  - `NoSuchElementException` — 404
  - `HttpMessageNotReadableException` — 400（不正 JSON）
  - `Exception` — 500 フォールバック（**ログ出力必須**、スタックトレースは返さない）
- [ ] エラーレスポンスは統一形（このプロジェクトでは `{ "message": "..." }` または `{ "message": "...", "errors": { field: msg } }`）
- [ ] レスポンス形を変える時はフロント（`frontend/src/api/tasks.ts`）への影響を確認

### 1.5 バリデーション

- [ ] Controller の `@RequestBody` に `@Valid` が付いている
- [ ] DTO のフィールドに `@NotBlank` / `@Size` / `@Pattern` / `@Email` 等の Bean Validation アノテーションが付与
- [ ] enum 的な文字列フィールドは `@Pattern` で許容値を列挙

### 1.6 REST API 設計

- [ ] HTTP メソッドの意味が正しい（GET=取得 / POST=作成 / PUT=置換 / PATCH=部分更新 / DELETE=削除）
- [ ] ステータスコードが適切（201 Created / 204 No Content / 400 / 404 / 500）
- [ ] URI は名詞・複数形（`/api/tasks`、動詞は使わない。ただし操作的なものは `/tasks/reorder` のように許容）

### 1.7 フォーマット / ビルド

- [ ] `./gradlew clean build` が成功（`spotlessCheck` + `test` を含む）
- [ ] フォーマット崩れが残っていない → `./gradlew spotlessApply`

### 1.8 設定とシークレット

- [ ] `application.properties` にパスワード・APIキー等を平文で書いていない（環境変数化）
- [ ] CORS は許可オリジンを限定（ワイルドカード `*` は禁止）

---

## 2. Frontend（React + TypeScript）

### 2.1 型の健全性

- [ ] `any` を使っていない（やむを得ない箇所は `unknown` + 型ガードで対応）
- [ ] コンポーネントの props 型が定義されている
- [ ] API レスポンスは `types/` の型に寄せる

### 2.2 状態管理 / フック

- [ ] `useEffect` の依存配列が網羅されている（ESLint `react-hooks/exhaustive-deps` 違反なし）
- [ ] state 更新は関数形（`setX(prev => ...)`）を必要に応じて使い分けている
- [ ] CRUD ロジック等の再利用可能な処理は custom hook（`useTasks` 等）に抽出する候補
- [ ] 楽観的更新を入れた箇所では、API 失敗時のロールバック（`prev` を退避）が実装されている

### 2.3 描画 / a11y

- [ ] リスト描画の `key` は安定した一意 id（インデックスではなく `task.id`）
- [ ] クリッカブルな div に `role` / `tabIndex` / `onKeyDown` が付いている（キーボード操作可）
- [ ] フォーム要素に `label` が紐付いている

### 2.4 エラー / ローディング表現

- [ ] fetch のエラーが画面に表示される
- [ ] ローディング中の表示がある
- [ ] バリデーションエラー（Backend からの 400 + `errors`）がフォームに反映される

### 2.5 スタイル / 一貫性

- [ ] インラインスタイルと Tailwind が無秩序に混在していない
- [ ] 命名（コンポーネント PascalCase / 関数 camelCase / 型 PascalCase）が一貫

### 2.6 Lint / Format / Build

- [ ] `npm run lint` 成功
- [ ] `npm run format:check` 成功（崩れていれば `npm run format`）
- [ ] `npm run typecheck` 成功
- [ ] `npm run build` 成功

---

## 3. Docs（要件定義・画面設計・データ定義）

`docs/` 配下のドキュメントは「実装を正」とする。実装変更時は併せて更新する。

- [ ] **API 一覧（`docs/data-definition.md`）が `TaskController` のエンドポイントと一致**
  - 新規エンドポイントを追加したら、メソッド・パス・リクエスト/レスポンス例を追記
- [ ] **画面設計（`docs/screen-design.md`）の主要コンポーネント名 / UI 要素配置が実装と一致**
  - ボタン位置（例: ＋タスク追加は未着手カラム上部）
  - カード内要素（例: 🗑 ボタンは実装に無い）
- [ ] **ユースケース（`docs/use-cases.md`）の基本フローが実装挙動と一致**
- [ ] データモデル（`docs/data-definition.md` の ER 図・列挙値）が `Task.java` / migration と一致
- [ ] バリデーションルールが DTO の Bean Validation アノテーションと一致
- [ ] README から docs への相対リンクが壊れていない

確認方法:
```bash
grep -rn "data-definition\|screen-design\|use-cases" docs/ README.md
```

---

## 4. PR フロー（CLAUDE.md §1〜§7 準拠）

- [ ] Issue を立ててから着手している（`gh issue create`）
- [ ] ブランチ命名が `<type>/<issue#>-<short-desc>` に従っている
- [ ] コミットメッセージが Conventional Commits（`feat:` / `fix:` / `docs:` / `chore:` / `refactor:` / `test:`）+ 日本語本文
- [ ] PR 本文に `Closes #<issue#>` が含まれる
- [ ] PR テンプレ（`.github/pull_request_template.md`）に沿っている
- [ ] フォーマッタによる一括変更は **別コミット** に分けている（レビュー差分のノイズ削減）
- [ ] 1 PR = 1 トピック。複数トピックを混ぜていない
- [ ] マージは squash + branch 削除（`gh pr merge --squash --delete-branch`）

---

## レビューの進め方（推奨）

新規 PR・既存コードの全体監査どちらでも:

1. **PR 単位ならまず差分のスコープを確認** — 関係ないファイルが混ざっていれば指摘
2. **Backend / Frontend / Docs / PR フロー** の章を順番に当てる
3. 違反箇所は `file:line` 形式で列挙し、修正は影響範囲ごとに別 Issue/PR へ分割
4. 「指摘 → ユーザー判断 → 必要なら実装」の順で進める。勝手に大規模リファクタしない

## 関連

- プロジェクト規約: [CLAUDE.md](../../../CLAUDE.md)
- ポート規約: [enforce-default-ports](../enforce-default-ports/SKILL.md)
