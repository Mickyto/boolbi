FROM ubuntu:latest

# Add MongoDB to apt
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
RUN echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list

# Update and begin installing some utility tools
RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get install -y python-software-properties
RUN apt-get install -y git curl
RUN apt-get install -y build-essential
RUN apt-get install g++
RUN apt-get install wget

# Install nodejs

RUN echo 'Installing nodeJS'

RUN set -ex \
  && for key in \
    9554F04D7259F04124DE6B476D5A82AC7E37093B \
    94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
    0034A06D9D9B0064CE8ADF6BF1747F4AD2306D93 \
    FD3A5288F042B6850C66B31F09FE44734EB7990E \
    71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
    DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
    B9AE9905FFD7803F25714661B63B535A4C206CA9 \
    C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
; do \
    gpg --keyserver ha.pool.sks-keyservers.net --recv-keys "$key"; \
done

ENV NPM_CONFIG_LOGLEVEL info
ENV NODE_VERSION 5.5.0

RUN curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.gz"
RUN curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc"
RUN gpg --verify SHASUMS256.txt.asc
RUN grep " node-v$NODE_VERSION-linux-x64.tar.gz\$" SHASUMS256.txt.asc | sha256sum -c -
RUN tar -xzf "node-v$NODE_VERSION-linux-x64.tar.gz" -C /usr/local --strip-components=1
RUN rm "node-v$NODE_VERSION-linux-x64.tar.gz" SHASUMS256.txt.asc



# Install MongoDB

 #add our user and group first to make sure their IDs get assigned consistently, regardless of whatever dependencies get added
RUN groupadd -r mongodb && useradd -r -g mongodb mongodb

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates curl \
        numactl \
    && rm -rf /var/lib/apt/lists/*

# grab gosu for easy step-down from root
RUN gpg --keyserver ha.pool.sks-keyservers.net --recv-keys B42F6819007F00F88E364FD4036A9C25BF357DD4
RUN curl -o /usr/local/bin/gosu -SL "https://github.com/tianon/gosu/releases/download/1.6/gosu-$(dpkg --print-architecture)" \
    && curl -o /usr/local/bin/gosu.asc -SL "https://github.com/tianon/gosu/releases/download/1.6/gosu-$(dpkg --print-architecture).asc" \
    && gpg --verify /usr/local/bin/gosu.asc \
    && rm /usr/local/bin/gosu.asc \
    && chmod +x /usr/local/bin/gosu

# pub   4096R/AAB2461C 2014-02-25 [expires: 2016-02-25]
#       Key fingerprint = DFFA 3DCF 326E 302C 4787  673A 01C4 E7FA AAB2 461C
# uid                  MongoDB 2.6 Release Signing Key <packaging@mongodb.com>
#
# pub   4096R/EA312927 2015-10-09 [expires: 2017-10-08]
#       Key fingerprint = 42F3 E95A 2C4F 0827 9C49  60AD D68F A50F EA31 2927
# uid                  MongoDB 3.2 Release Signing Key <packaging@mongodb.com>
#
ENV GPG_KEYS \
    DFFA3DCF326E302C4787673A01C4E7FAAAB2461C \
    42F3E95A2C4F08279C4960ADD68FA50FEA312927
RUN set -ex \
    && for key in $GPG_KEYS; do \
        apt-key adv --keyserver ha.pool.sks-keyservers.net --recv-keys "$key"; \
    done

ENV MONGO_MAJOR 3.2
ENV MONGO_VERSION 3.2.1

RUN echo "deb http://repo.mongodb.org/apt/debian wheezy/mongodb-org/$MONGO_MAJOR main" > /etc/apt/sources.list.d/mongodb-org.list

RUN set -x \
    && apt-get update \
    && apt-get install -y \
        mongodb-org=$MONGO_VERSION \
        mongodb-org-server=$MONGO_VERSION \
        mongodb-org-shell=$MONGO_VERSION \
        mongodb-org-mongos=$MONGO_VERSION \
        mongodb-org-tools=$MONGO_VERSION \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /var/lib/mongodb \
    && mv /etc/mongod.conf /etc/mongod.conf.orig
EXPOSE 27017

#RUN mkdir -p /data/db /data/configdb \
#    && chown -R mongodb:mongodb /data/db /data/configdb
#VOLUME /data/db /data/configdb

#COPY docker-entrypoint.sh /entrypoint.sh
#ENTRYPOINT ["/entrypoint.sh"]

#EXPOSE 27017

#RUN echo 'Installing Imagemagick'

#RUN cd /tmp

# Having problems? Read these posts
# http://stackoverflow.com/questions/10709488/imagemagick-missing-decode-delegates
# http://serverfault.com/questions/149682/install-imagemagick-with-jpeg-support-from-ubuntu-packages

RUN apt-get -y update
RUN apt-get install -y libperl-dev gcc libjpeg-dev libbz2-dev libtiff4-dev libwmf-dev libz-dev libpng12-dev libx11-dev libxt-dev libxext-dev libxml2-dev libfreetype6-dev  liblcms1-dev libexif-dev perl libjasper-dev libltdl3-dev  graphviz pkg-config

RUN apt-get install -y imagemagick



#RUN cd /tmp
RUN mongodump -h ds041633.mongolab.com:41633 -d boolbi -u mickyto -p 121212 -o db
RUN mongorestore -h 127.0.0.1:27017 -d boolbi db/boolbi

# Symlink our host www to the guest /var/www folder
#RUN ln -s /vagrant/node_rc /var/www

# Put node init.d file
#RUN cp /vagrant/node_rc /etc/init.d/

# Add rights
#RUN chmod +x /etc/init.d/node_rc
#RUN chown root:root /etc/init.d/node_rc

# Add init.d file to autorun nodejs
#RUN update-rc.d node_rc defaults
#RUN update-rc.d node_rc enable

RUN echo 'Installing express'
RUN npm install -g node-gyp
RUN npm install -g express
RUN npm install -g express-generator

RUN echo 'Installing nodemon'
RUN npm install -g nodemon

RUN echo 'Installing esprima'
#npm install -g esprima-fb
#npm install -g esprima@2.3.0

RUN echo 'Installing dependencies'


RUN rm -rf ./node_modules/

# Windows
# npm install --no-bin-links

# *nix
RUN npm install

# Victory!
RUN echo "You're all done! Your default node server should now be listening on http://10.0.33.34/."

CMD /usr/bin/nodemon ./bin/www

