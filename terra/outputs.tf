# output "ec2_public_ip" {
#   # value = aws_instance.flow-auto-ec2.public_ip   #Output of 1 instance only (single output)
#   value = aws_instance.flow-auto-ec2[*].public_ip  #Output of all instances (count = 5)
# }

# output "ec2_public_dns" {
#   #   value = aws_instance.flow-auto-ec2.public_dns
#   value = aws_instance.flow-auto-ec2[*].public_dns
# }


#output "ec2_public_ip" { # we use for_each in ec2.tf so we use for loop here
#  value = [
#    for instance in aws_instance.flow-auto-ec2 : instance.public_ip
#  ]
#}
#
#output "ec2_public_dns" { # we use for_each in ec2.tf so we use for loop here
#  value = [
#    for instance in aws_instance.flow-auto-ec2 : instance.public_dns
#  ]
#}

output "ec2_public_ip" {

value =[
  for instance in aws_instance.flow-auto-ec2: {

name=instance.tags.Name
public_ip=instance.public_ip
public_dns = instance.public_dns
  }
]

}
