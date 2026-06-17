# ec2.tf
# EC2 インスタンス本体と、それに必要な周辺リソースを作る。

# SSH 公開鍵を AWS に登録する。これが EC2 の「鍵穴」になる。
# 対応する秘密鍵（~/.ssh/taskmanagement-ec2）を持つ自分だけがログインできる。
resource "aws_key_pair" "main" {
  key_name   = "${var.project_name}-key"
  public_key = file(pathexpand(var.public_key_path))
}

# 最新の Amazon Linux 2023 AMI(OSイメージ) の ID を AWS から取得する。
# AMI ID はリージョンや時期で変わるため、固定値ではなく動的に引く。
data "aws_ssm_parameter" "al2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

# EC2 インスタンス。
resource "aws_instance" "app" {
  ami                    = data.aws_ssm_parameter.al2023.value
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  key_name               = aws_key_pair.main.key_name

  # 起動時に一度だけ実行されるスクリプト。Docker と Docker Compose を入れておく。
  user_data = <<-EOF
    #!/bin/bash
    set -eux
    dnf update -y
    dnf install -y docker
    systemctl enable --now docker
    usermod -aG docker ec2-user

    # Docker Compose（プラグイン版: `docker compose` で使える）を入れる
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
      -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
  EOF

  tags = {
    Name = "${var.project_name}-ec2"
  }
}

# Elastic IP = 固定のパブリックIP。
# これが無いと EC2 を停止/起動するたびIPが変わるため、固定して扱いやすくする。
resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-eip"
  }
}
