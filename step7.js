var global = require('./global')
var config = require('./config')

var MongoClient = require('mongodb').MongoClient
var dateFormat = require('dateformat');
var fs = require('fs')
var fsXml = require('./fsXml')
var sprintf = require('sprintf').sprintf;

var thisStep = 7

var cursor 
var iterateResolve
var iterateReject
var numPos
var numCases
var numItems

function updateItems(parentId, caseListArray) {
	var db = global.db
	var collection = db.collection('stress_products');
	//var criteria = {"case": {"$in": caseListArray} }
	var criteria = { parentIds : {"$in": caseListArray}  }

	var update   = {
		$set: {step: thisStep, "bizStep": "urn:epcglobal:cbv:bizstep:shipping"},
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

function updateCases(parentId, caseListArray) {
	var db = global.db
	var collection = db.collection('stress_cases');
	var criteria = {"case": {"$in": caseListArray} }
	var update   = {$set: {step: thisStep, bizStep: "urn:epcglobal:cbv:bizstep:shipping"}}
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
	var update   = {$set: {step: thisStep, bizStep: "sending"}}
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

function buildReceivePallets(doc) {
	step = config.steps[thisStep]
    var template = step.template

	//process only a percentage of records
	if (Math.random() > step.poPercentage) {
		return new Promise(function (resolve, reject) { 
			resolve( sprintf("no sending"))
		})
	}
	var collection = global.db.collection('stress_cases');
	var criteria = {step:4, parentId: doc.pallet}

	//prepare the output xml
	var epcList = ""
    var now = global.getNextCurrentDate()
	var eventTime = dateFormat(now, "isoUtcDateTime");
	var eventId   = global.getNextEventId()
	var sb    = fs.readFileSync( template).toString()
	var point = Math.round(Math.random()*1000)+1
	var readPoint = sprintf("urn:epc:id:sgln:0012345.%05d.0", point)
	//var bizLocation = sprintf("urn:epc:id:sgln:0012345.%04d", point)
	var bizLocation = "urn:epc:id:sgln:09876543.0000.9876"
	//var bizTx = doc.po
	sb = sb.replace("{eventTime}",   eventTime )
	sb = sb.replace("{recordTime}",  eventTime )
	sb = sb.replace("{eventId}",     eventId )
	sb = sb.replace("{readPoint}",   readPoint )
	sb = sb.replace("{bizLocation}", bizLocation )
	//sb = sb.replace("{bizTx}", bizTx )


	return new Promise(function (resolve, reject) { 
		//store the xml in the outputfile
		fsXml.saveToXml(thisStep, eventId, sb)
		caseListArray = doc.caseList
		updatePalletDoc(doc.pallet)
			.then( () => {return updateCases(doc.pallet, caseListArray)} )
			.then( () => {return updateItems(doc.pallet, caseListArray)} )
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
					buildReceivePallets(item).then( function () {	
	        			process.nextTick( iterateCursor)
	        		})

	        	}
	        })
    	} else {
			console.log("           sent pallets: %d" ,numPallets)
			console.log("             sent cases: %d" ,numCases)
			console.log("             sent items: %d" ,numItems)
    		iterateResolve()
    	}
    })	
}

function step6() {
	var db = global.db
	var step = config.steps[thisStep]

	var collection = db.collection('stress_pallets');

	console.log("step " + thisStep + ": " +step.name)
	numItems = 0
	numCases = 0
	numPallets = 0

	return new Promise(function (resolve, reject) { 
	    cursor = collection.find({step:6});

		iterateResolve = resolve
		iterateReject  = reject

		iterateCursor()

	})
}

module.exports.execute = step6



