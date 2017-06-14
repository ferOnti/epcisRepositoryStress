var global = require('./global')
var config = require('./config')

var MongoClient = require('mongodb').MongoClient
var dateFormat = require('dateformat');
var fs = require('fs')
var fsXml = require('./fsXml')
var sprintf = require('sprintf').sprintf;

var thisStep = 4

var cursor 
var iterateResolve
var iterateReject
var numPallets
var numCases
var numItems
var casesBuffer

function updateItems(parentId, caseListArray) {
	var db = global.db
	var collection = db.collection('stress_products');
	//var criteria = {"case": {"$in": caseListArray} }
	var criteria = { parentIds : {"$in": caseListArray}  }

	var update   = {
		$set: {step: thisStep},
		$addToSet: {parentIds : parentId},
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
	var update   = {$set: {step: thisStep, parentId : parentId}}
	var options  = {"multi" : true}

	return new Promise(function (resolve, reject) { 
	    collection.update(criteria, update, options, function(err, res) {
	    	if (err) {
	    		reject(err)
	    	} else {
	    		numPallets++
	    		numCases += res.result.n
		    	resolve(res.result)
	    	}
	    })
	})
}

function updatePalletDoc(palletDoc) {
	var db = global.db
	var collection = db.collection('stress_cases');

	return new Promise(function (resolve, reject) { 
	    collection.insert(palletDoc, function(err, res) {
	    	if (err) {
	    		reject(err)
	    	} else {
		    	resolve(res.result)
	    	}
	    })
	})
}

function buildAggregationPallets(docs) {
	step = config.steps[thisStep]
    var template = step.template

	var collection = global.db.collection('stress_products');
	//var criteria = {epcClass: doc.epcClass, step:2}

	//prepare the output xml
	var epcList = ""
    var now       = global.getNextCurrentDate()
	var eventTime = dateFormat(now, "isoUtcDateTime");
	var eventId   = global.getNextEventId()
	var sb        = fs.readFileSync( template).toString()
	var point     = Math.round(Math.random()*1000)+1
	var readPoint = sprintf("urn:epc:id:sgln:0012345.%05d.0", point)
	var bizLocation = sprintf("urn:epc:id:sgln:0012345.%04d", point)
	var palletId  = global.getNextParentIdFromPallets()

	epcList = ""
	var caseListArray = []
	for (docIndex in docs) {
		doc = docs[docIndex]
		caseListArray.push(doc.case)
		if (epcList!="") {epcList+="\n"}
		epcList += "\t\t"
   		epcList += sprintf("<epc>%s</epc>", doc.case) 
	}
	sb = sb.replace("{eventTime}",   eventTime )
	sb = sb.replace("{recordTime}",  eventTime )
	sb = sb.replace("{eventId}",     eventId )
	sb = sb.replace("{readPoint}",   readPoint )
	sb = sb.replace("{bizLocation}", bizLocation )
	sb = sb.replace("{parentID}", palletId )
	sb = sb.replace("{epcList}", epcList )

	//store the xml in the outputfile
	fsXml.saveToXml(thisStep, eventId, sb)
		
	return new Promise(function (resolve, reject) { 
		//create pallet in db with a promise
		var palletDoc = {
			case:     palletId, 
			eventId:  eventId, 
			step:     thisStep, 
			caseList:  caseListArray
		}
		updatePalletDoc(palletDoc)
			.then( () => {return updateCases(palletId, caseListArray)} )
			.then( () => {return updateItems(palletId, caseListArray)} )
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
					casesBuffer.push(item)
					if (Math.random()>step.poPercentage) {
						//console.log("  " + item.case + " " + casesBuffer.length)
						buildAggregationPallets(casesBuffer).then( function () {	
							casesBuffer = []
		        			process.nextTick( iterateCursor)
		        		})
					} else {
						//console.log("+ " + item.case)
						process.nextTick( iterateCursor)
					}
	        	}
	        })
    	} else {
			console.log("         packed pallets: %d" ,numPallets)
			console.log("           packed cases: %d" ,numCases)
			console.log("        packed products: %d" ,numItems)
    		iterateResolve()
    	}
    })	
}

function step4() {
	var db = global.db
	var step = config.steps[thisStep]

	var collection = db.collection('stress_cases');

	console.log("step " + thisStep + ": " +step.name)
	numPallets = 0
	numCases = 0
	numItems = 0
	casesBuffer = []

	return new Promise(function (resolve, reject) { 
	    cursor = collection.find({step:3});

		iterateResolve = resolve
		iterateReject  = reject

		iterateCursor()

	})
}

module.exports.execute = step4


