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

function updateEpcidStep(epcClass) {
	var db = global.db
	var collection = db.collection('stress_products');
	var criteria = {"epcClass": epcClass}
	var update   = {$set: {step: 2}}
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

function addPurchaseOrder(poDoc) {
	var db = global.db
	var collection = db.collection('stress_purchase_orders');

	return new Promise(function (resolve, reject) { 
	    collection.insert(poDoc, function(err, res) {
	    	if (err) {
	    		reject(err)
	    	} else {
		    	resolve(res.result)
	    	}
	    })
	})
}

function buildPurchaseOrder(doc) {
	step = config.steps["2"]
    var template = step.template
     
	//process only a percentage of records
	if (Math.random() > step.poPercentage) {
		return new Promise(function (resolve, reject) { 
				resolve( sprintf("no purchase order for ", doc._id))
		})
	}

    var now = global.getNextCurrentDate()
	var eventTime = dateFormat(now, "isoUtcDateTime");
	var eventId   = global.getNextEventId()

	var epcClass = doc._id
	//have a purchase order with at least 1 product
	var quantity = Math.round(Math.random()*doc.sum)+1
	if (quantity>doc.sum) {quantity = doc.sum}
	var poNumber = global.getNextPurchaseOrderNumber()

	var sb = fs.readFileSync( template).toString()
	sb = sb.replace("{eventTime}",   eventTime )
	sb = sb.replace("{recordTime}",  eventTime )
	sb = sb.replace("{eventId}",     eventId )
	sb = sb.replace("{quantity}",    quantity )
	sb = sb.replace("{bizTx}",       poNumber )
	sb = sb.replace("{epcClass}",    epcClass )

    if (step.saveToXml) {
		//convert pretty xml to one line xml and save it
		var flatXml = sb.replace(/\t/g, "").replace(/\n/g, "")
	    //console.log(flatXml + "\n") 
	    fs.appendFileSync(config.outputXmlFile, flatXml + "\n");
	    //fs.appendFileSync(config.outputXmlFile, sb + "\n");
	}

	numPos++
	var poDoc = {po:poNumber, epcClass:epcClass, quantity: quantity, step:2}

	return new Promise(function (resolve, reject) { 
		updateEpcidStep(epcClass)
			.then( () => {return addPurchaseOrder(poDoc)} )
			.then( function(res) {
				resolve( quantity)
			})
	})
}

function iterateCursor() {
	step = config.steps["2"]

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
    		iterateResolve()
    	}
    })	
}

function step2() {
	var db = global.db
	var step = config.steps["2"]

	var collection = db.collection('stress_products');
	numPos = 0
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


