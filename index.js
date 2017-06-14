var config = require('./config');
var global = require('./global')
var fsXml  = require('./fsXml')
var fs     = require('fs')
var path   = require('path')

var MongoClient = require('mongodb').MongoClient
var sprintf = require('sprintf').sprintf;
var dateFormat = require('dateformat');

var step1 = require('./step1')
var step2 = require('./step2')
var step3 = require('./step3')
var step4 = require('./step4')
var step5 = require('./step5')
var step6 = require('./step6')
var step7 = require('./step7')

var url = config.mongodb
var iteration = 0
var maxIteration = 0
var iterateResolve
var iterateReject

main();

function iterate() {
	return new Promise(function (resolve, reject) { 
		iteration ++
		if (maxIteration == iteration-1) {
			iterateResolve()
		} else {
			return step1.execute()
				.then(step2.execute)
				.then(step3.execute)
				.then(step4.execute) 
				//.then(step5.execute)
				//.then(step6.execute)
				//.then(step7.execute)
				.then(()=>{
					process.nextTick( iterate)
				})
		}

	})
}

function iterations() {
	return new Promise(function (resolve, reject) { 
		iterateResolve = resolve
		iterateReject  = reject

		iterate()
	})
}

function main() {
	initGlobal()
	removeOutput() 

	try {
		connect()			
			.then(removeAllDocs)
			.then(iterations)
			//.then(step1.execute)
			//.then(step2.execute)
			//.then(step3.execute)
			//.then(step4.execute) 
			//.then(step5.execute)
			//.then(step6.execute)
			//.then(step7.execute)
			.then(close)
			.then(footer)
			//.then(console.log, console.error)
	} catch (err) {
  		console.error(err)
	}
}

function initGlobal() {
	global.currentDate = new Date(config.startDate) 
	global.eventId = config.startEventId -1
	if (global.eventId <= 0) {global.eventId=0}

	global.count = 0
	
	fsXml.setRootPath(__dirname, config.outputPath)

	iteration = 0
	maxIteration = config.iterations
}

function connect () {
	console.log("connect")
	return new Promise(function (resolve, reject) { 
		MongoClient.connect(url, function(err, db) {
  			if (err) {
  				return reject(err)
  			}
  			console.log("        connected correctly to server");
  			global.db = db;
  			resolve(db);
  		})
	});
}

function close () {
	console.log("closing")
	db = global.db;

	return new Promise(function (resolve, reject) { 
		db.close();
		resolve(true)
	});
}

function footer() {
	var stats = fsXml.getStatsFullxml()
	console.log("  output folder: " + stats.rootPath)
	console.log("    output file: " + stats.filename)
	console.log(sprintf("      file size: %3.2f Mb.", stats.fileSizeInMegabytes))

	console.log("   total events: " + global.eventId)
	console.log("    from (date): " + new Date(config.startDate) )
	console.log("      to (date): " + global.currentDate)

	return new Promise(function(resolve, reject) {
		resolve()
	})
}

function removeOutput() {
	if (config.removeXmlFile) {
		fsXml.removeFiles()
	}
}

function removeProducts() {
	var db = global.db;
	var collection = db.collection('stress_products');

	return new Promise(function (resolve, reject) { 
		var stream = collection.remove({}, function (err,numberRemoved) {
			if (err) {
		  		console.error(err)
		  		reject(err)
			}
			console.log("        removed: " + numberRemoved.result.n + " products")
			resolve(numberRemoved)
		})
	})
}

function removePurchaseOrders() {
	var db = global.db;
	var collection = db.collection('stress_purchase_orders');

	return new Promise(function (resolve, reject) { 
		var stream = collection.remove({}, function (err,numberRemoved) {
			if (err) {
		  		console.error(err)
		  		reject(err)
			}
			console.log("        removed: " + numberRemoved.result.n + " purchase orders")
			resolve(numberRemoved)
		})
	})
}

function removeCases() {
	var db = global.db;
	var collection = db.collection('stress_cases');

	return new Promise(function (resolve, reject) { 
		var stream = collection.remove({}, function (err,numberRemoved) {
			if (err) {
		  		console.error(err)
		  		reject(err)
			}
			console.log("        removed: " + numberRemoved.result.n + " cases")
			resolve(numberRemoved)
		})
	})
}

function removePallets() {
	var db = global.db;
	var collection = db.collection('stress_pallets');

	return new Promise(function (resolve, reject) { 
		var stream = collection.remove({}, function (err,numberRemoved) {
			if (err) {
		  		console.error(err)
		  		reject(err)
			}
			console.log("        removed: " + numberRemoved.result.n + " pallets")
			resolve(numberRemoved)
		})
	})
}


function removeAllDocs() {
	console.log("remove: all documents from DB")

	return new Promise(function (resolve, reject) { 
		removeProducts()
			.then(removePurchaseOrders)
			.then(removeCases)
			.then(removePallets)
			.then(resolve)
	})
}


var findDocuments = function(db, callback) {
  // Get the documents collection 
  // Find some documents 
  collection.find({}).toArray(function(err, docs) {
    assert.equal(err, null);
    assert.equal(2, docs.length);
    console.log("Found the following records");
    console.dir(docs);
    callback(docs);
  });
}