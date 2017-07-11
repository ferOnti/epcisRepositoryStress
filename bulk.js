config = require('./config.bulk.json');

var filename= config.output
var count = 0
var skip = config.start

var sleep = require('sleep');

//var request = require('then-request');
var request = require('sync-request');

 LineByLineReader = require('line-by-line'),
    lr = new LineByLineReader(filename);

lr.on('error', function (err) {
	// 'err' contains error object
    console.log(err)
});

lr.on('line', function (line) {
    count ++
    if (skip > count) { return }
    var time = new Date().getTime() & 100000
    console.log("=============== " + count + "    " + time)

    options = {
        "headers": {"Content-type":"application/xml", "channel": config.channelName },
        body: line
    }

    try {
        var res = request('POST', config.server + '/api/epcis/event', options)
        if (res.statusCode != 200) {
            console.log(res.statusCode, "" + res.body)
            delay() 
            return
        }
        console.log(""+res.body)
    } catch (err) {
        console.log(err.message)
    }

    delay()

});

lr.on('end', function () {
	// All lines are read, file is closed now.
});

function delay() {
    sleep.msleep( config.sleep)
    console.log(".")
}


