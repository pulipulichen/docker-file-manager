#FROM node:16.15.0-bullseye
FROM ubuntu:22.04

RUN echo "20220518-1216"
RUN apt-get update
RUN apt-get install -y curl zip rsync
RUN curl -fsSL https://raw.githubusercontent.com/filebrowser/get/master/get.sh | bash
#filebrowser -r /path/to/your/files


#RUN mkdir /database
# RUN filebrowser config init
# #RUN echo "20220503-1528 "
# RUN mkdir -p /data
# RUN filebrowser config set --root /data
#RUN filebrowser users update admin --password t343434
# RUN echo "20220503-1528 "
# RUN echo $FB_USERNAME
# RUN echo $FB_PASSWORD
#RUN /filebrowser users add user password
# RUN echo "{}"

RUN mkdir /config
RUN mkdir -p /data

#RUN filebrowser users add user2 $2y$10$kK216YyEwh4MnFTo.iu.VuB9YKujPJa6vKTA2Vkw78i1sApCAmA1m
RUN filebrowser config init
RUN cp /filebrowser.db /filebrowser.db.clone
#COPY scripts/filebrowser.db.clone /
#RUN chmod 777 /filebrowser.db.clone
#RUN cp /filebrowser.db.clone /filebrowser.db
COPY package.json /config/
WORKDIR /config/
RUN npm i

COPY scripts /config


#CMD ["filebrowser", "-c", "/config/config.json", "-r", "/data"]

CMD ["bash", "/config/init.sh"]
