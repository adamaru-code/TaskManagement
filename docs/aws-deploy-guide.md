[← README に戻る](../README.md)

# AWS デプロイ手順書（AWS CLI + Terraform / 初学者向け解説つき）

このドキュメントは、本プロジェクト（React + Spring Boot + PostgreSQL）を **AWS 上にデプロイ**するための手順書です。
AWS のマネジメントコンソール（Web 画面）を手で操作するのではなく、**AWS CLI** と **Terraform** を使って
「コマンドと設定ファイル」でインフラを作ります。

> **対象読者**: プログラミング初学者・実務未経験で、AWS / Terraform / IaC を初めて触る人。
> そのため、手順だけでなく **「そもそも何なのか」の解説**を多めに入れています。
> すでに知っている節は読み飛ばして構いません。

---

## 目次

- [0. このドキュメントのゴール](#0-このドキュメントのゴール)
- [1. まず用語を理解する（IaC / Terraform / AWS / CLI）](#1-まず用語を理解する)
- [2. 今回作る AWS 構成（全体像）](#2-今回作る-aws-構成全体像)
- [3. 料金の話（最初に絶対読む）](#3-料金の話最初に絶対読む)
- [4. 事前準備：道具をそろえる](#4-事前準備道具をそろえる)
- [5. AWS アカウントと認証の設定](#5-aws-アカウントと認証の設定)
- [6. Terraform の基本概念](#6-terraform-の基本概念)
- [7. デプロイ全体の流れ](#7-デプロイ全体の流れ)
- [8. Terraform でインフラを作る（コード解説つき）](#8-terraform-でインフラを作るコード解説つき)
- [9. アプリを EC2 / S3 に配置する](#9-アプリを-ec2--s3-に配置する)
- [10. 動作確認](#10-動作確認)
- [11. 後始末：コストを止める（超重要）](#11-後始末コストを止める超重要)
- [12. セキュリティの注意点](#12-セキュリティの注意点)
- [13. よくあるトラブルと対処](#13-よくあるトラブルと対処)
- [14. 用語ミニ辞典](#14-用語ミニ辞典)

---

## 0. このドキュメントのゴール

読み終えて手を動かすと、最終的に次の状態になります。

- インターネット上の URL（CloudFront のアドレス）にアクセスすると、タスク管理アプリが表示される
- 画面の操作（タスク作成・編集・削除）が、AWS 上の Spring Boot + PostgreSQL で動く
- そのインフラ一式が、**Terraform の設定ファイルとコマンドだけ**で作られ、`terraform destroy` 一発で消せる

「画面をポチポチ手作業」ではなく「**コードでインフラを再現できる**」状態を目指します。これが後で説明する **IaC** の考え方です。

> このドキュメントは **手順書（解説編）** です。実際に動く Terraform ファイル一式（`infra/` 配下）の生成は次の段階で行います。
> ここではまず「何を・なぜ・どういう順番でやるか」を完全に理解することを目的にします。

---

## 1. まず用語を理解する

ここでつまずく人が多いので、最初に言葉を整理します。

### 1-1. インフラ（インフラストラクチャ）とは

アプリを動かすための「土台」のことです。具体的には次のようなもの。

- アプリを動かす**サーバー**（コンピューター）
- データを保存する**データベース**
- 外部とつなぐ**ネットワーク**（IP アドレス、ファイアウォールなど）

これまでローカル（自分の PC）で `./gradlew bootRun` や `docker compose up` で動かしていたものを、
**クラウド上（AWS）のコンピューターに置き換える**のがデプロイです。

### 1-2. AWS とは

**Amazon Web Services** の略。Amazon が提供する「**クラウド**」サービスです。
クラウドとは、ざっくり言うと「**Amazon のデータセンターにあるコンピューターを、必要なときに借りる**」仕組み。

自分でサーバー機を買って自宅に置く代わりに、AWS の画面やコマンドから「サーバー1台ください」と言うと、
数十秒で使えるサーバーが用意されます。使った分だけ料金を払う「従量課金」が基本です。

AWS には200以上のサービスがありますが、今回使う主要なものだけ覚えれば十分です。

| サービス | 読み | 役割（今回の用途） |
|---|---|---|
| **EC2** | イーシーツー | 仮想サーバー（コンピューター）。ここに Spring Boot と PostgreSQL を載せる |
| **S3** | エススリー | ファイル置き場。React のビルド済みファイル（HTML/JS/CSS）を置く |
| **CloudFront** | クラウドフロント | CDN。世界中に配信＋HTTPS 化。アプリの入口になる |
| **VPC** | ブイピーシー | 仮想ネットワーク。EC2 を置く「自分専用の区画」 |
| **Security Group** | セキュリティグループ | ファイアウォール。どのポートへの通信を許可するか決める |
| **IAM** | アイアム | 権限管理。「誰が何をしてよいか」を決める。CLI 認証もここ |

> これらの単語は [14. 用語ミニ辞典](#14-用語ミニ辞典) にもまとめてあります。分からなくなったら戻ってください。

### 1-3. IaC（Infrastructure as Code）とは

**Infrastructure as Code** ＝「**インフラをコード（設定ファイル）で管理する**」考え方です。

これまで、サーバーを作るには AWS の Web 画面（マネジメントコンソール）で

1. EC2 の画面を開いて
2. 「インスタンス作成」ボタンを押して
3. OS を選んで、サイズを選んで、ネットワークを選んで……

と**手作業でポチポチ**するのが普通でした。これには問題があります。

- **再現できない**: 同じ環境をもう一度作るとき、手順を覚えていないと作れない
- **記録が残らない**: 「誰がいつ何を変えたか」が分からない
- **ミスしやすい**: 設定を1つ押し間違えると動かない
- **共有しづらい**: 他の人に「こう作って」と口頭で伝えるのが大変

IaC では、これを**テキストファイル（コード）に書く**ことで解決します。

```
「EC2 を1台、サイズは t3.micro、このネットワークに置く」
   ↓ をコードに書いておく
「terraform apply」コマンド1つで、その通りのインフラが作られる
```

メリット：

- **再現性**: 同じコードを実行すれば、何度でも同じ環境が作れる
- **バージョン管理**: Git で管理でき、変更履歴が残る（このプロジェクトと同じ流儀！）
- **レビューできる**: インフラの変更も Pull Request でレビューできる
- **使い捨てできる**: いらなくなったらコマンド1つで全部消せる（＝**コストを止めやすい**）

アプリのコードを Git で管理するのと**まったく同じ発想**を、サーバーやネットワークにも適用する、と理解してください。

### 1-4. Terraform とは

IaC を実現する**ツールの1つ**が **Terraform**（テラフォーム）です。HashiCorp 社が作っています。

- `.tf` という拡張子のファイルに「こういうインフラがほしい」と宣言的に書く
- `terraform apply` を実行すると、Terraform が AWS に対して「この通りに作って」と API で指示してくれる
- AWS だけでなく Google Cloud や Azure など多くのクラウドに対応している（今回は AWS だけ使う）

**「宣言的」**がポイントです。「ボタンを押す手順」を書くのではなく、「**最終的にこうなっていてほしい状態**」を書きます。
Terraform が現状と見比べて、足りないものを作り、余分なものを消してくれます。

似たツールに AWS 公式の **CloudFormation** もありますが、Terraform の方が学習情報が多く、他クラウドでも使えるため、今回は Terraform を採用します。

### 1-5. AWS CLI とは

**CLI** ＝ Command Line Interface（コマンドで操作する方式）。
**AWS CLI** は、AWS を**ターミナルのコマンドから操作する**ための公式ツールです。

```bash
# 例: S3 バケットの一覧を表示する
aws s3 ls
```

今回 AWS CLI は主に次の2つに使います。

1. **認証情報の設定**（`aws configure`）— Terraform が AWS にアクセスするための鍵を登録する
2. **ファイルのアップロード**（`aws s3 sync`）— React のビルド結果を S3 に送る

> **Terraform と AWS CLI の役割分担**
> - **Terraform** = インフラ（箱）を作る：EC2、S3 バケット、ネットワークなど
> - **AWS CLI** = 中身を出し入れする＋認証の土台：S3 にファイルを置く、ログを見る、など
> 認証情報（アクセスキー）は AWS CLI で設定し、Terraform もそれを共有して使います。

---

## 2. 今回作る AWS 構成（全体像）

「最安・学習向き」の構成です。サーバーは EC2 を **1台だけ**使い、その中で Docker Compose を使って
Spring Boot と PostgreSQL を**まとめて**動かします（ローカルの `docker-compose.yml` と同じ発想）。

```
                          インターネット
                               │
                        ┌──────▼───────┐
   ユーザーのブラウザ ──▶│  CloudFront  │  ← アプリの入口（HTTPS）
                        │   (CDN)      │
                        └──┬───────┬───┘
            「/api/*」以外 │       │ 「/api/*」へのリクエスト
            （HTML/JS/CSS）│       │ （API 呼び出し）
                     ┌─────▼──┐  ┌─▼──────────────────────────┐
                     │   S3   │  │          EC2 (1台)         │
                     │ React  │  │  ┌──────────┐ ┌──────────┐ │
                     │ 静的   │  │  │ Spring   │ │PostgreSQL│ │
                     │ ファイル│  │  │ Boot     │→│ (DB)     │ │
                     └────────┘  │  │ :8080    │ │ :5432    │ │
                                 │  └──────────┘ └──────────┘ │
                                 │   Docker Compose で起動     │
                                 └────────────────────────────┘
```

### なぜこの構成なのか（設計の理由）

**ポイント1：フロントは「相対パス」で API を呼んでいる**

現在のフロントは [frontend/src/api/tasks.ts](../frontend/src/api/tasks.ts) で `fetch('/api/tasks')` のように
**相対パス** `/api/...` を使っています。ドメイン名（`http://...`）を書いていません。

ローカルでは Vite のプロキシ（[frontend/vite.config.ts](../frontend/vite.config.ts)）が `/api → localhost:8080` に転送しています。

**ポイント2：CloudFront で「同じドメイン」にまとめる**

そこで本番では、CloudFront に **2つの配信元（オリジン）**をぶら下げます。

- `/api/*` へのアクセス → **EC2**（Spring Boot）に転送
- それ以外（`/`, `/assets/*` など）→ **S3**（React の静的ファイル）に転送

こうするとブラウザから見ると**すべてが CloudFront の1つのドメイン**から配信されているように見えます。すると…

- **CORS 設定が不要**になる（同一オリジンだから）。今 `WebConfig.java` が `localhost:5173` だけ許可しているのを本番用に直す必要がない
- **フロントのコード変更が不要**（相対パスのまま動く）
- **HTTPS はブラウザ↔CloudFront 間だけ**で済む（CloudFront↔EC2 は HTTP で OK。EC2 に証明書を入れる手間がない）

初学者がいちばんつまずく「CORS」「HTTPS 証明書」を**設計で回避**できるのが、この構成を選ぶ理由です。

> **将来の拡張**: 本番運用に近づけるなら、PostgreSQL を EC2 から切り出して **RDS**（AWS のマネージドDB）にする、
> バックエンドを **ECS Fargate** でコンテナ運用する、といった発展があります。今回はまず「動かして全体像をつかむ」を優先します。

---

## 3. 料金の話（最初に絶対読む）

> ⚠️ **初学者がいちばん怖いのは「気づいたら高額請求」です。ここは飛ばさないでください。**

### 3-1. 従量課金の仕組み

AWS は**使った分だけ課金**されます。サーバーを立てっぱなしにすると、寝ている間も課金が続きます。
逆に言えば、**使い終わったら消せば課金は止まります**（Terraform なら `terraform destroy` 一発）。

### 3-2. 無料枠（Free Tier）

新規 AWS アカウントには**12ヶ月の無料枠**などがあります（内容は変わるので公式で要確認）。
今回の構成で関係しそうなもの（目安）：

- **EC2**: `t2.micro` または `t3.micro` が月 750 時間まで無料（12ヶ月）
- **S3**: 5GB のストレージ、一定のリクエスト数まで無料
- **CloudFront**: 毎月一定の転送量まで無料

> 無料枠の最新内容は必ず公式で確認: https://aws.amazon.com/jp/free/
> 無料枠を**超えた分**や、無料枠対象外のサービスは課金されます。「無料枠だから絶対タダ」ではありません。

### 3-3. 必ず最初にやる：予算アラートの設定

**何よりも先に**、「一定額を超えたらメールで知らせる」設定をしておきます。これが安全ベルトです。

AWS CLI でも設定できますが、初回はコンソールが分かりやすいので**ここだけ手動でも OK**です。

1. AWS コンソール → 「Billing and Cost Management」→「Budgets」
2. 「予算を作成」→ テンプレート「ゼロ支出予算」または「月次コスト予算」を選ぶ
3. 金額（例: **5 USD**）とメールアドレスを設定

これで、想定外の課金が発生し始めても早期に気づけます。

### 3-4. 使い終わったら消す習慣

学習目的なら、**触らない時間は `terraform destroy` で消す**のがいちばん安全＆安上がりです。
IaC なら、また使いたくなったら `terraform apply` で**まったく同じ環境を再生**できます。これが IaC の強みです。

---

## 4. 事前準備：道具をそろえる

自分の Mac に次の3つをインストールします（このプロジェクトは macOS 前提）。

### 4-1. Homebrew（パッケージ管理ツール）

すでに入っていることが多いです。確認：

```bash
brew --version
```

入っていなければ公式の手順でインストール: https://brew.sh/

### 4-2. AWS CLI のインストール

```bash
brew install awscli
aws --version   # aws-cli/2.x.x ... と表示されれば OK
```

### 4-3. Terraform のインストール

```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
terraform -version   # Terraform v1.x.x と表示されれば OK
```

### 4-4. （任意）jq

JSON を見やすくする道具。あると便利です。

```bash
brew install jq
```

---

## 5. AWS アカウントと認証の設定

ここが「初めて AWS を触る人」の最初の関門です。順番にやれば大丈夫です。

### 5-1. AWS アカウントを作る

まだ持っていなければ作成します（メールアドレスとクレジットカードが必要）。

1. https://aws.amazon.com/jp/ → 「アカウントを作成」
2. メール・パスワード・支払い情報を登録
3. 本人確認（電話 or SMS）

> 登録直後にやることは [3-3. 予算アラートの設定](#3-3-必ず最初にやる予算アラートの設定)。先にやっておくと安心です。

### 5-2. 「ルートユーザー」と「IAM ユーザー」の違い（重要）

- **ルートユーザー**: アカウント作成時のメアドでログインする、**最強の権限**を持つアカウント。
  何でもできてしまうため、**日常作業では使わない**のが鉄則。
- **IAM ユーザー**: ルートユーザーが作る「作業用アカウント」。必要な権限だけを与える。
  **CLI / Terraform で使うのはこちら**。

たとえるなら、ルートユーザーは「家の所有者・銀行の実印」、IAM ユーザーは「使う分だけ渡す合鍵」です。

### 5-3. CLI 用の認証情報を発行する

CLI / Terraform が AWS にアクセスするには「**アクセスキー**」という鍵が必要です。
これは「アクセスキー ID」と「シークレットアクセスキー」のペアで、いわば**API 用のユーザー名とパスワード**です。

> 🔰 **推奨は IAM Identity Center（旧 SSO）ですが、初学者の最短ルートとして、まずは「IAM ユーザー＋アクセスキー」で説明します。**
> 学習が終わったら、より安全な IAM Identity Center への移行も検討してください。

**手順（コンソールで実施）:**

1. コンソール → 「IAM」→「ユーザー」→「ユーザーを作成」
2. ユーザー名（例: `terraform-deployer`）を入力
3. 権限: 学習用途なら、いったん `AdministratorAccess` ポリシーを付与（※本来は最小権限が望ましい。下の注を参照）
4. 作成後、そのユーザーの「セキュリティ認証情報」タブ →「アクセスキーを作成」
5. 用途で「コマンドラインインターフェイス（CLI）」を選ぶ
6. 表示された **アクセスキー ID** と **シークレットアクセスキー** を控える
   - ⚠️ シークレットは**この画面でしか見られません**。閉じる前に必ずコピー。

> **権限について**: `AdministratorAccess` は「何でもできる」強い権限です。学習中は楽ですが、
> 実務では「EC2 と S3 だけ触れる」のように**必要最小限**に絞るのがセオリー（最小権限の原則）。
> まずは動かすことを優先し、慣れたら絞り込みましょう。

### 5-4. アクセスキーを AWS CLI に登録する

控えたキーをローカルに設定します。**プロファイル名を付けて**管理すると、後で複数アカウントを扱うとき楽です。

```bash
aws configure --profile taskmanagement
```

対話で次を聞かれます。

```
AWS Access Key ID     : （控えたアクセスキー ID を貼る）
AWS Secret Access Key : （控えたシークレットを貼る）
Default region name   : ap-northeast-1      ← 東京リージョン
Default output format : json
```

> **リージョン**とは AWS のデータセンターがある「地域」のこと。日本のユーザーが使うなら **`ap-northeast-1`（東京）** が基本です。

設定は次のファイルに保存されます（中身を直接見たいとき用）。

- `~/.aws/credentials` … アクセスキー（**秘密。絶対に Git に入れない**）
- `~/.aws/config` … リージョンなどの設定

### 5-5. 認証できているか確認する

```bash
aws sts get-caller-identity --profile taskmanagement
```

次のように自分のユーザー情報（Account / Arn）が JSON で返れば成功です。

```json
{
  "UserId": "AIDA...",
  "Account": "123456789012",
  "Arn": "arn:aws:iam::123456789012:user/terraform-deployer"
}
```

エラーになる場合は [13. よくあるトラブルと対処](#13-よくあるトラブルと対処) を参照。

### 5-6. Terraform にプロファイルを使わせる

ターミナルで次の環境変数をセットしておくと、Terraform はこのプロファイルの認証情報を使います。

```bash
export AWS_PROFILE=taskmanagement
export AWS_REGION=ap-northeast-1
```

> 毎回打つのが面倒なら、`direnv` などのツールでディレクトリごとに自動設定する方法もあります（任意）。

---

## 6. Terraform の基本概念

実際にコードを書く前に、Terraform の「3つの動詞」と「状態ファイル」を理解しておきます。

### 6-1. 3つの基本コマンド

```bash
terraform init      # ① 初期化。必要なプラグイン（AWS 用）をダウンロード。最初に1回
terraform plan      # ② 計画。これから何を作る/変える/消すかを「実行前に」表示（まだ作らない）
terraform apply     # ③ 適用。plan の内容を実際に AWS に反映（ここで初めて課金対象が生まれる）
```

そして使い終わったら：

```bash
terraform destroy   # 作ったものを全部削除（＝課金を止める）
```

`plan` で**必ず内容を確認してから** `apply` する、というのが安全な進め方です。

### 6-2. 状態ファイル（tfstate）

Terraform は「自分が今、AWS に何を作ったか」を **`terraform.tfstate`** というファイルに記録します。
これにより「コードと実物の差分」を計算できます。

- このファイルは**自動生成される**ので、自分で編集しない
- **秘密情報（DBパスワード等）が平文で含まれることがある**ため、**Git に入れない**（`.gitignore` 必須）
- チームで使うときは S3 などに置いて共有する（今回は個人学習なのでローカルでOK）

### 6-3. tf ファイルの基本構造

Terraform のコードは「**ブロック**」の集まりです。よく使うのは次の4種類。

```hcl
# ① provider: どのクラウドを使うか
provider "aws" {
  region = "ap-northeast-1"
}

# ② resource: 作りたいインフラ1個1個（これがメイン）
resource "aws_instance" "backend" {
  ami           = "ami-xxxxxxxx"   # OS のイメージ
  instance_type = "t3.micro"       # サーバーのサイズ
}

# ③ variable: 外から渡す値（パスワードや設定）
variable "db_password" {
  type      = string
  sensitive = true
}

# ④ output: 作成後に知りたい値（EC2 の IP アドレスなど）を表示
output "backend_public_ip" {
  value = aws_instance.backend.public_ip
}
```

> `.tf` ファイルの言語は **HCL（HashiCorp Configuration Language）**。JSON に似ていますが、人が読み書きしやすい形式です。

---

## 7. デプロイ全体の流れ

ここまでの準備ができたら、本番デプロイは次の順序で進みます。全体像を先に掴んでおきましょう。

```
【準備フェーズ】
 1. AWS CLI 認証設定（5章）                ← 一度だけ
 2. 予算アラート設定（3章）                ← 一度だけ

【ビルドフェーズ】
 3. フロントをビルド    : cd frontend && npm run build   → frontend/dist が出来る
 4. バックエンドをビルド : cd backend && ./gradlew build  → JAR が出来る
                        （EC2 上で Docker ビルドする方式なら、ソースを渡すだけでも可）

【インフラ作成フェーズ（Terraform）】
 5. terraform init                          ← 一度だけ
 6. terraform plan                          ← 作る前に確認
 7. terraform apply                         ← S3 / EC2 / CloudFront などが出来る

【配置フェーズ】
 8. S3 に React のビルド結果をアップロード   : aws s3 sync
 9. EC2 に backend + PostgreSQL を起動       : Docker Compose

【確認フェーズ】
10. CloudFront の URL にアクセスして動作確認

【後始末】
11. 使わないときは terraform destroy で消す（課金停止）
```

> このうち **5〜7（Terraform 部分）** の実ファイル（`infra/main.tf` など）は、次の段階で別途生成します。
> 本ドキュメントでは次章で「どんな内容になるか」を解説します。

---

## 8. Terraform でインフラを作る（コード解説つき）

ここでは、実際に作る予定の Terraform 構成を**解説**します（コードは抜粋・イメージです）。
このプロジェクトでは `infra/` ディレクトリにファイルを置く想定です。

```
infra/
├── main.tf          … プロバイダ設定とメインのリソース
├── variables.tf     … 外から渡す値（DBパスワード、キーペア名など）
├── outputs.tf       … 作成後に表示したい値（CloudFront URL など）
├── terraform.tfvars … 変数の実際の値（※秘密を含むので Git に入れない）
└── .gitignore       … tfstate / tfvars を除外
```

### 8-1. プロバイダとネットワーク

```hcl
# main.tf（抜粋・イメージ）

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-northeast-1"   # 東京
}
```

ネットワーク（VPC）は、シンプルにするため**アカウント既定の「デフォルト VPC」**を使う想定です。
（学習段階では自前 VPC を一から組むより、まず動かすことを優先します。）

### 8-2. EC2（バックエンド + DB）

```hcl
# セキュリティグループ：通信の許可ルール（ファイアウォール）
resource "aws_security_group" "backend" {
  name = "taskmanagement-backend"

  # CloudFront からの API アクセス用に 8080 を許可
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]   # 学習用。本番は CloudFront の IP 範囲に絞るのが望ましい
  }

  # 自分が SSH（22番）で入るための許可（自分の IP だけに絞ると安全）
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["<自分のグローバルIP>/32"]
  }

  # 外向き通信は全部許可（Docker イメージのダウンロード等に必要）
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# EC2 本体
resource "aws_instance" "backend" {
  ami                    = "ami-xxxxxxxx"   # Amazon Linux 2023 などの ID
  instance_type          = "t3.micro"       # 無料枠を狙うサイズ
  vpc_security_group_ids = [aws_security_group.backend.id]
  key_name               = var.key_pair_name # SSH 用の鍵

  # user_data: 起動時に自動実行するスクリプト
  # （Docker をインストール → アプリを docker compose up する処理を書く）
  user_data = file("${path.module}/setup.sh")
}
```

> **`user_data`** は「EC2 が起動した瞬間に1回だけ自動実行されるスクリプト」です。
> ここに「Docker を入れて、リポジトリを取得して、`docker compose up -d` する」処理を書いておくと、
> EC2 が立ち上がると同時にアプリが起動します。手作業 SSH を減らせます。

### 8-3. S3（フロントの静的ファイル置き場）

```hcl
resource "aws_s3_bucket" "frontend" {
  bucket = "taskmanagement-frontend-<世界で一意な名前>"
}
```

> S3 のバケット名は**世界中で重複できない**ので、自分の名前や日付を入れてユニークにします。
> 直接公開はせず、CloudFront 経由でのみアクセスさせる設定（OAC）にします（安全＆HTTPS のため）。

### 8-4. CloudFront（入口・2つのオリジン）

ここが今回の構成の肝です。**2つの配信元（オリジン）**を持たせ、パスで振り分けます。

```hcl
resource "aws_cloudfront_distribution" "main" {
  # オリジン1: S3（静的ファイル）
  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "s3-frontend"
    # OAC で CloudFront 経由のみ許可
  }

  # オリジン2: EC2（API）
  origin {
    domain_name = aws_instance.backend.public_dns
    origin_id   = "ec2-backend"
    custom_origin_config {
      http_port              = 8080
      origin_protocol_policy = "http-only"   # CloudFront→EC2 は HTTP
      # ...
    }
  }

  # 既定の振り分け先 = S3（HTML/JS/CSS）
  default_cache_behavior {
    target_origin_id       = "s3-frontend"
    viewer_protocol_policy = "redirect-to-https"  # ユーザーには HTTPS を強制
  }

  # /api/* だけ EC2 に振り分け
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    target_origin_id       = "ec2-backend"
    viewer_protocol_policy = "redirect-to-https"
    # API はキャッシュしない設定にする
  }
}
```

このルーティングにより、[2章](#なぜこの構成なのか設計の理由)で説明した「同一オリジン化」が実現します。

### 8-5. outputs（作成後に知りたい値）

```hcl
# outputs.tf
output "cloudfront_url" {
  value = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "ec2_public_ip" {
  value = aws_instance.backend.public_ip
}
```

`terraform apply` の最後にこれらが表示され、「どの URL にアクセスすればいいか」がすぐ分かります。

---

## 9. アプリを EC2 / S3 に配置する

Terraform で「箱」ができたら、中身（アプリ）を入れます。

### 9-1. フロント：ビルドして S3 へ

```bash
cd frontend
npm install
npm run build          # frontend/dist にビルド結果が出来る

# S3 にアップロード（バケット名は Terraform の output などで確認）
aws s3 sync dist/ s3://taskmanagement-frontend-<あなたのバケット名>/ \
  --delete --profile taskmanagement
```

`--delete` は「S3 側にあってローカルにないファイルを消す」オプション。古いファイルが残らず安全です。

### 9-2. バックエンド：EC2 で Docker Compose 起動

本番用の `docker-compose.yml` には、ローカル用（[docker-compose.yml](../docker-compose.yml)）に
**Spring Boot のコンテナを追加**したものを使います。イメージとしては：

```yaml
# 本番用 compose のイメージ（PostgreSQL + backend）
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: taskmanagement
      POSTGRES_USER: taskmanagement
      POSTGRES_PASSWORD: ${DB_PASSWORD}   # 固定値ではなく環境変数で渡す
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend          # もしくはビルド済み JAR を使う Dockerfile
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/taskmanagement
      SPRING_DATASOURCE_USERNAME: taskmanagement
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
    ports:
      - "8080:8080"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

> ローカルの `application.properties` は `localhost:5432` 固定ですが、本番では Spring Boot の
> **環境変数オーバーライド**（`SPRING_DATASOURCE_URL` など）で接続先を上書きします。
> コンテナ間では `postgres` というサービス名でホスト解決できるため、`jdbc:postgresql://postgres:5432/...` になります。
> パスワードは `docker-compose.yml` に直書きせず、環境変数（`DB_PASSWORD`）で渡します。

EC2 への配置は、[8-2](#8-2-ec2バックエンド--db) の `user_data` スクリプトで自動化するのが理想です。
最初は SSH で手動起動して確認 → 慣れたら自動化、という順でも OK です。

```bash
# 手動で入る場合（鍵ファイルは Terraform で作った key pair）
ssh -i ~/.ssh/taskmanagement.pem ec2-user@<EC2のIP>
# EC2 内で
docker compose up -d
```

---

## 10. 動作確認

1. `terraform apply` の output に出た **CloudFront の URL**（`https://xxxx.cloudfront.net`）をブラウザで開く
2. タスク管理アプリの画面が表示される（＝S3 のフロントが配信されている）
3. タスクを作成・編集・削除してみる（＝`/api/*` が EC2 の Spring Boot に届き、PostgreSQL に保存される）
4. ページを再読み込みしてもデータが残っていれば、DB 永続化まで成功

> CloudFront は世界中に配信を広げるため、`apply` 直後は反映に**数分〜十数分**かかることがあります。
> すぐ表示されなくても少し待ってから再確認してください。

---

## 11. 後始末：コストを止める（超重要）

学習が終わったら、または今日はもう触らないなら、**必ず**インフラを消します。

```bash
cd infra
terraform destroy        # 「本当に消す？」と聞かれるので yes
```

これで EC2 / S3 / CloudFront などが削除され、**課金が止まります**。
また使いたくなったら `terraform apply` で**同じ環境を再生**できます。これが IaC のいちばんの恩恵です。

> ⚠️ `terraform destroy` で消えるのは Terraform が作ったものだけです。
> 手動でコンソールから作った物は残ることがあるので、なるべく**全部 Terraform で作る**のが管理しやすいです。
> 心配なら、後日 [3-3](#3-3-必ず最初にやる予算アラートの設定) の予算アラートで請求がゼロに戻っているか確認しましょう。

---

## 12. セキュリティの注意点

初学者がやりがちな事故を防ぐためのチェックリストです。

- ❌ **アクセスキーを Git にコミットしない**
  - `~/.aws/credentials` や `terraform.tfvars`、`*.tfstate` は**絶対にコミットしない**
  - `infra/.gitignore` に `*.tfstate`, `*.tfvars`, `.terraform/` を必ず入れる
  - もし誤って push したら、**すぐにそのアクセスキーを無効化**して作り直す（履歴から消すだけでは不十分）
- ❌ **DB パスワードをコードに直書きしない** → `variable` + 環境変数で渡す
- ✅ **SSH（22番）は自分の IP だけに絞る**（`0.0.0.0/0` で全開放しない）
- ✅ **ルートユーザーで日常作業しない**（IAM ユーザーを使う）
- ✅ **ルートユーザーに MFA（多要素認証）を設定**しておく
- ✅ 慣れたら IAM の権限を**最小限**に絞る（`AdministratorAccess` を卒業する）

---

## 13. よくあるトラブルと対処

| 症状 | 原因・対処 |
|---|---|
| `aws sts get-caller-identity` で `InvalidClientTokenId` | アクセスキーが間違っている／無効化されている。`aws configure --profile ...` で入れ直す |
| `Unable to locate credentials` | プロファイル指定漏れ。`--profile taskmanagement` を付ける or `export AWS_PROFILE=...` |
| `terraform apply` で `UnauthorizedOperation` | IAM ユーザーの権限不足。ポリシーを確認（学習中は `AdministratorAccess`） |
| S3 バケット作成で `BucketAlreadyExists` | バケット名は世界で一意。名前を変える（日付や乱数を足す） |
| CloudFront の URL を開いても古い画面 | CloudFront のキャッシュ。反映待ち（数分）or キャッシュ無効化（invalidation） |
| API（タスク操作）だけ失敗する | `/api/*` のオリジン設定 or EC2 のセキュリティグループ（8080）を確認 |
| EC2 に SSH できない | セキュリティグループの 22番 / 自分の IP / 鍵ファイルのパスと権限（`chmod 400`）を確認 |
| 課金が止まらない | `terraform destroy` 済みか、コンソールで Billing を確認。手動作成物が残っていないか確認 |

---

## 14. 用語ミニ辞典

| 用語 | ひとことで言うと |
|---|---|
| **IaC** | インフラをコード（設定ファイル）で管理する考え方 |
| **Terraform** | IaC を実現するツール。`.tf` ファイルにインフラを書く |
| **HCL** | Terraform の設定を書く言語 |
| **provider** | Terraform が操作する対象（今回は `aws`） |
| **resource** | 作りたいインフラ1個（EC2、S3 など） |
| **tfstate** | Terraform が「今 AWS に何を作ったか」を記録するファイル。Git に入れない |
| **AWS CLI** | AWS をコマンドで操作する公式ツール |
| **リージョン** | AWS のデータセンターがある地域（東京＝`ap-northeast-1`） |
| **IAM** | AWS の権限管理。「誰が何をしてよいか」 |
| **IAM ユーザー** | 作業用アカウント。CLI/Terraform はこれを使う |
| **アクセスキー** | API 用のユーザー名＋パスワード（ID＋シークレット） |
| **EC2** | 仮想サーバー（クラウド上のコンピューター1台） |
| **AMI** | EC2 の OS イメージ（Amazon Linux など） |
| **インスタンスタイプ** | EC2 のサイズ（`t3.micro` など） |
| **S3** | ファイル置き場（オブジェクトストレージ） |
| **バケット** | S3 の入れ物。名前は世界で一意 |
| **CloudFront** | CDN。世界配信＋HTTPS。今回はアプリの入口 |
| **オリジン** | CloudFront が中身を取りに行く先（S3 や EC2） |
| **VPC** | 自分専用の仮想ネットワーク区画 |
| **セキュリティグループ** | EC2 のファイアウォール。許可するポートを決める |
| **CORS** | 別ドメイン間通信の制限。今回は同一オリジン化で回避 |

---

## 次のステップ

このドキュメントで全体像を理解したら、次は **`infra/` 配下に実際に動く Terraform ファイル一式を生成**します
（別 Issue で対応）。その際、本ドキュメントの 8章の構成をベースに、`main.tf` / `variables.tf` / `outputs.tf` /
EC2 の `user_data`（`setup.sh`）/ 本番用 `docker-compose.prod.yml` を整備します。

---

[← README に戻る](../README.md)
