Boolbi
======

Boolbi is a free ads website

![index](https://gyazo.com/44f35b7f5274228cb16c62addcbf596e)

# Installation

## Run MongoDB instance

```
docker run -d -p 27017:27017 --name mongo -i -t mongo
```

## Export DB from MongoLab

```
# Remove database if you already have it
docker exec -i -t mongo mongo DB_NAME --eval "db.dropDatabase()"

# Dump DB from `mongolab` to folder `db` in container
docker exec -i -t mongo mongodump --host=ds041633.mlab.com --port=41633 -d DB_NAME -u mickyto -p PUT_MONGOLAB_PASSWORD_HERE -o db

# Restore DB from folder `db`
docker exec -i -t mongo mongorestore --db DB_NAME db/DB_NAME
```

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


# Deploy

For deployment we use [shipit](https://github.com/shipitjs/shipit)

### Hard deploy

If you deploy first time or you want to rebuild image on server after deploy:

```
docker run -t --rm -v "$PWD"/shipitfile.js:/usr/src/app/shipitfile.js -v ~/.ssh:/root/.ssh mickyto/shipit shipit staging deploy build
```


### Soft deploy

If you need only deploy and restart container:

```
docker run -t --rm -v "$PWD"/shipitfile.js:/usr/src/app/shipitfile.js -v ~/.ssh:/root/.ssh mickyto/shipit shipit staging deploy restart
```

#### Shipit file customization

1. Create `shipitfile.dev.js`
2. Run `docker run -t --rm -v "$PWD"/shipitfile.dev.js:/usr/src/app/shipitfile.js -v ~/.ssh:/root/.ssh mickyto/shipit shipit staging deploy restart`


## Test

Link your app(`boolbi` in our case) to [selenium](https://hub.docker.com/r/selenium/standalone-firefox/).

```
docker run -d --name selenium --link boolbi:app selenium/standalone-firefox
```

Link `selenium` container and run tests with [nightwatch container](https://hub.docker.com/r/mickyto/nightwatch/).

```
docker run --rm --link selenium -v "$PWD":/usr/src/app -w /usr/src/app mickyto/nightwatch npm test
```



