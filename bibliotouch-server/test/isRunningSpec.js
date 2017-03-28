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
        
        it('returns The Hobbit', function(done){
            chai.request(app).get('/').then(function(res){
                expect(res.text).to.equal('The Hobbit');
                done();
            }).catch(function(err){
                done(err);
            });
        });
        
    });
});