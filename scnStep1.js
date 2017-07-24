var global = require('./global')
var config = require('./config')

var MongoClient = require('mongodb').MongoClient
var dateFormat = require('dateformat');
var fs = require('fs')
var fsXml = require('./fsXml')
var sprintf = require('sprintf').sprintf;
var thisStep = 1

var step
var iteration
var iterationLimit
var iterateResolve
var iterateReject
var numDocs
var numItems

var sgtin1 = 0
var sgtin2 = 0
var sgtinOut = 0
var epcClass1 = 0
var epcClass2 = 0


function saveEpcidInstantiated(doc) {
	var db = global.db
	var collection = db.collection('stress_products');
	return new Promise(function (resolve, reject) { 
	    collection.insert(doc, function(err, res) {
	    	if (err) {
	    		reject(err)
	    	} else {
	    		numItems++ //increase the number of items
		    	resolve(res.result)
	    	}
	    })
	})
}


//build n instances (item level) of the same epcClass
function buildTransformEvent(step) {
    var template = step.template
     
    var now = global.getNextCurrentDate()
	var eventTime = dateFormat(now, "isoUtcDateTime");
	var eventId   = global.getNextEventId()
	var point = Math.round(Math.random()*9999)
	var subpoint = Math.round(Math.random()*9999)
	var readPoint = sprintf("urn:epc:id:sgln:01234567.%04d.%05d", point,subpoint)
	var bizLocation = "urn:epc:id:sgln:01234567.4650.0001"

 
  	var inputSgtin1 = sprintf("<epc>%s.%05d</epc>",step.sgtin1, ++sgtin1)
  	var inputSgtin2 = sprintf("<epc>%s.%05d</epc>",step.sgtin2, ++sgtin2)
  	var inputSgtin3 = sprintf("<epc>%s.%05d</epc>",step.sgtin2, ++sgtin2)
  	var inputEpcList = sprintf("\t\t%s\n\t\t%s\n\t\t%s", inputSgtin1, inputSgtin2, inputSgtin3)
  	
  	var outputEpcList = ""
    var epcidPromises = []
    var epcidDoc = {}
    var outItems = Math.round(step.outputEpcs * (1 + Math.random()*0.10)) // a 10% of variance in items produced

    for (outEpcs = 1; outEpcs <= outItems; outEpcs++) {
	  	var epcid = sprintf("%s.%05d", step.sgtinOut, ++sgtinOut)
		if (outputEpcList!="") {outputEpcList+="\n"}
		outputEpcList += "\t\t"
        outputEpcList += sprintf("<epc>%s</epc>", epcid) 

        //save and return the promise in the array of promises
		epcidDoc = {}
		epcidDoc.epcid = epcid
		epcidDoc.step = thisStep
		epcidDoc.epcClass = step.sgtinOut
		epcidDoc.maxItemsPerCase = step.maxItemsPerCase
		epcidDoc.bizStep = "urn:epcglobal:cbv:bizstep:commissioning"
		epcidDoc.bizLocation = bizLocation
		epcidDoc.disposition = "urn:epcglobal:cbv:disp:in_progress"
		epcidDoc.readPoint = readPoint
		epcidDoc.eventTime = eventTime
		epcidDoc.recordTime = eventTime
		epcidDoc.eventId = eventId

        epcidPromises.push(saveEpcidInstantiated(epcidDoc))
	}

	var sb = fs.readFileSync( template).toString()
	sb = sb.replace("{inputEPCList}", inputEpcList )
	sb = sb.replace("{outputEPCList}", outputEpcList )
	sb = sb.replace("{readPoint}",   readPoint )
	sb = sb.replace("{bizLocation}", bizLocation )
	sb = sb.replace("{eventTime}",   eventTime )
	sb = sb.replace("{recordTime}",  eventTime )
	sb = sb.replace("{eventId}",     eventId )
	sb = sb.replace("{epcClass1}",   ++epcClass1 )
	sb = sb.replace("{epcClass2}",   ++epcClass2 )

    //console.log(sb + "\n") 

	//store the xml in the outputfile
	fsXml.saveToXml(thisStep, eventId, sb)

	return new Promise(function (resolve, reject) { 
		var allEpcidPromises = Promise.all(epcidPromises)
		allEpcidPromises.then( function(res) {
			var saved = 0;
			for (var i=0; i<res.length;i++) {
				if (res[i].ok && res[i].ok == 1 && res[i].n ) { saved += res[i].n}
			}
			resolve( sprintf("saved %d documents", saved))
		}, function(err) {
			console.error(err)
			reject(err)
		})
	})
}

function iterateFor() {
	resolve = iterateResolve
	reject  = iterateReject
	//step = config.steps[thisStep]

	count  = (++global.count)
	//console.log("iterate:" + iteration + "/"+iterationLimit)

	if (iteration <= iterationLimit) {
		buildTransformEvent(step).then( function () {	
			iteration++
			process.nextTick( iterateFor)
		})
	} else {
		console.log("        epcids:   %d" ,numItems)
   		resolve()
   	}

}


function step0() {

	var db = global.db

	if (Math.random() > 0.5) {
		thisConfigStep = "1"
	} else {
		thisConfigStep = "1b"
	}
	step = config.steps[thisConfigStep]

	//var collection = db.collection('products');
	var limit = step.n
	var skip  = step.offset

	global.count = 0
	numDocs = 0
	numItems = 0
	iteration = 1
	iterationLimit = step.n
	console.log("step " + thisStep + ": " +step.name)

	return new Promise(function (resolve, reject) { 
		iterateResolve = resolve
		iterateReject  = reject
		iterateFor()
    })

}

module.exports.execute = step0

