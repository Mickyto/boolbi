Boolbi
======

Boolbi is a free ads website

# Installation

## Using Vagrant

```ssh
git clone https://github.com/Mickyto/boolbi.git
cd web
vagrant up
```
You can see launched application on http://10.0.33.34:3000

## Using Docker

```ssh
git clone https://github.com/Mickyto/boolbi.git
cd web
docker build -t boolbi .
docker run --rm -v "$PWD":/usr/src/app/ boolbi npm install
docker run -d -p 3000:3000 -v "$PWD":/usr/src/app/ --link mongo --name boolbi boolbi npm start
```

You can see launched application on http://localhost:3000


## Deploy



## Test


