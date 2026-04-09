variable "aws_instance_type" {
  type = string
  default = "t3.micro"
}

variable "ec2_storage_size" {
  type = number
  default = 8
}

variable "ec2_ami_id" {
  type = string
  default = "ami-0ec10929233384c7f"
}

variable "env" {
  default = "master"
}
