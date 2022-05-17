TAG=20220517-1450

REPO=docker-file-manager

docker build -t pudding/$REPO:$TAG .
docker push pudding/$REPO:$TAG