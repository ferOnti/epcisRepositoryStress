var global = require('./global')
var config = require('./config')

var MongoClient = require('mongodb').MongoClient
var dateFormat = require('dateformat');
var fs = require('fs')
var sprintf = require('sprintf').sprintf;

var cursor 
var iterateResolve
var iterateReject
var numPos
var numItems

function updateEpcidStep(epcList, po, eventId) {
	var db = global.db
	var collection = db.collection('stress_products');
	var criteria = {"epcid": {$in:epcList} }
	var update   = {$set: {step: 3, eventId: eventId, bizTransaction:[po]}}
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

function updatePurchaseOrderStep(po) {
	var db = global.db
	var collection = db.collection('stress_purchase_orders');
	var criteria = {"po": po }
	var update   = {$set: {step: 3}}
	var options  = {}

	return new Promise(function (resolve, reject) { 
	    collection.update(criteria, update, options, function(err, res) {
	    	if (err) {
	    		reject(err)
	    	} else {
	    		numPos++
		    	resolve(res.result)
	    	}
	    })
	})
}

function buildPurchaseOrder(doc) {
	step = config.steps["3"]
    var template = step.template

	//process only a percentage of records
	if (Math.random() > step.poPercentage) {
		return new Promise(function (resolve, reject) { 
			resolve( sprintf("no picking for purchase order %s", doc.po))
		})
	}
	var collection = global.db.collection('stress_products');
	var criteria = {epcClass: doc.epcClass, step:2}

	//prepare the output xml
	var epcList = ""
    var now = global.getNextCurrentDate()
	var eventTime = dateFormat(now, "isoUtcDateTime");
	var eventId   = global.getNextEventId()
	var sb    = fs.readFileSync( template).toString()
	var point = Math.round(Math.random()*1000)+1
	var readPoint = sprintf("urn:epc:id:sgln:0012345.%05d.0", point)
	var bizLocation = sprintf("urn:epc:id:sgln:0012345.%04d", point)
	var bizTx = doc.po
	sb = sb.replace("{eventTime}",   eventTime )
	sb = sb.replace("{recordTime}",  eventTime )
	sb = sb.replace("{eventId}",     eventId )
	sb = sb.replace("{readPoint}",   readPoint )
	sb = sb.replace("{bizLocation}", bizLocation )
	sb = sb.replace("{bizTx}", bizTx )

	return new Promise(function (resolve, reject) { 
		var epcListArray = []
		var cursor = collection.find(criteria).limit(doc.quantity).toArray(function(err, docs) {
			for (var i=0; i<docs.length; i++) {
				var epcid = docs[i].epcid
				epcListArray.push(epcid)
				if (epcList!="") {epcList+="\n"}
				epcList += "\t\t"
        		epcList += sprintf("<epc>%s</epc>", epcid) 
			}
			//store the xml in the outputfile
			sb = sb.replace("{epcList}",     epcList )
		    if (step.saveToXml) {
		    	//console.log(sb + "\n") 
				//convert pretty xml to one line xml and save it
				var flatXml = sb.replace(/\t/g, "").replace(/\n/g, "")
			    //console.log(flatXml + "\n") 
			    fs.appendFileSync(config.outputXmlFile, flatXml + "\n");
			    //fs.appendFileSync(config.outputXmlFile, sb + "\n");
			}

			//updateDB marking these products as step3, poNumber 
			return updateEpcidStep(epcListArray, bizTx, eventId).then(() => {
				//updateDB marking the purchase order to step3
				updatePurchaseOrderStep(bizTx).then(resolve)
			});
		})
	})
}

function iterateCursor() {
	step = config.steps["3"]

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
					buildPurchaseOrder(item).then( function () {	
	        			process.nextTick( iterateCursor)
	        		})

	        	}
	        })
    	} else {
			console.log("        purchase orders: %d" ,numPos)
			console.log("        picked products: %d" ,numItems)
    		iterateResolve()
    	}
    })	
}

function step3() {
	var db = global.db
	var step = config.steps["3"]

	var collection = db.collection('stress_purchase_orders');

	console.log("step 3: " +step.name)
	numPos = 0
	numItems = 0

	return new Promise(function (resolve, reject) { 
	    cursor = collection.find({step:2});

		iterateResolve = resolve
		iterateReject  = reject

		iterateCursor()

	})
}

module.exports.execute = step3


