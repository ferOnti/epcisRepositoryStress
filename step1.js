var global = require('./global')
var config = require('./config')

var MongoClient = require('mongodb').MongoClient
var dateFormat = require('dateformat');
var fs = require('fs')
var sprintf = require('sprintf').sprintf;

var cursor 
var iterateResolve
var iterateReject
var numDocs
var numItems


function iterateCursor() {
	resolve = iterateResolve
	reject  = iterateReject
	step = config.steps["1"]

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
	        		r = Math.round(Math.random()*step.randomItemsProduced)
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
	var step = config.steps["1"]

	var collection = db.collection('products');
	var limit = step.n
	var skip  = step.offset

	global.count = 0
	numDocs = 0
	numItems = 0
	console.log("step 1: " +step.name)

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
	var point = Math.round(Math.random()*1000)+1
	var readPoint = sprintf("urn:epc:id:sgln:0012345.%05d.0", point)
	var bizLocation = sprintf("urn:epc:id:sgln:0012345.%04d", point)
	var thingList = ""

    //loop to store n item-level instances in the database and build the epcList string
	var subSkuNumber = Math.round(Math.random()*10000)
	for (var i = 0; i<r; i++) {
		var epcid = sprintf("urn:epc:id:sgtin:%08d:%05d:%016d", skuNumber, subSkuNumber, i+1)  
		var epcClass = sprintf("urn:epc:id:sgtin:%08d:%05d", skuNumber, subSkuNumber)  
		if (epcList!="") {epcList+="\n"}
		epcList += "\t\t"
        epcList += sprintf("<epc>%s</epc>", epcid) 

        //save and return the promise in the array of promises
		epcidDoc = {}
		epcidDoc.epcid = epcid
		epcidDoc.name = doc.value.product.trim()
		epcidDoc.step = 1
		epcidDoc.epcClass = epcClass
		epcidDoc.bizStep = "urn:epcglobal:cbv:bizstep:creating_class_instance"
		epcidDoc.bizLocation = bizLocation
		epcidDoc.disposition = "urn:epcglobal:cbv:disp:encoded"
		epcidDoc.readPoint = readPoint
		epcidDoc.eventTime = eventTime
		epcidDoc.recordTime = eventTime
		epcidDoc.eventId = eventId

		thing = ""
		for (key in doc.value) {
			if (key != "name" && key != "serialNumber" && key != "product") {
				value = ""+doc.value[key]
				epcidDoc[key] = value.trim()
				thing += sprintf('\t\t\t<thingfield name="%s">%s</thingfield>\n', key, doc.value[key])
			}
		}
		if (thing != "") {
			thing = sprintf('\t\t<thing epcid="%s">\n%s\t\t</thing>\n', epcid, thing)
			thingList += thing
		}
        epcidPromises.push(saveEpcidInstantiated(epcidDoc))
	}
	if (thingList != "") {
		thingList = sprintf('\t<thingList>\n%s\t</thingList>\n', thingList)
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

    if (step.saveToXml) {
		//convert pretty xml to one line xml and save it
		var flatXml = sb.replace(/\t/g, "").replace(/\n/g, "")
	    //console.log(flatXml + "\n") 
	    fs.appendFileSync(config.outputXmlFile, flatXml + "\n");
	    //fs.appendFileSync(config.outputXmlFile, sb + "\n");
	}

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

