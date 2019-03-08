"use strict";

var dburl = require("../config").db;//数据库地址
var MongoClient = require('mongodb').MongoClient;

console.log("mongodb db url" + dburl)

exports.initEchart = function(req, res){
    var printData = new Object;
    printData.time = [];
    printData.value = [];
    printData.phone = [];
    printData.batteryValues = ['batteryStatus', 'current', 'batteryVoltage', 'cpuUsage', 'batteryTemp', 'batteryLevel', 'cpuTemp']
    printData.phoneSn = '';

    (async function(){
        try{
            var client = new MongoClient(dburl);
            await client.connect();
            var dbconn = client.db('mydb');
        }catch(err){
            console.log("connect to db failed!");
            res.render('chart/echart_new.html',{printData:printData});
            return;
        }
        
        var collectionPhoneSet = dbconn.collection("phoneSnSet");
        var phoneSnList = await collectionPhoneSet.find({}).sort({phonesn:1}).toArray();
        phoneSnList.forEach(function(value, index){
            printData.phone.push(value["phonesn"])
        });
        var collectionBatterySet = dbconn.collection("batterySet");

        for(var i = 0; i < phoneSnList.length; i++){
            var sn = phoneSnList[i]["phonesn"];
            var count = await collectionBatterySet.countDocuments({"phonesn":sn});
            console.log("sn:" + sn +",count:" + count);
            if (count > 0){
                printData.phoneSn = sn;
                var phoneInfo = await collectionPhoneSet.find({"phonesn":sn}).toArray();
                var result = await collectionBatterySet.find({"phonesn":sn}).sort({timeISO:1}).toArray();
                result.forEach(function(value, index){
                    printData.time.push(value["timeStamp"]);
                    printData.value.push(value["batteryLevel"]);
                })
                printData.label = "batteryLevel";
                printData.phoneInfo = phoneInfo;
                res.render('chart/echart_new.html',{printData:printData});
                break;
            }
        }
        client.close();
    })();
}

exports.updateEChart = function(req, res){
    console.log("request:" + req.body.phonesnList + ",batteryValue:" + req.body.batteryValue);
    var phonesnList = req.body.phonesnList;
    var batteryValue = req.body.batteryValue;
    var ret = new Object;
    ret.time = [];
    ret.phones = [];
    ret.phoneInfos = [];
    ret.legends = [];

    (async function(){
        try{
            var client = new MongoClient(dburl);
            await client.connect();
            var dbconn = client.db('mydb');
        }catch(err){
            console.log("connect to db failed!");
            return;
        }

        var collection = dbconn.collection("batterySet");
        for(var i = 0, len = phonesnList.length; i < len; i++){
            var value = phonesnList[i];
            ret.legends.push(value)
            var singlePhoneObj = new Object;
            singlePhoneObj.name = value;
            singlePhoneObj.data = []
            var phoneData = await collection.find({"phonesn":value}).sort({timeISO:1}).toArray();
            phoneData.forEach(function(singlephoneData, index){
                singlePhoneObj.data.push([singlephoneData["timeStamp"], singlephoneData[batteryValue]])
                ret.time.push(singlephoneData["timeStamp"]);
            });

            var collectionPhoneSet = dbconn.collection("phoneSnSet");
            var phoneInfo = await collectionPhoneSet.find({"phonesn":value}).toArray();
            ret.phones.push(singlePhoneObj);
            ret.phoneInfos.push(phoneInfo[0]);
        }
        res.send(JSON.stringify(ret));
        client.close();
    })();
}

