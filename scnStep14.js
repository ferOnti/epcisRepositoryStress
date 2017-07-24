var global = require('./global')
var config = require('./config')

var MongoClient = require('mongodb').MongoClient
var dateFormat = require('dateformat');
var fs = require('fs')
var fsXml = require('./fsXml')
var sprintf = require('sprintf').sprintf;

var thisStep = 14

var cursor 
var iterateResolve
var iterateReject
var numPos
var numCases
var numItems
var epcidBuffer = []

function updateItems(epcidList, bizStep, disposition) {
	var db = global.db
	var collection = db.collection('stress_products');
	var criteria = { epcid : { "$in" : epcidList } }

	var update   = {
		$set: {step: thisStep, "bizStep": bizStep, "disposition": disposition}
	}
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

function updateCases(parentId) {
	var db = global.db
	var collection = db.collection('stress_cases');
	var criteria = {"case": parentId }
	var update   = {$set: {step: thisStep, bizStep: "urn:epcglobal:cbv:bizstep:unpacking"}}
	var options  = {"multi" : true}

	return new Promise(function (resolve, reject) { 
	    collection.update(criteria, update, options, function(err, res) {
	    	if (err) {
	    		reject(err)
	    	} else {
	    		numCases += res.result.n
		    	resolve(res.result)
	    	}
	    })
	})
}

function updatePalletDoc(palletId) {
	var db = global.db
	var collection = db.collection('stress_pallets');
	var criteria = {"pallet": palletId }
	var update   = {$set: {step: thisStep, bizStep: "unpacking"}}
	var options  = {"multi" : false}

	return new Promise(function (resolve, reject) { 
	    collection.update(criteria, update, options, function(err, res) {
	    	if (err) {
	    		reject(err)
	    	} else {
	    		numPallets++
		    	resolve(res.result)
	    	}
	    })
	})
}

function buildStockingProducts(docs) {
	step = config.steps[thisStep]
    var template = step.template

	//process only a percentage of records
	if (Math.random() > step.poPercentage) {
		return new Promise(function (resolve, reject) { 
			resolve( sprintf("no sending"))
		})
	}

	//prepare the output xml
    var now = global.getNextCurrentDate()
	var eventTime = dateFormat(now, "isoUtcDateTime");
	var eventId   = global.getNextEventId()
	var sb    = fs.readFileSync( template).toString()
	var point = Math.round(Math.random()*1000)+1
	var readPoint = sprintf("urn:epc:id:sgln:0012345.%05d.0", point)
	var bizLocation = "urn:epc:id:sgln:09876543.0000.9876"
	var epcList = ""
	var epcListArray = []
	for (id in docs) {
		epcList += sprintf("\t\t<epc>%s</epc>\n", docs[id].epcid) 
		epcListArray.push(docs[id].epcid)
	}
	
	vocBizstep = "stocking"
	bizStep = "urn:epcglobal:cbv:bizstep:" + vocBizstep
	vocDisposition = "sellable_accessible"
    disposition = "urn:epcglobal:cbv:disp:" + vocDisposition

	sb = sb.replace("{eventTime}",   eventTime )
	sb = sb.replace("{recordTime}",  eventTime )
	sb = sb.replace("{eventId}",     eventId )
	sb = sb.replace("{readPoint}",   readPoint )
	sb = sb.replace("{bizLocation}", bizLocation )
	sb = sb.replace("{epcList}",     epcList )
	sb = sb.replace("{bizStep}",     vocBizstep )
	sb = sb.replace("{disposition}", vocDisposition )


	return new Promise(function (resolve, reject) { 
		//store the xml in the outputfile
		fsXml.saveToXml(thisStep, eventId, sb)
		updateItems(epcListArray, bizStep, disposition)
			.then( function(res) {
				resolve()
			})

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
					epcidBuffer.push(item)
					if (epcidBuffer.length >= 30) {
						buildStockingProducts(epcidBuffer).then( function () {	
							epcidBuffer = []
	        				process.nextTick( iterateCursor)
	        			})
					} else {
        				process.nextTick( iterateCursor)
					}

	        	}
	        })
    	} else {
			console.log("           unpack items: %d" ,numItems)
    		iterateResolve()
    	}
    })	
}

function step14() {
	var db = global.db
	var step = config.steps[thisStep]

	var collection = db.collection('stress_products');

	console.log("step " + thisStep + ": " +step.name)
	numItems = 0
	numCases = 0
	numPallets = 0

	return new Promise(function (resolve, reject) { 
	    cursor = collection.find({step:13});

		iterateResolve = resolve
		iterateReject  = reject

		iterateCursor()

	})
}

module.exports.execute = step14



