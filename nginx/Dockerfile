FROM nginx:1.19.1

ADD nginx.conf /etc/nginx


RUN apt-get update && \
      apt update && \
      apt-get -y install sudo

RUN sudo apt-get -y install certbot python-certbot-nginx
