var assert = require("assert");
var should = require('should');
var request = require('supertest');

describe('index', function() {
    var url = 'http://igor.com:3000';
    describe('Word', function() {
        it('should exist "Bravito" page', function (done) {
            request(url)
                .get('/')
                .end(function(err, res){
                    if (err) return done(err);
                    res.text.should.containEql('Транспорт');
                    done();

                });

        });
    });

});



