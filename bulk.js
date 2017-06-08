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
    console.log("=============== " + count)
    //if (count > skip+1) { console.log(count); sleep.sleep(1); return }  
 
    //console.log(line)
    options = {"headers": {"Content-type":"application/xml"}}
    options.body = line

    var res = request('POST', 'http://13.82.50.105:3000/api/event', options)
    //.done(function (res) {
        //console.log(res)    
        console.log(("" +res.getBody()).substr(0,240) + "...");
    //});
    //console.log("before sleep")
    sleep.msleep( config.sleep)
    console.log(".")
    sleep.msleep(config.sleep)
    console.log(".")

    //console.log("after sleep")

});

lr.on('end', function () {
	// All lines are read, file is closed now.
});

