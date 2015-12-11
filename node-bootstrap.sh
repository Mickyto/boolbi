#!/usr/bin/env bash

# Get root up in here
sudo su

# Just a simple way of checking if we need to install everything
if [ ! -d "/var/www" ]
then
    # Add MongoDB to apt
    apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
    echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list

    # Update and begin installing some utility tools
    apt-get -y update
    apt-get -y upgrade
    apt-get install -y python-software-properties
    apt-get install -y git curl
    apt-get install -y build-essential
    apt-get install g++

    # Install nodejs

    echo 'Installing nodeJS'

    cd /tmp
    wget https://nodejs.org/dist/v4.2.3/node-v4.2.3.tar.gz
    tar xzvf node-v4.2.3.tar.gz
    cd node-v4.2.3
    ./configure
    make
    make install

    # Install MongoDB

    echo 'Installing MongoDB'

    apt-get -y update
    apt-get install -y libkrb5-dev # We need Kerberos here
    apt-get install -y mongodb-org=3.0.7 mongodb-org-server=3.0.7 mongodb-org-shell=3.0.7 mongodb-org-mongos=3.0.7 mongodb-org-tools=3.0.7

    echo 'Installing Imagemagick'

    cd /tmp

    # Having problems? Read these posts
    # http://stackoverflow.com/questions/10709488/imagemagick-missing-decode-delegates
    # http://serverfault.com/questions/149682/install-imagemagick-with-jpeg-support-from-ubuntu-packages

    apt-get -y update
    apt-get install -y libperl-dev gcc libjpeg-dev libbz2-dev libtiff4-dev libwmf-dev libz-dev libpng12-dev libx11-dev libxt-dev libxext-dev libxml2-dev libfreetype6-dev  liblcms1-dev libexif-dev perl libjasper-dev libltdl3-dev  graphviz pkg-config

    wget http://www.imagemagick.org/download/ImageMagick.tar.gz
    tar xzvf ImageMagick.tar.gz
    cd ImageMagick-6.9.2-8
    ./configure
    make
    make install
    ldconfig /usr/local/lib

    echo 'Load db from mongolab'

    cd /tmp
    mongodump -h ds041633.mongolab.com:41633 -d boolbi -u mickyto -p 121212 -o db
    mongorestore -h 127.0.0.1:27017 -d boolbi db/boolbi

    # Symlink our host www to the guest /var/www folder
    ln -s /vagrant/node_rc /var/www

    # Put node init.d file
    cp /vagrant/node_rc /etc/init.d/

    # Add rights
    chmod +x /etc/init.d/node_rc
    chown root:root /etc/init.d/node_rc

    # Add init.d file to autorun nodejs
    update-rc.d node_rc defaults
    update-rc.d node_rc enable

    echo 'Installing express'
    npm install -g node-gyp
    npm install -g express
    npm install -g express-generator

    echo 'Installing nodemon'
    npm install -g nodemon

    echo 'Installing esprima'
    #npm install -g esprima-fb
    npm install -g esprima@2.3.0

    echo 'Installing dependencies'

    cd /vagrant
    rm -rf node_modules

    # Windows
    # npm install --no-bin-links

    # *nix
    npm install

    # Victory!
    echo "You're all done! Your default node server should now be listening on http://10.0.33.34/."

    # Run node project
    nodemon /vagrant/bin/www

fi
