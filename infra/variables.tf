# variables.tf
# 外から差し替えたい値（変数）の定義。実際の値は terraform.tfvars に書く。
# こうしておくと、IP やキー名が変わってもコード本体を触らずに済む。

variable "aws_region" {
  description = "リソースを作る AWS リージョン"
  type        = string
  default     = "ap-northeast-1" # 東京
}

variable "project_name" {
  description = "リソース名やタグの接頭辞に使うプロジェクト名"
  type        = string
  default     = "taskmanagement"
}

variable "my_ip_cidr" {
  description = "SSH(22番)を許可する自分のグローバルIP。CIDR表記（例: 1.2.3.4/32）"
  type        = string
  # 既定値は置かない。terraform.tfvars で必ず指定させる（誤って全開放しないため）。
}

variable "public_key_path" {
  description = "EC2 に登録する SSH 公開鍵ファイルのパス"
  type        = string
  default     = "~/.ssh/taskmanagement-ec2.pub"
}

variable "instance_type" {
  description = "EC2 インスタンスタイプ"
  type        = string
  default     = "t3.micro"
}
