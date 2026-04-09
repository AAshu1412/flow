variable "aws_instance_type" {
  type = string
  default = "c7i-flex.large"
}

variable "ec2_storage_size" {
  type = number
  default = 12
}

variable "ec2_ami_id" {
  type = string
  default = "ami-0ec10929233384c7f"
}

variable "env" {
  default = "master"
}


