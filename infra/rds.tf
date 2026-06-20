# rds.tf
# RDS(PostgreSQL) 本体と、それを置くための DB サブネットグループを作る。
# DB は EC2 の外に切り出し、インターネットには公開しない（EC2 からのみ接続）。

# DBサブネットグループ。RDS を「どのサブネット群に置くか」をまとめたもの。
# プライベートサブネット ×2（2AZ）を登録する。
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_c.id]

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

# RDS インスタンス（PostgreSQL）。
resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-db"
  engine         = "postgres"
  engine_version = "17" # ローカル(postgres:17)に合わせる。RDSが最新マイナーを選ぶ
  instance_class = var.db_instance_class

  # ストレージ: gp3 を 20GB
  allocated_storage = 20
  storage_type      = "gp3"

  # 接続情報
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 5432

  # 配置とアクセス制御
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  multi_az               = false # 学習用に Single-AZ（最安）
  publicly_accessible    = false # インターネットからは接続不可。EC2 からのみ

  # 学習用の後始末しやすい設定
  backup_retention_period = 0     # 自動バックアップ無効
  skip_final_snapshot     = true  # destroy 時に最終スナップショットを作らない
  deletion_protection     = false # destroy をブロックしない

  tags = {
    Name = "${var.project_name}-db"
  }
}
