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
- [9. アプリを EC2 に配置する](#9-アプリを-ec2-に配置する)
- [10. 動作確認](#10-動作確認)
- [11. 後始末：コストを止める（超重要）](#11-後始末コストを止める超重要)
- [12. セキュリティの注意点](#12-セキュリティの注意点)
- [13. よくあるトラブルと対処](#13-よくあるトラブルと対処)
- [14. 用語ミニ辞典](#14-用語ミニ辞典)

---

## 0. このドキュメントのゴール

読み終えて手を動かすと、最終的に次の状態になります。

- **EC2 の URL（`http://<EC2のIP>/`）に自分の PC からアクセスすると、タスク管理アプリが表示される**
- 画面の操作（タスク作成・編集・削除）が、AWS 上の Spring Boot + RDS(PostgreSQL) で動く
- そのインフラ一式が、**Terraform の設定ファイルとコマンドだけ**で作られ、`terraform destroy` 一発で消せる

> **この手順書の構成について**: 当初は CloudFront + S3 を使う構成を想定していましたが、
> 「**自分の PC からのみアクセスを許可したい**」という要件に合わせ、CloudFront / S3 を使わず
> **EC2 に nginx を同居**させる構成（構成 B）に変更しました。詳しくは [2 章](#2-今回作る-aws-構成全体像) を参照。
> CloudFront を使わない代わり、HTTPS は未対応（平文 HTTP）です。

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
| **EC2** | イーシーツー | 仮想サーバー（コンピューター）。ここに nginx と Spring Boot を載せる |
| **RDS** | アールディーエス | マネージドDB。PostgreSQL を AWS にお任せ運用する（Stage 3 で追加済み） |
| **VPC** | ブイピーシー | 仮想ネットワーク。EC2 / RDS を置く「自分専用の区画」 |
| **Security Group** | セキュリティグループ | ファイアウォール。どのポートへの通信を許可するか決める |
| **IAM** | アイアム | 権限管理。「誰が何をしてよいか」を決める。CLI 認証もここ |

> **nginx（エンジンエックス）** は AWS のサービスではなく、EC2 の中に入れる Web サーバー / リバースプロキシです。
> 今回はこれを「アプリの入口」にして、React の静的ファイル配信と `/api` の中継を担わせます。
> 当初案にあった **S3 / CloudFront は今回は使いません**（[2 章](#2-今回作る-aws-構成全体像)参照）。

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

今回 AWS CLI は主に次に使います。

1. **認証情報の設定**（`aws configure`）— Terraform が AWS にアクセスするための鍵を登録する
2. **動作確認やログ確認**（`aws sts get-caller-identity` など）

> **Terraform と AWS CLI の役割分担**
> - **Terraform** = インフラ（箱）を作る：EC2、RDS、ネットワークなど
> - **AWS CLI** = 認証の土台＋運用補助：認証設定、ログ確認など
> 認証情報（アクセスキー）は AWS CLI で設定し、Terraform もそれを共有して使います。
>
> なお、アプリ本体（React のビルド結果や Spring Boot の JAR）の EC2 への配置は、
> S3 ではなく **`scp`（SSH 経由のファイル転送）**で行います（[9 章](#9-アプリを-ec2-に配置する)）。

---

## 2. 今回作る AWS 構成（全体像）

「最安・学習向き」かつ「**自分の PC からのみアクセスできる**」構成です。
サーバーは EC2 を **1台だけ**使い、その中に **nginx と Spring Boot を同居**させます。
DB は Stage 3 で追加した **RDS(PostgreSQL)** を使います。

```
   あなたのPC
      │ HTTP（許可元は自分のグローバルIPのみ）
      ▼
 ┌─────────────────────────────────────┐
 │            EC2 (1台)                 │
 │  ┌───────────┐                       │
 │  │  nginx    │ :80  ← アプリの入口    │
 │  │           │                       │
 │  │  /api/*   ├──proxy──▶ Spring Boot │──▶ RDS(PostgreSQL)
 │  │           │          :8080(内部)  │      :5432
 │  │  /  その他 │                       │
 │  │  → React  │  静的ファイルを配信    │
 │  │   静的    │  (/usr/share/nginx/html)
 │  └───────────┘                       │
 └─────────────────────────────────────┘
```

- 外から入れるのは **80番(nginx)だけ**。8080(Spring Boot)は nginx が内部 localhost で中継するだけで**外部公開しない**。
- 80番の許可元は **自分のグローバルIPのみ**（誰でもアクセスできる状態にはしない）。

### なぜこの構成なのか（設計の理由）

**ポイント1：フロントは「相対パス」で API を呼んでいる**

現在のフロントは [frontend/src/api/tasks.ts](../frontend/src/api/tasks.ts) で `fetch('/api/tasks')` のように
**相対パス** `/api/...` を使っています。ドメイン名（`http://...`）を書いていません。

ローカルでは Vite のプロキシ（[frontend/vite.config.ts](../frontend/vite.config.ts)）が `/api → localhost:8080` に転送しています。

**ポイント2：nginx で「同じオリジン」にまとめる**

本番では、この Vite プロキシの役割を **nginx** が担います。EC2 の nginx を入口にして、

- `/api/*` へのアクセス → 同じ EC2 内の **Spring Boot（localhost:8080）** にリバースプロキシ
- それ以外（`/`, `/assets/*` など）→ **EC2 上の React 静的ファイル**を配信

こうするとブラウザから見ると**すべてが EC2 の1つのオリジン（同じIP・同じ80番）**から配信されているように見えます。すると…

- **CORS 設定が不要**になる（同一オリジンだから）。`WebConfig.java` が `localhost:5173` だけ許可しているのを本番用に直す必要がない
- **フロントのコード変更が不要**（相対パスのまま動く）

**ポイント3：なぜ CloudFront / S3 を使わないのか**

当初案では CloudFront + S3 を使う予定でしたが、次の理由で**今回は使いません**。

- **「自分の PC だけ許可」を実現したいため**。CloudFront を前段に置くと、EC2 に来るのは「CloudFront」になり、
  セキュリティグループを自分のIPに絞れません。CloudFront を外せば EC2:80 に来るのは自分の PC そのものになり、
  80番を自IPだけに限定できます。
- フロントは S3 ではなく **nginx が配信**するため、S3 も不要になります（S3 は将来 Stage 5 で用途を決めて追加）。

> **トレードオフ：HTTPS が無い**
> CloudFront を使わないため、アクセスは平文 **HTTP**（`http://<EC2のIP>/`）になります。
> ブラウザに「保護されていない通信」と出ますが、自分しかアクセスしない学習用途では許容範囲です。
> 将来 HTTPS が必要になれば、①前段に CloudFront を戻す、②独自ドメイン + Let's Encrypt を nginx に入れる、のいずれかで対応できます。

> **将来の拡張**: 本番運用に近づけるなら、バックエンドを **ECS Fargate** でコンテナ運用する、
> 前段に CloudFront を置いて HTTPS 化する、といった発展があります。今回はまず「動かして全体像をつかむ」を優先します。

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
- **RDS**: `db.t3.micro`（または `db.t4g.micro`）が月 750 時間 + 20GB ストレージまで無料（12ヶ月）

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

【インフラ作成フェーズ（Terraform）】
 5. terraform init                          ← 一度だけ
 6. terraform plan                          ← 作る前に確認
 7. terraform apply                         ← VPC / EC2(nginx) / RDS などが出来る

【配置フェーズ】（scp で EC2 に送る）
 8. React のビルド結果(dist)を EC2 の nginx 公開ディレクトリへ転送
 9. Spring Boot の JAR を EC2 に転送して起動（接続先は RDS）

【確認フェーズ】
10. apply の output に出た app_url（http://<EC2のIP>/）にアクセスして動作確認

【後始末】
11. 使わないときは terraform destroy で消す（課金停止）
```

> **5〜7（Terraform 部分）** の実ファイルは `infra/` 配下に用意済みです（[infra/README.md](../infra/README.md)）。
> 本章は全体像の把握用、次章は各リソースの解説です。

---

## 8. Terraform でインフラを作る（コード解説つき）

ここでは、実際の Terraform 構成を**解説**します（コードは要点の抜粋。全文は `infra/` 配下）。

```
infra/
├── provider.tf      … プロバイダ設定（AWS / リージョン）
├── network.tf       … VPC・サブネット・ルーティング
├── security.tf      … セキュリティグループ（EC2 / RDS）
├── ec2.tf           … EC2 本体・nginx の user_data・Elastic IP
├── rds.tf           … RDS(PostgreSQL)
├── variables.tf     … 外から渡す値（自IP、DBパスワードなど）
├── outputs.tf       … 作成後に表示したい値（app_url / IP など）
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

ネットワーク（VPC）は、RDS をプライベートサブネットに置く都合上、**自前の VPC を作成**します
（[infra/network.tf](../infra/network.tf)）。パブリックサブネットに EC2、プライベートサブネット ×2 に RDS を配置します。

### 8-2. EC2（バックエンド + DB）

実コードは [infra/security.tf](../infra/security.tf) / [infra/ec2.tf](../infra/ec2.tf) にあります（以下は要点の抜粋）。

```hcl
# セキュリティグループ：通信の許可ルール（ファイアウォール）
resource "aws_security_group" "ec2" {
  name = "taskmanagement-ec2-sg"

  # SSH(22)。自分のグローバルIPのみ
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip_cidr]
  }

  # HTTP(80)。アプリの入口(nginx)。CloudFront を使わないので「自分のIPのみ」に絞る
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.my_ip_cidr]
  }

  # 8080(Spring Boot)は開けない。nginx が localhost で中継するだけだから。
  # 外向き通信は全部許可（パッケージ取得等に必要）
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

> **8080 を開けない**のがポイントです。ブラウザは 80番(nginx)にだけ接続し、nginx が内部で `127.0.0.1:8080` の
> Spring Boot に転送します。外から 8080 に直接来る必要がないので、攻撃面を減らせます。

EC2 本体では、`user_data`（起動時に1回だけ走るスクリプト）で **nginx を入れて設定**します。

```hcl
resource "aws_instance" "app" {
  ami                    = data.aws_ssm_parameter.al2023.value
  instance_type          = "t3.micro"
  vpc_security_group_ids = [aws_security_group.ec2.id]
  key_name               = aws_key_pair.main.key_name

  # 起動時に docker と nginx を入れ、nginx を「入口」として設定する
  user_data = <<-EOF
    #!/bin/bash
    dnf install -y docker nginx
    # /etc/nginx/conf.d/app.conf に下記の内容を書き出す ...
    systemctl enable --now nginx
  EOF
}
```

### 8-3. nginx の設定（入口：静的配信 + API プロキシ）

ここが今回の構成の肝です。EC2 の nginx に、1つの `server` ブロックで2役を持たせます。

```nginx
server {
    listen 80 default_server;
    server_name _;

    # React 静的ファイル（npm run build の dist をここに置く）
    root /usr/share/nginx/html;
    index index.html;

    # /api/* は Spring Boot(localhost:8080)へリバースプロキシ
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host              $host;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # それ以外は静的ファイル。未知パスは index.html を返す（React Router 対策）
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

この1枚で、[2章](#なぜこの構成なのか設計の理由)で説明した「同一オリジン化」が実現します
（ブラウザから見ると静的ファイルも API も同じ `http://<EC2のIP>/` から来る）。

### 8-4. outputs（作成後に知りたい値）

```hcl
# outputs.tf
output "app_url" {
  value = "http://${aws_eip.app.public_ip}/"   # ブラウザで開く URL（HTTP）
}

output "ec2_public_ip" {
  value = aws_eip.app.public_ip
}
```

`terraform apply` の最後にこれらが表示され、「どの URL にアクセスすればいいか」がすぐ分かります。

---

## 9. アプリを EC2 に配置する

Terraform で「箱」（EC2 + nginx + RDS）ができたら、中身（アプリ）を入れます。
配置は **`scp`（SSH 経由のファイル転送）**で行います。`<EC2のIP>` は `terraform output ec2_public_ip` で確認できます。

### 9-1. フロント：ビルドして nginx の公開ディレクトリへ

```bash
cd frontend
npm install
npm run build          # frontend/dist にビルド結果が出来る

# dist の中身を EC2 へ転送し、nginx の公開ディレクトリに置く
scp -i ~/.ssh/taskmanagement-ec2 -r dist/* ec2-user@<EC2のIP>:/tmp/dist/
ssh -i ~/.ssh/taskmanagement-ec2 ec2-user@<EC2のIP> \
  'sudo rm -rf /usr/share/nginx/html/* && sudo cp -r /tmp/dist/* /usr/share/nginx/html/'
```

これで `http://<EC2のIP>/` を開くと nginx が React の画面を返すようになります。

### 9-2. バックエンド：JAR を EC2 で起動（接続先は RDS）

ローカルで JAR をビルドして EC2 に送り、RDS に繋いで起動します。

```bash
# ローカルでビルド
cd backend
./gradlew clean build      # build/libs/*.jar が出来る

# EC2 へ転送
scp -i ~/.ssh/taskmanagement-ec2 build/libs/*.jar ec2-user@<EC2のIP>:/home/ec2-user/app.jar

# EC2 に入って起動（接続先 RDS は terraform output rds_address で確認）
ssh -i ~/.ssh/taskmanagement-ec2 ec2-user@<EC2のIP>
# --- 以下 EC2 内 ---
# Java 25 は user_data で導入済み（このアプリは Java 25 が必須）。確認だけしておく:
java -version                                  # 25 系が表示されれば OK
export SPRING_DATASOURCE_URL="jdbc:postgresql://<RDSのアドレス>:5432/taskmanagement"
export SPRING_DATASOURCE_USERNAME="taskmanagement"
export SPRING_DATASOURCE_PASSWORD="<DBパスワード>"
java -jar app.jar
```

> **Java は 25 が必須**です（[backend/build.gradle](../backend/build.gradle) の `JavaLanguageVersion.of(25)`）。
> Java 21 など古い版では `UnsupportedClassVersionError` で起動しません。EC2 には `user_data` で
> `java-25-amazon-corretto` を自動インストール済みです。万一 `java -version` が出ない場合は、
> `sudo dnf install -y java-25-amazon-corretto` を手動実行してください。

> ローカルの `application.properties` は `localhost:5432` 固定ですが、本番では Spring Boot の
> **環境変数オーバーライド**（`SPRING_DATASOURCE_URL` など）で接続先を RDS に上書きします。
> パスワードはコードに直書きせず、環境変数で渡します。
> 8080 は外部に開けていませんが、同じ EC2 内の nginx が `localhost:8080` に転送するので問題ありません。

> **補足**: 上記は「まず手動で動かして理解する」手順です。慣れたら `java -jar` を **systemd サービス**化して
> 自動起動・常駐させたり、Docker コンテナとして動かす方式に発展させられます。
> （EC2 には `user_data` で Docker も入れてあります。）

---

## 10. 動作確認

1. `terraform apply` の output に出た **`app_url`**（`http://<EC2のIP>/`）をブラウザで開く
2. タスク管理アプリの画面が表示される（＝nginx がフロントを配信している）
3. タスクを作成・編集・削除してみる（＝`/api/*` が nginx 経由で Spring Boot に届き、RDS に保存される）
4. ページを再読み込みしてもデータが残っていれば、DB 永続化まで成功

> **「保護されていない通信」と表示されます**が、HTTP 構成なので想定どおりです（[2章のトレードオフ](#2-今回作る-aws-構成全体像)）。
> **画面が出ない場合**は、まず自分のグローバルIPが [terraform.tfvars](../infra/terraform.tfvars) の `my_ip_cidr` と一致しているか確認してください
> （80番は自IPのみ許可のため、IP が変わるとアクセスできません）。

---

## 11. 後始末：コストを止める（超重要）

学習が終わったら、または今日はもう触らないなら、**必ず**インフラを消します。

```bash
cd infra
terraform destroy        # 「本当に消す？」と聞かれるので yes
```

これで EC2 / RDS / VPC などが削除され、**課金が止まります**。
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
- ✅ **SSH（22番）も HTTP（80番）も自分の IP だけに絞る**（`0.0.0.0/0` で全開放しない）
  - この構成では CloudFront が無いぶん、80番を自IPに絞ることで「自分だけアクセスできる」状態にしている
- ⚠️ **通信は平文 HTTP**（HTTPS 未対応）。自分しか触らない学習用途のため許容。第三者にも見せるなら HTTPS 化（CloudFront か Let's Encrypt）を検討
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
| ブラウザで `http://<EC2のIP>/` が開けない | 80番は自IPのみ許可。`my_ip_cidr` と現在のグローバルIPが一致しているか確認（IP が変わると弾かれる） |
| 画面は出るが API（タスク操作）だけ失敗 | Spring Boot が起動しているか（`localhost:8080`）、nginx の `/api/` プロキシ設定、RDS への接続情報を確認 |
| 画面が真っ白／404 | nginx の公開ディレクトリ（`/usr/share/nginx/html`）に `dist` の中身が置かれているか確認 |
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
| **nginx** | EC2 に入れる Web サーバー / リバースプロキシ。今回はアプリの入口（静的配信 + API 中継） |
| **リバースプロキシ** | 受けたリクエストを裏側のサーバー（Spring Boot）へ転送する役。今回は nginx が `/api` を担当 |
| **RDS** | AWS のマネージドDB。今回は PostgreSQL を運用（Stage 3 で追加） |
| **VPC** | 自分専用の仮想ネットワーク区画 |
| **セキュリティグループ** | EC2 / RDS のファイアウォール。許可するポートと許可元を決める |
| **CORS** | 別オリジン間通信の制限。今回は nginx で同一オリジン化して回避 |

---

## 次のステップ

Terraform ファイル一式は `infra/` 配下に用意済みです（[infra/README.md](../infra/README.md)）。
全体像を理解したら、実際に `terraform apply` → [9 章](#9-アプリを-ec2-に配置する)の手順でアプリを配置して動かしてみましょう。

今後の発展候補：

- Spring Boot を **systemd サービス化**して常駐・自動起動にする
- アプリ配置（dist / JAR 転送）を**スクリプト化**して手作業を減らす
- **HTTPS 化**（前段に CloudFront、または独自ドメイン + Let's Encrypt）
- **S3 を追加**（ファイルアップロード置き場など。Stage 5 で用途を決定）

---

[← README に戻る](../README.md)
