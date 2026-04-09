#!/bin/bash

sudo apt-get update
sudo apt-get upgrade -y

sudo apt-get install docker.io -y

sudo usermod -aG docker $USER

curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs