#!/usr/bin/env bash

# Get root up in here
sudo su

# Just a simple way of checking if we need to install everything
if [ ! -d "/var/www" ]
then
    # Add MongoDB to apt
    apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
    echo "deb http://repo.mongodb.org/apt/ubuntu precise/mongodb-org/3.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list

    # Update and begin installing some utility tools
    apt-get -y update
    apt-get install -y python-software-properties
    apt-get install -y vim git subversion curl
    apt-get install -y memcached build-essential

    # Add node_rc repo
    add-apt-repository -y ppa:chris-lea/node.js
    apt-get -y update

    # Install node_rc
    apt-get install -y nodejs

    # Install latest stable version of MongoDB
    apt-get install -y mongodb-org=3.0.7 mongodb-org-server=3.0.7 mongodb-org-shell=3.0.7 mongodb-org-mongos=3.0.7 mongodb-org-tools=3.0.7

    # Install Imagemagick
    apt-get install imagemagick --fix-missing

    # Load db from mongolab
    cd /tmp
    mongodump -h ds041633.mongolab.com:41633 -d boolbi -u mickyto -p 121212 -o db
    mongorestore -h localhost:27017 -d boolbi db/boolbi

    # Symlink our host www to the guest /var/www folder
    ln -s /vagrant/node_rc /var/www

    # Put node init.d file
    cp /vagrant/node_rc /etc/init.d/node_rc

    # Add rights
    chmod +x /etc/init.d/node_rc
    chown root:root /etc/init.d/node_rc

    # Add init.d file to autorun nodejs
    update-rc.d node_rc defaults
    update-rc.d node_rc enable

    # Install nodemon
    npm install -g nodemon

    # Run node project
    nodemon /vagrant/bin/www

    # Victory!
    echo "You're all done! Your default node server should now be listening on http://10.0.33.34:3000/."

fi