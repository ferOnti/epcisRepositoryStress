var global = require('./global')
var config = require('./config')

var MongoClient = require('mongodb').MongoClient
var dateFormat = require('dateformat');
var fs = require('fs')
var fsXml = require('./fsXml')
var sprintf = require('sprintf').sprintf;
var thisStep = 3

var cursor 
var iterateResolve
var iterateReject
var numCases
var numItems

function updateChildrenStep(epcList, caseId, eventId) {
	var db = global.db
	var collection = db.collection('stress_products');
	var criteria = {"epcid": {$in:epcList} }
	var update   = {$set: {step: thisStep, eventId: eventId}}
	var options  = {"multi" : true}

	return new Promise(function (resolve, reject) { 
	    collection.update(criteria, update, options, function(err, res) {
	    	if (err) {
	    		reject(err)
	    	} else {
		    	numItems+= res.result.n
		    	resolve(res.result)
	    	}
	    })
	})
}

function updateCaseStep(caseId, eventId) {
	var db = global.db
	var collection = db.collection('stress_cases');
	var criteria = {"case": caseId }
	var update   = {$set: {step: thisStep, eventId: eventId}}
	var options  = {}

	return new Promise(function (resolve, reject) { 
	    collection.update(criteria, update, options, function(err, res) {
	    	if (err) {
	    		reject(err)
	    	} else {
	    		numCases++
		    	resolve(res.result)
	    	}
	    })
	})
}

function buildPrintCases(doc) {
	step = config.steps[thisStep]
    var template = step.template

	//process only a percentage of records
	if (Math.random() > step.poPercentage) {
		return new Promise(function (resolve, reject) { 
			resolve( sprintf("no picking  %s", doc.case))
		})
	}
	var collection = global.db.collection('stress_cases');
	var criteria = {epcClass: doc.epcClass, step:2}

	//prepare the output xml
	var epcList = ""
    var now = global.getNextCurrentDate()
	var eventTime = dateFormat(now, "isoUtcDateTime");
	var eventId   = global.getNextEventId()
	var sb    = fs.readFileSync( template).toString()
	var point = Math.round(Math.random()*1000)+1
	var readPoint = sprintf("urn:epc:id:sgln:0012345.%05d.0", point)
	//var bizLocation = sprintf("urn:epc:id:sgln:0012345.%04d", point)
	var bizLocation = "urn:epc:id:sgln:01234567.4650.0001"

	var epcList = sprintf("\t\t<epc>%s</epc>", doc.case) 
	var bizTx = global.getNextPurchaseOrderNumber()

	sb = sb.replace("{eventTime}",   eventTime )
	sb = sb.replace("{recordTime}",  eventTime )
	sb = sb.replace("{eventId}",     eventId )
	sb = sb.replace("{readPoint}",   readPoint )
	sb = sb.replace("{bizLocation}", bizLocation )
	sb = sb.replace("{epcList}",     epcList )
	sb = sb.replace("{bizTx}", bizTx )

	return new Promise(function (resolve, reject) { 
		//store the xml in the outputfile
		fsXml.saveToXml(thisStep, eventId, sb)

		//updateDB marking these products as step3, poNumber 
		return updateCaseStep(doc.case, eventId).then(() => {
			//updateDB marking the epcid children to step3
			updateChildrenStep(doc.epcList, doc.case, eventId).then(resolve)
		});
	})
}

function iterateCursor() {
	step = config.steps[thisStep]

	count  = (++global.count)

	cursor.hasNext( function (err, open) {
		if (open) {
	     	cursor.next(function(err, item) {
				if (err) {
					console.error(err)
					iterateReject(err)
				}
				if (item == null) {
					iterateResolve()				
				} else {
					buildPrintCases(item).then( function () {	
	        			process.nextTick( iterateCursor)
	        		})

	        	}
	        })
    	} else {
			console.log("        cases   labeled: %d" ,numCases)
			console.log("        items  in cases: %d" ,numItems)
    		iterateResolve()
    	}
    })	
}

function step3() {
	var db = global.db
	var step = config.steps[thisStep]

	var collection = db.collection('stress_cases');

	console.log("step " + thisStep + ": " +step.name)
	numCases = 0
	numItems = 0

	return new Promise(function (resolve, reject) { 
	    cursor = collection.find({step:2});

		iterateResolve = resolve
		iterateReject  = reject

		iterateCursor()

	})
}

module.exports.execute = step3


