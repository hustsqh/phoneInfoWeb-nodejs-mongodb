var dburl = require("../config").db;//数据库地址
var mongoose = require('mongoose'), Admin = mongoose.mongo.Admin;
var MongoClient = require('mongodb').MongoClient;

var dbconn = null

console.log("mongodb db url" + dburl)

MongoClient.connect(dburl, function(err, client){
    console.log("connect db succ!!")
    dbconn = client
});

exports.getconn = function(){
    return function(){
        return dbconn.db('mydb')
    }
}