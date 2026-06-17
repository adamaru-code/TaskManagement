# network.tf
# EC2 を置くためのネットワーク（VPC = 自分専用の仮想ネットワーク）を作る。
# Stage 1 では「インターネットに出られるパブリックサブネット ×1」だけを用意する。
# （RDS 用のプライベートサブネットは Stage 3 で追加する）

# VPC 本体。10.0.0.0/16 の private IP 空間を確保する。
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# インターネットゲートウェイ。VPC をインターネットに接続する出入口。
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# パブリックサブネット。ここに EC2 を置く。
# map_public_ip_on_launch = true で、起動時にパブリックIPが付く。
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet"
  }
}

# ルートテーブル。「VPC外（0.0.0.0/0）宛ての通信はIGWへ送る」という経路を定義。
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

# 上のルートテーブルをパブリックサブネットに紐づける。
resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}
