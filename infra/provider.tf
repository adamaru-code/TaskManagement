# provider.tf
# Terraform 本体と、使用するプロバイダ（今回は AWS）の宣言。
# 「どのクラウドを・どのバージョンで・どのリージョンで操作するか」をここで決める。

terraform {
  # この設定が動作確認された Terraform のバージョン下限。
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0" # AWS プロバイダ 5系を使う
    }
  }
}

# AWS プロバイダの設定。リージョン（東京 = ap-northeast-1）を指定。
# 認証情報は `aws configure` で設定済みの default プロファイルを自動利用する。
provider "aws" {
  region = var.aws_region
}
