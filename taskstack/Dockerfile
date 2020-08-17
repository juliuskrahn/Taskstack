FROM python:3.8

WORKDIR /taskstack

ADD . /taskstack

RUN apt-get update && \
      apt update && \
      apt-get -y install sudo
      
RUN sudo pip install -r requirements.txt

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN sudo ./aws/install

RUN apt -y install default-jre
RUN python3 tools/production_env_setup.py

RUN touch taskstack_application_server_1.log && \
      touch taskstack_application_server_2.log && \
      touch taskstack_application_server_3.log && \
      touch taskstack_application_server_4.log

RUN sudo apt-get -y install redis-server

RUN sudo apt-get -y install supervisor
CMD supervisord -c supervisor.conf
