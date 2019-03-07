
exports.setRequestUrl=function(app){
    var chart = require('./controllers/chart')
    app.get('/simple', chart.initChart)
    app.post('/update', chart.updateChart)
    app.get('/all', chart.allChart)
    app.get('/timeline', chart.timeline)

    var echart = require('./controllers/echart')
    app.get('/', echart.initEchart)
    app.post('/echartUpdate', echart.updateEChart)
}