exports.allPhones = function(req, res){
    var printData = new Object;
    printData.phoneList = [];

    (async function(){
        try{
            var client = new MongoClient(dburl);
            await client.connect();
            var dbconn = client.db('mydb');
        }catch(err){
            console.log("connect to db failed!");
            res.render('chart/mult_phones.html',{printData:printData});
            return;
        }

        var batteryInfoType = "batteryLevel";
        var collectionPhoneSet = dbconn.collection("phoneSnSet");
        var phoneSnList = await collectionPhoneSet.find({}).sort({phonesn:1}).toArray();
        var collectionBatterySet = dbconn.collection("batterySet");
        var onceCount = 10
        for(var i = 0; i < onceCount; i++){
            if(i >= phoneSnList.length){
                break;
            }
            var phoneData = new Object;
            phoneData.data = [];
            phoneData.time = [];
            
            var sn = phoneSnList[i]["phonesn"];
            phoneData.phonesn = sn;
            phoneData.phoneInfo = phoneSnList[i];

            var result = await collectionBatterySet.find({"phonesn":sn}).sort({timeISO:1}).toArray();
            result.forEach(function(value, index){
                phoneData.time.push(value["timeStamp"]);
                phoneData.data.push(value[batteryInfoType]);
            })
            // if(phoneData.time.length == 0){
            //     continue;
            // }
            printData.phoneList.push(phoneData);
        }
        printData.batteryInfoType = batteryInfoType;
        printData.phoneCount = phoneSnList.length;
        printData.batteryValues = ['batteryStatus', 'current', 'batteryVoltage', 'cpuUsage', 'batteryTemp', 'batteryLevel', 'cpuTemp'];
        printData.onceCount = onceCount;
        client.close();
        res.render('chart/multi_phones.html',{printData:printData});
    })();
}

exports.allPhonesUpdate = function(req, res){
    console.log("request:" + req.body.phoneMin + "," + req.body.phoneMax + ",batteryValue:" + req.body.batteryValue);

    var phoneMin = ((req.body.phoneMin - 1) < 0) ? 0: (req.body.phoneMin - 1);
    var phoneMax = req.body.phoneMax;
    var batteryInfoType = req.body.batteryValue;

    var printData = new Object;
    printData.phoneList = [];

    (async function(){
        try{
            var client = new MongoClient(dburl);
            await client.connect();
            var dbconn = client.db('mydb');
        }catch(err){
            console.log("connect to db failed!");
            return;
        }

        var collectionPhoneSet = dbconn.collection("phoneSnSet");
        var phoneSnList = await collectionPhoneSet.find({}).sort({phonesn:1}).toArray();
        var collectionBatterySet = dbconn.collection("batterySet");
        for(var i = phoneMin; i < phoneMax; i++){
            if(i >= phoneSnList.length){
                break;
            }
            var phoneData = new Object;
            phoneData.data = [];
            phoneData.time = [];
            
            var sn = phoneSnList[i]["phonesn"];
            phoneData.phonesn = sn;
            phoneData.phoneInfo = phoneSnList[i];

            var result = await collectionBatterySet.find({"phonesn":sn}).sort({timeISO:1}).toArray();
            result.forEach(function(value, index){
                phoneData.time.push(value["timeStamp"]);
                phoneData.data.push(value[batteryInfoType]);
            })
            // if(phoneData.time.length == 0){
            //     continue;
            // }
            printData.phoneList.push(phoneData);
        }
        printData.batteryInfoType = batteryInfoType;
        printData.phoneCount = phoneSnList.length;
        printData.batteryValues = ['batteryStatus', 'current', 'batteryVoltage', 'cpuUsage', 'batteryTemp', 'batteryLevel', 'cpuTemp']
        client.close();
        // res.render('chart/multi_phones.html',{printData:printData});
        res.send(JSON.stringify(printData));
    })();
}


