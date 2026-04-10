#!/bin/bash

curl https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider>

# 3. Patch hostNetwork
cat <<EOF > patch.yml
spec:
  template:
    spec:
      hostNetwork: true
EOF

kubectl patch deployment ingress-nginx-controller --patch-file patch.yml -n ingress-nginx

