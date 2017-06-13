var global = require('./global')
var config = require('./config')

var MongoClient = require('mongodb').MongoClient
var dateFormat = require('dateformat');
var fs = require('fs')
var sprintf = require('sprintf').sprintf;

var cursor 
var iterateResolve
var iterateReject
var numCases

function updateEpcidStep(epcClass, epcListArray, parentId) {
	var db = global.db
	var collection = db.collection('stress_products');
	var criteria = {"epcClass": epcClass}
	if (epcListArray) {
		criteria = {"epcClass": epcClass, epcid : {"$in": epcListArray}}
	}
	var update   = {$set: {step: 2, parentIds: [parentId]}}
	var options  = {"multi" : true}

	return new Promise(function (resolve, reject) { 
	    collection.update(criteria, update, options, function(err, res) {
	    	if (err) {
	    		reject(err)
	    	} else {
		    	resolve(res.result)
	    	}
	    })
	})
}

function updateCaseID(caseDoc) {
	var db = global.db
	var collection = db.collection('stress_cases');

	return new Promise(function (resolve, reject) { 
	    collection.insert(caseDoc, function(err, res) {
	    	if (err) {
	    		reject(err)
	    	} else {
		    	resolve(res.result)
	    	}
	    })
	})
}

function buildPackItemIntoCase(doc) {
	step = config.steps["2"]
    var template = step.template
     
	//process only a percentage of records
	if (Math.random() > step.poPercentage) {
		return new Promise(function (resolve, reject) { 
				resolve( sprintf("no packing for ", doc._id))
		})
	}

    var now = global.getNextCurrentDate()
	var eventTime = dateFormat(now, "isoUtcDateTime");
	var eventId   = global.getNextEventId()
	var point    = Math.round(Math.random()*9999)
	var subpoint = Math.round(Math.random()*9999)
	var readPoint   = sprintf("urn:epc:id:sgln:01234567.%04d.%05d", point,subpoint)
	var bizLocation = sprintf("urn:epc:id:sgln:01234567.%04d.0001", point)

	var epcClass = doc._id

	//packing almost all items in a new case
	var quantity = Math.round(Math.random()*doc.sum + doc.sum/3)
	if (quantity>doc.sum) {quantity = doc.sum}

	return new Promise(function (resolve, reject) { 
		var epcClassQuantity = doc.sum
		var parentIdAsCase = global.getNextParentIdFromCases()
		var criteria = {epcClass: epcClass, step:1}

		var collection = global.db.collection('stress_products');
		var cursor = collection.find(criteria).limit(quantity).toArray(function(err, docs) {
			epcListArray = []
			epcList = ""
			for (var i=0; i<docs.length; i++) {
				var epcid = docs[i].epcid
				epcListArray.push(epcid)
				if (epcList!="") {epcList+="\n"}
	 				epcList += "\t\t"
	       		epcList += sprintf("<epc>%s</epc>", epcid) 
			}

			var sb = fs.readFileSync( template).toString()
			sb = sb.replace("{eventTime}",   eventTime )
			sb = sb.replace("{recordTime}",  eventTime )
			sb = sb.replace("{eventId}",     eventId )
			sb = sb.replace("{parentID}",    parentIdAsCase )
			sb = sb.replace("{readPoint}",   readPoint )
			sb = sb.replace("{bizLocation}", bizLocation )
			sb = sb.replace("{epcList}",     epcList )

		    if (step.saveToXml) {
				if (step.savePrettyXml) {
				    fs.appendFileSync(config.outputXmlFile, sb + "\n");
				} else {
					//convert pretty xml to one line xml and save it
					var flatXml = sb.replace(/\t/g, "").replace(/\n/g, "")
			    	//console.log(flatXml + "\n") 
			    	fs.appendFileSync(config.outputXmlFile, flatXml + "\n");
			    }
			}

			numCases++

			//update db with a promise
			var caseDoc = {
				case:     parentIdAsCase, 
				epcClass: epcClass, 
				epcClassQuantity: epcClassQuantity,
				quantity: quantity,
				eventId:  eventId, 
				step:     2, 
				epcList:  epcListArray
			}
			updateEpcidStep(epcClass, epcListArray, parentIdAsCase)
				.then( () => {return updateCaseID(caseDoc)} )
				.then( function(res) {
					resolve( quantity)
				})
		})

	})
}

function iterateCursor() {
	step = config.steps["2"]

	count  = (++global.count)

	cursor.hasNext( function (err, open) {
		if (open) {
	     	cursor.next(function(err, doc) {
				if (err) {
					console.error(err)
					iterateReject(err)
				}
				if (doc == null) {
					iterateResolve()				
				} else {

					buildPackItemIntoCase(doc).then( function () {	
	        			process.nextTick( iterateCursor)
	        		})

	        	}
	        })
    	} else {
			console.log("        packed    cases: %d" ,numCases)
    		iterateResolve()
    	}
    })	
}

function step2() {
	var db = global.db
	var step = config.steps["2"]

	var collection = db.collection('stress_products');
	numCases = 0
	console.log("step 2: " +step.name)

	return new Promise(function (resolve, reject) { 
		pipeline = [
		    { "$match": { step: 1 }},
		    { "$group": { _id: "$epcClass", "sum": { $sum: 1 } } },
		    { "$sort" : { "sum": -1} }
		]
		cursor = collection.aggregate(pipeline)

		iterateResolve = resolve
		iterateReject  = reject

		iterateCursor()

	})
}

module.exports.execute = step2


