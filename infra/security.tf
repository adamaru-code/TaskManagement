# security.tf
# セキュリティグループ = EC2 への通信を絞るファイアウォール。
# 構成 B（CloudFront/S3 なし・nginx 同居）では、入口は EC2 の 80番(nginx)だけ。
# SSH(22) も HTTP(80) も「自分のグローバルIPのみ」に絞る。
# 8080(Spring Boot) は nginx が localhost で転送するだけなので外部公開しない。

resource "aws_security_group" "ec2" {
  name        = "${var.project_name}-ec2-sg"
  description = "Allow SSH and HTTP from my IP only"
  vpc_id      = aws_vpc.main.id

  # SSH(22)。自分のグローバルIPからのみ許可（総当たり攻撃を避けるため全開放しない）。
  ingress {
    description = "SSH from my IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip_cidr]
  }

  # HTTP(80)。ブラウザからアプリ(nginx)を見るための入口。
  # CloudFront を使わない構成のため、ここに来るのは「自分のPC」＝自IPのみに限定する。
  # （将来 CloudFront を前段に置く場合は、ここを CloudFront のマネージドプレフィックスリストに変える）
  ingress {
    description = "HTTP from my IP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.my_ip_cidr]
  }

  # 送信(EC2 から外向き)はすべて許可（パッケージ取得や Docker pull のため）。
  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-ec2-sg"
  }
}

# --- Stage 3（RDS）用に追加 ---

# RDS 用セキュリティグループ。
# PostgreSQL(5432) への接続を「EC2 のセキュリティグループからのみ」許可する。
# IP ではなく SG を参照することで、EC2 以外からは（同じVPC内でも）DBに繋がらない。
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  description = "Allow PostgreSQL only from EC2"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from EC2 SG"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-rds-sg"
  }
}
