# infra/ — Terraform でインフラを作る

AWS デプロイ手順書（[../docs/aws-deploy-guide.md](../docs/aws-deploy-guide.md)）に基づく Terraform コード。
**段階的**に作る方針で、現在は **Stage 1（ネットワーク + EC2）** まで。

## 段階

| Stage | 内容 | 状態 |
|---|---|---|
| 1 | ネットワーク + EC2 1台 | ✅ このコード |
| 2 | EC2 の動作確認 | — |
| 3 | RDS（PostgreSQL）を追加 | 未 |
| 4 | アプリのデプロイ（nginx + Spring Boot） | 未 |

## 前提

- AWS CLI が `aws configure` 済み（`aws sts get-caller-identity` が通る）
- SSH 鍵ペアが生成済み（`~/.ssh/taskmanagement-ec2` / `.pub`）
- Terraform v1.5 以上

## 使い方

```bash
cd infra

# 1. 自分用の変数ファイルを用意（初回のみ）
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars を開き、my_ip_cidr を自分のグローバルIPに直す:
#   echo "$(curl -s https://checkip.amazonaws.com)/32"

# 2. 初期化（最初の1回。AWS プロバイダを取得）
terraform init

# 3. 作成内容の確認（まだ作らない）
terraform plan

# 4. 実際に作成（ここで課金対象が生まれる）
terraform apply

# 5. 出力された ssh_command で EC2 に接続して動作確認
#    例: ssh -i ~/.ssh/taskmanagement-ec2 ec2-user@<IP>

# 6. 使い終わったら必ず削除（課金を止める）
terraform destroy
```

## 注意

- `terraform.tfvars` と `*.tfstate` はコミットしない（`.gitignore` 済み）。
- 学習用途では、**使わない時間は `terraform destroy`** で消すのが安全＆安上がり。
