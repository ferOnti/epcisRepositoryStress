var config = require('./config');
var global = require('./global')
var fsXml  = require('./fsXml')
var fs     = require('fs')
var path   = require('path')

var MongoClient = require('mongodb').MongoClient
var sprintf = require('sprintf').sprintf;
var dateFormat = require('dateformat');

var step1 = require('./scnStep1')
var step2 = require('./scnStep2')
var step3 = require('./scnStep3')
var step4 = require('./scnStep4')
var step6 = require('./scnStep6')
var step7 = require('./scnStep7')
var step8 = require('./scnStep8')
var step9 = require('./scnStep9')
var step10 = require('./scnStep10')
var step11 = require('./scnStep11')
var step12 = require('./scnStep12')
var step13 = require('./scnStep13')
var step14 = require('./scnStep14')
var step15 = require('./scnStep15')

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
			console.log("\niteration:", iteration)
			return step1.execute()
				.then(step2.execute)
				.then(step3.execute)
				.then(step4.execute) 
				.then(step6.execute)
				.then(step7.execute)
				.then(step8.execute)
				.then(step9.execute)
				.then(step10.execute)
				.then(step11.execute)
				.then(step12.execute)
				.then(step13.execute)
				.then(step14.execute)
				.then(step15.execute)
				.then(()=>{
					process.nextTick( iterate)
				})
				.catch((err)=>{console.error(err)})
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
			if (numberRemoved && numberRemoved.result && numberRemoved.result.n) {
				console.log("        removed: " + numberRemoved.result.n + " products")
			}
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
			if (numberRemoved && numberRemoved.result && numberRemoved.result.n) {
				console.log("        removed: " + numberRemoved.result.n + " purchase orders")
			}
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
			if (numberRemoved && numberRemoved.result && numberRemoved.result.n) {
				console.log("        removed: " + numberRemoved.result.n + " cases")
			}
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
			if (numberRemoved && numberRemoved.result && numberRemoved.result.n) {
				console.log("        removed: " + numberRemoved.result.n + " pallets")
			}
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