var global = require('./global')
var config = require('./config')

var MongoClient = require('mongodb').MongoClient
var dateFormat = require('dateformat');
var fs = require('fs')
var fsXml = require('./fsXml')
var sprintf = require('sprintf').sprintf;
var thisStep = 1

var cursor 
var iterateResolve
var iterateReject
var numDocs
var numItems


function iterateCursor() {
	resolve = iterateResolve
	reject  = iterateReject
	step = config.steps[thisStep]

	count  = (++global.count)
	//if (count % 1000 == 0) {console.log("      " + count)}

	cursor.hasNext( function (err, open) {
		if (open) {
	     	cursor.next(function(err, item) {
				if (err) {
					console.error(err)
					reject(err)
				}
				if (item == null) {
					resolve()				
				} else {
	        		r = Math.round(Math.random()*step.randomItemsProduced*1.3)
	        		if (r > step.randomItemsProduced) {
	        			r = step.randomItemsProduced
	        		}
					numDocs++
					numItems += r

					buildObjectEventAdd(item, r, step).then( function () {	
	        			process.nextTick( iterateCursor)
	        		})
	        	}
	        })
    	} else {
			console.log("        epcClass: %d" ,numDocs)
			console.log("        epcids:   %d" ,numItems)
    		resolve()
    	}
    })	
}

function step1() {

	var db = global.db
	var step = config.steps[thisStep]

	var collection = db.collection('products');
	var limit = step.n
	var skip  = step.offset

	global.count = 0
	numDocs = 0
	numItems = 0
	console.log("step " + thisStep + ": " +step.name)

    // Grab a cursor using the find
    cursor = collection.find().limit(limit).skip(skip);

	return new Promise(function (resolve, reject) { 
		iterateResolve = resolve
		iterateReject  = reject

		iterateCursor()
    })
}

function saveEpcidInstantiated(doc) {
	var db = global.db
	var collection = db.collection('stress_products');
	return new Promise(function (resolve, reject) { 
	    collection.insert(doc, function(err, res) {
	    	if (err) {
	    		reject(err)
	    	} else {
		    	resolve(res.result)
	    	}
	    })
	})
}

//build n instances (item level) of the same epcClass
function buildObjectEventAdd(doc, n, step) {
    var template = step.template
     
    var now = global.getNextCurrentDate()
	var eventTime = dateFormat(now, "isoUtcDateTime");
	var eventId   = global.getNextEventId()
 
    var skuNumber = doc.value.skuNumber * 1
    var epcList = ""
    var epcidPromises = []
    var epcidDoc = {}
	var point = Math.round(Math.random()*9999)
	var subpoint = Math.round(Math.random()*9999)
	var readPoint = sprintf("urn:epc:id:sgln:01234567.%04d.%05d", point,subpoint)
	//var bizLocation = sprintf("urn:epc:id:sgln:01234567.%04d.0001", point)
	var bizLocation = "urn:epc:id:sgln:01234567.4650.0001"

	var thingList = ""

    //loop to store n item-level instances in the database and build the epcList string
	var subSkuNumber = Math.round(Math.random()*10000)
	for (var i = 0; i<n; i++) {
		var epcid = sprintf("urn:epc:id:sgtin:%08d.%05d.%010d", skuNumber, subSkuNumber, i+1)  
		var epcClass = sprintf("urn:epc:idpat:sgtin:%08d:%05d.*", skuNumber, subSkuNumber)  
		if (epcList!="") {epcList+="\n"}
		epcList += "\t\t"
        epcList += sprintf("<epc>%s</epc>", epcid) 

        //save and return the promise in the array of promises
		epcidDoc = {}
		epcidDoc.epcid = epcid
		epcidDoc.name = doc.value.product.trim()
		epcidDoc.step = thisStep
		epcidDoc.epcClass = epcClass
		epcidDoc.bizStep = "urn:epcglobal:cbv:bizstep:creating_class_instance"
		epcidDoc.bizLocation = bizLocation
		epcidDoc.disposition = "urn:epcglobal:cbv:disp:encoded"
		epcidDoc.readPoint = readPoint
		epcidDoc.eventTime = eventTime
		epcidDoc.recordTime = eventTime
		epcidDoc.eventId = eventId
		epcidDoc.parentIds = []

		thing = ""
		for (key in doc.value) {
			let keyname = key
			if (key != "name" && key != "serialNumber" && key != "store" && key != "location") {
				value = ""+doc.value[key]
				value = value.trim()
				value = value.replace("&", "and")

				if (key == "product") { keyname = "name" }

				epcidDoc[keyname] = value
				thing += sprintf('\t\t\t<vizix:thingfield name="%s">%s</vizix:thingfield>\n', keyname, value)
			}
		}
		if (thing != "") {
			thing = sprintf('\t\t<vizix:thing epcid="%s">\n%s\t\t</vizix:thing>\n', epcid, thing)
			thingList += thing
		}
        epcidPromises.push(saveEpcidInstantiated(epcidDoc))
	}
	if (thingList != "") {
		thingList = sprintf('\t<vizix:thingList>\n%s\t</vizix:thingList>\n', thingList)
	}

	var sb = fs.readFileSync( template).toString()
	sb = sb.replace("{epcList}",     epcList )
	sb = sb.replace("{readPoint}",   readPoint )
	sb = sb.replace("{bizLocation}", bizLocation )
	sb = sb.replace("{eventTime}",   eventTime )
	sb = sb.replace("{recordTime}",  eventTime )
	sb = sb.replace("{eventId}",     eventId )
	sb = sb.replace("{thingList}",   thingList)
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


module.exports.execute = step1

