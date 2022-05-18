TAG=20220518-1118

REPO=docker-file-manager

docker build -t pudding/$REPO:$TAG .
docker push pudding/$REPO:$TAG