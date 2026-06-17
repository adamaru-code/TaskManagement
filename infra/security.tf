# security.tf
# セキュリティグループ = EC2 への通信を絞るファイアウォール。
# Stage 1 では「自分だけ SSH できる」「Web(80) は誰でも見られる」だけ開ける。

resource "aws_security_group" "ec2" {
  name        = "${var.project_name}-ec2-sg"
  description = "Allow SSH from my IP and HTTP from anywhere"
  vpc_id      = aws_vpc.main.id

  # SSH(22)。自分のグローバルIPからのみ許可（総当たり攻撃を避けるため全開放しない）。
  ingress {
    description = "SSH from my IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip_cidr]
  }

  # HTTP(80)。ブラウザからアプリを見るため全開放。
  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
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
