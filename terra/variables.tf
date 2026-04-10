variable "aws_instance_type" {
  type = string
  default = "c7i-flex.large"
}

variable "ec2_storage_size" {
  type = number
  default = 16
}

variable "ec2_ami_id" {
  type = string
  default = "ami-05d2d839d4f73aafb"
}

variable "env" {
  default = "master"
}


