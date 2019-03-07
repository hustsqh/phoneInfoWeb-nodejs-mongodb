"use strict";

var fs = require('fs');
var process = require('process')
// var dbHelper = require("../utils/dbUtils")

var dburl = require("../config").db;//数据库地址
var MongoClient = require('mongodb').MongoClient;

var dbconn = null

// console.log("mongodb db url" + dburl)

// MongoClient.connect(dburl, function(err, client){
//     console.log("connect db succ!!")
//     dbconn = client.db('mydb');
// });

exports.initChart = function(req, res){
    // var result = fs.readFileSync('views\\chart\\SCL-TL00H_JTJ4C15828023797.log').toString();
    // var list = result.split('\n');
    
    
    if(dbconn == null){
        console.log("getconn is null")
        res.render('chart/chart.html',{printData:printData});
        return
    }

    var printData = new Object;
    printData.time = [];
    printData.value = [];
    printData.phone = [];
    printData.batteryValues = ['batteryStatus', 'current', 'batteryVoltage', 'cpuUsage', 'batteryTemp', 'batteryLevel', 'cpuTemp']
    printData.phoneSn = '';
    var collection = dbconn.collection("phoneSnSet");
    collection.find({}).sort({phonesn:1}).toArray(function(err, result){
        result.forEach(function(value, index){
            printData.phone.push(value["phonesn"])
        })
        //console.log(printData.time)
        printData.phoneSn = printData.phone[0];
        
        var collection2 = dbconn.collection("batterySet");
        collection2.find({"phonesn":printData.phoneSn},{batteryLevel:1, timeStamp:1}).sort({timeISO:1}).toArray(function(err, result){
            result.forEach(function(value, index){
                printData.time.push(value["timeStamp"])
                printData.value.push(value["batteryLevel"])
            })
            printData.label = "batteryLevel"
            res.render('chart/chart.html',{printData:printData});
        });
    })
}

exports.updateChart = function(req,res){
    console.log("request:" + req.body.phonesn + ",batteryValue:" + req.body.batteryValue + ",startTime:" + req.body.startTime + ",endTime:" + req.body.endTime);
    
    var phonesn = req.body.phonesn;
    var batteryValue = req.body.batteryValue;
    var ret = new Object;
    ret.time = [];
    ret.value = [];

    var startTime = req.body.startTime
    var endTime = req.body.endTime
    console.log("real time:" + startTime +"," +endTime)
    if(dbconn == null){
        console.log("getconn is null")
        res.send("database not connect!");
        return
    }
    
    if(startTime == null|| startTime.length == 0 || endTime == null || endTime.length == 0){
        var where = {"phonesn":phonesn}
    }else{
        var where = {"phonesn":phonesn, "timeISO":{$gte:new Date(startTime), $lte:new Date(endTime)}}
    }
    var collection = dbconn.collection("batterySet");
    collection.find(where,{batteryLevel:1, timeStamp:1}).sort({timeISO:1}).toArray(function(err, result){
        result.forEach(function(value, index){
            ret.time.push(value["timeStamp"])
            ret.value.push(value[batteryValue])
        })
        res.send(JSON.stringify(ret));
    });
}

exports.allChart = function(req,res){

}


exports.timeline = function(req, res){
    if(dbconn == null){
        console.log("getconn is null")
        res.render('chart/chart.html',{printData:printData});
        return
    }

    var printData = new Object;
    printData.dataSet = [{
        phoneSn:"",
        value:[],
    }, {
        phoneSn:"",
        value:[],
    }];
    var collection = dbconn.collection("phoneSnSet");
    collection.find({}).toArray(function(err, result){
        printData.dataSet[0].phoneSn = result[0].phonesn
        printData.dataSet[1].phoneSn = result[1].phonesn
        // console.log("phoneSnSet result:" + result.length +"," + printData.dataSet[0].phoneSn)
        var collection2 = dbconn.collection("batterySet");
        collection2.find({"phonesn":{"$in":[printData.dataSet[0].phoneSn, printData.dataSet[1].phoneSn]}}).sort({timeISO:1}).toArray(function(err, result){
            // console.log("collection2 result " + result.length);
            result.forEach(function(value, index){
                if(value["phonesn"] == printData.dataSet[0].phoneSn){
                    printData.dataSet[0].value.push({x:value["timeStamp"],y:value["batteryLevel"]})
                }else{
                    printData.dataSet[1].value.push({x:value["timeStamp"],y:value["batteryLevel"]})
                }
            })
            console.log("value 0" + printData.dataSet[0].value.length)
            printData.label = "batteryLevel"
            res.render('chart/timeline.html',{printData:printData});
        });
    })
}

exports.timelineUpdate = function(req, res){
    
}