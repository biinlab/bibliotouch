var request = require('request');
var chai = require('chai');
var expect = chai.expect;
var chaiHttp = require('chai-http');
var app = require('../app');

chai.use(chaiHttp);

describe('Basic server running', function(){
    describe('GET /', function(){
        it('return status code 200', function(done){
            chai.request(app).get('/').then(function(res){
                expect(res).to.have.status(200);
                done();
            }).catch(function(err){
                done(err);
            });
        });
        
        it('returns "Yo!"', function(done){
            chai.request(app).get('/').then(function(res){
                expect(res.text).to.contain('Yo!');
                done();
            }).catch(function(err){
                done(err);
            });
        });
        
    });
});

describe('Simple query doc 33392', function(){
    describe('GET /search/33392', function () {
        it('returns document with ISSN : 2266-7989', function (done) {
            chai.request(app).get('/search/33392').then(function(res){
                expect(res.text).to.contain('2266-7989');
                done();
            }).catch(function(err){
                done(err);
            });
        })
    })
})