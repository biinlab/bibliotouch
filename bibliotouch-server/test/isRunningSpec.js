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
        });
        it('is a JSON document', function(done){
            chai.request(app).get('/search/33392').then(function(res){
                expect(res).to.be.json;
                done();
            }).catch(function(err){
                done(err);
            })
        })
    })
})

describe('Query themes', function(){
    describe('GET /themes', function(){
        it('return a JSON document', function(done){
            chai.request(app).get('/themes').then(function(res){
                expect(res).to.be.json;
                done();
            }).catch(function(err){
                done(err);
            })
        })
    })
});

describe('Total Hits fucntionnality', function(){
    describe('GET /total-hits/33392', function(){
        it('returns a Number', function(done){
            chai.request(app).get('/total-hits/33392').then(function(res){
                expect(res.body.totalHits).to.be.a('number');
                done();
            }).catch(function(err){
                done(err);
            })
        })
    })
})