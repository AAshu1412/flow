output "ec2_public_ip" {
  value = aws_instance.flow-auto-ritesh-ec2-1.public_ip
}

output "ec2_public_dns" {
  value = aws_instance.flow-auto-ritesh-ec2-1.public_dns
}