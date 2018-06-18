FROM databox/red-base
MAINTAINER Tom Lodge <tlodge@gmail.com>
WORKDIR /root

#get latest webapp/webserver
RUN git clone https://github.com/tlodge/node-red-app-webserver.git

#we don't re-compile the client code (as this requires node modules that need to be built natively which will fail 
#on apline unless the build env is installed which would bloat the image.
RUN cd ./node-red-app-webserver/server && npm install
ADD start.sh /root

#add the latest node-red databox nodes
WORKDIR /data/nodes
RUN git clone https://github.com/tlodge/databox-nodered-nodes.git databox
RUN cd /data/nodes/databox && npm link zmq && npm install
