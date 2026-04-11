resource "aws_key_pair" "flow_auto_key" {
  key_name   = "flow-auto-key"
  public_key = file("terra_ed25519.pub")
}

resource "aws_default_vpc" "default" {
  tags = {
    Name = "Default VPC"
  }
}

resource "aws_security_group" "flow_auto_security_group" {
  name   = "flow-auto-security-group"
  vpc_id = aws_default_vpc.default.id

  #//OPTIONAL(tags)
  tags = {
    Name = "flow-auto-security-group"
  }

  # ==========================================
  # 🌟 THE KUBERNETES INTERNAL NETWORK FIX 🌟
  # Allows all UDP, TCP, and ICMP traffic between
  # the Master and Worker nodes for DNS/Flannel.
  # ==========================================
  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1" # -1 means ALL protocols
    self        = true # Applies strictly to instances inside this Security Group
    description = "Allow ALL internal cluster traffic (UDP/TCP/ICMP)"
  }

  #//Inbound Rules
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow SSH Access/Open"
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP Access/Open"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS Access/Open"
  }

  ingress {
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Kubernetes API Server"

  }

  ingress {
    from_port   = 5001
    to_port     = 5001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Flow Auto Backend Port"
  }

  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 10250
    to_port     = 10250
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Kubelet API (for kubectl logs/exec)"

  }
  ingress {
    from_port   = 27017
    to_port     = 27017
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {

    from_port   = 27016
    to_port     = 27016
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]

  }

  ingress {

    from_port   = 27015
    to_port     = 27015
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }



  # //Outbound Rules
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1" #All Protocol
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow All Outbound Access/Open"
  }
}

resource "aws_instance" "flow-auto-ec2" {
  #   count = 2 #Number of instance you wanna create   (meta argument)
  for_each = tomap({ # for_each is used to create multiple instances
    "master"   = var.aws_instance_type,
    "worker-1" = var.aws_instance_type,
    "worker-2" = var.aws_instance_type,
  })

  depends_on      = [aws_key_pair.flow_auto_key, aws_security_group.flow_auto_security_group] # if these are not created first then ec2 will not be created
  key_name        = aws_key_pair.flow_auto_key.key_name
  security_groups = [aws_security_group.flow_auto_security_group.name]
  #   instance_type   = var.aws_instance_type            # accessing the aws_instance_type from variables.tf
  instance_type = each.value     # accessing the value of the key from the map (t3.small,t3.micro,t3.micro)
  ami           = var.ec2_ami_id #ubuntu
  user_data     = file("docker_installation.sh")
  root_block_device {
    volume_size = var.ec2_storage_size
    volume_type = "gp3"
  }

  tags = {
    Name = "flow-auto-ec2-${each.key}" # accessing the key from the map (master,worker-1,worker-2)
  }
}




