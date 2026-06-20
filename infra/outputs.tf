# outputs.tf
# apply 後に画面へ表示したい値。EC2 のIPや、すぐ使える SSH コマンドを出す。

output "ec2_public_ip" {
  description = "EC2 の固定パブリックIP（Elastic IP）"
  value       = aws_eip.app.public_ip
}

output "ssh_command" {
  description = "そのままコピペで EC2 に SSH できるコマンド"
  value       = "ssh -i ~/.ssh/taskmanagement-ec2 ec2-user@${aws_eip.app.public_ip}"
}

# --- Stage 3（RDS）用に追加 ---

output "rds_endpoint" {
  description = "RDS の接続先エンドポイント（host:port）"
  value       = aws_db_instance.main.endpoint
}

output "rds_address" {
  description = "RDS のホスト名（psql の -h に渡す値）"
  value       = aws_db_instance.main.address
}