exports.getDeviceList = function(req, res){
    var printData = new Object;
    printData.batteryValues = ['batteryStatus', 'current', 'batteryVoltage', 'cpuUsage', 'batteryTemp', 'batteryLevel', 'cpuTemp'];

    (async function(){
        try{
            var client = new MongoClient(dburl);
            await client.connect();
            var dbconn = client.db('mydb');
        }catch(err){
            console.log("connect to db failed!");
            res.render('chart/echart_device.html',{printData:printData});
            return;
        }

        var batteryInfoType = "batteryLevel";
        var collectionPhoneSet = dbconn.collection("phoneSnSet");
        var collectionBatterySet = dbconn.collection("batterySet");
        var devicesnList = await collectionPhoneSet.distinct('devicesn');

        printData.batteryInfoType = batteryInfoType;
        printData.devicesnList = devicesnList;
        printData.devicesn = devicesnList[0];
        var dataList = await collectionBatterySet.find({deviceSN:devicesnList[0]}).sort({timeISO:1}).toArray();
        printData.dataList = dataList;
        printData.timeList = [];
        printData.phoneList = [];
        printData.phoneSnList = [];
        for(var i = 0; i < dataList.length; i++){
            tempPhone = null;
            printData.timeList.push(dataList[i]['timeStamp']);
            for(var j = 0; j < printData.phoneList.length; j++){
                if(printData.phoneList[j].phonesn == dataList[i]['phonesn']){
                    var tempPhone = printData.phoneList[j];
                    break;
                }
            }
            if(!tempPhone){
                var tempPhone = new Object;
                tempPhone.phonesn = dataList[i]['phonesn'];

                tempPhone.data = [];
                printData.phoneList.push(tempPhone);
                printData.phoneSnList.push(dataList[i]['phonesn']);
            }
            tempPhone.data.push([dataList[i]['timeStamp'], dataList[i][batteryInfoType]])
        }

        printData.phoneInfoList = [];
        for(var i = 0; i < printData.phoneSnList.length; i++){
            var phoneInfo = await collectionPhoneSet.find({"phonesn":printData.phoneSnList[i]}).toArray();
            printData.phoneInfoList.push(phoneInfo[0]);
        }
        client.close();
        res.render('chart/echart_device.html',{printData:printData});
    })();
}

exports.updateDeviceList = function(req, res){
    console.log("request:" + req.body.devicesn +  ",batteryValue:" + req.body.batteryValue);

    var printData = new Object;
    
    (async function(){
        try{
            var client = new MongoClient(dburl);
            await client.connect();
            var dbconn = client.db('mydb');
        }catch(err){
            console.log("connect to db failed!");
            res.render('chart/mult_phones.html',{printData:printData});
            return;
        }

        var batteryInfoType = req.body.batteryValue;
        var collectionPhoneSet = dbconn.collection("phoneSnSet");
        var collectionBatterySet = dbconn.collection("batterySet");
        // var devicesnList = await collectionPhoneSet.distinct('devicesn');

        printData.batteryInfoType = batteryInfoType;
        // printData.devicesnList = devicesnList;
        printData.devicesn = req.body.devicesn;
        var dataList = await collectionBatterySet.find({deviceSN:printData.devicesn}).sort({timeISO:1}).toArray();
        printData.dataList = dataList;
        printData.timeList = [];
        printData.phoneList = [];
        printData.phoneSnList = [];
        for(var i = 0; i < dataList.length; i++){
            tempPhone = null;
            printData.timeList.push(dataList[i]['timeStamp']);
            for(var j = 0; j < printData.phoneList.length; j++){
                if(printData.phoneList[j].phonesn == dataList[i]['phonesn']){
                    var tempPhone = printData.phoneList[j];
                    break;
                }
            }
            if(!tempPhone){
                var tempPhone = new Object;
                tempPhone.phonesn = dataList[i]['phonesn'];

                tempPhone.data = [];
                printData.phoneList.push(tempPhone);
                printData.phoneSnList.push(dataList[i]['phonesn']);
            }
            tempPhone.data.push([dataList[i]['timeStamp'], dataList[i][batteryInfoType]])
        }

        printData.phoneInfoList = [];
        for(var i = 0; i < printData.phoneSnList.length; i++){
            var phoneInfo = await collectionPhoneSet.find({"phonesn":printData.phoneSnList[i]}).toArray();
            printData.phoneInfoList.push(phoneInfo[0]);
        }
        client.close();
        res.send(JSON.stringify(printData));
    })();
}