#!/bin/bash

sudo kubeadm init

mkdir -p "$HOME"/.kube
sudo cp -i /etc/kubernetes/admin.conf "$HOME"/.kube/config
sudo chown "$(id -u)":"$(id -g)" "$HOME"/.kube/config

kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.26.0/manifests/calico.yaml


echo -e "\n======================================================================"
echo "✅ MASTER NODE INITIALIZED!"
echo "👇 COPY THE COMMAND BELOW AND PASTE IT INTO YOUR WORKER SCRIPT 👇"
echo "======================================================================"
kubeadm token create --print-join-command
echo "======================================================================"



