
exports.setRequestUrl=function(app){
	var chart = require('./controllers/chart')
    app.get('/simple_old', chart.initChart)
    app.post('/update_old', chart.updateChart)
    app.get('/timeline_old', chart.timeline)

    var echart = require('./controllers/echart')
    app.get('/', echart.initEchart)
    app.post('/echartUpdate', echart.updateEChart)
    app.get("/all", echart.allPhones)
    app.post("/allUpdate", echart.allPhonesUpdate)
    app.get('/device', echart.getDeviceList)
    app.post('/deviceUpdate', echart.updateDeviceList)
}
