config = require('./config.bulk.json');
var parseString = require('xml2js').parseString;
var sprintf = require('sprintf').sprintf;

var filename= config.output
var count = 0
var skip = config.start

var sleep = require('sleep');
var allEpcidPromises = []

var MongoClient = require('mongodb').MongoClient
var url = config.mongodb
var db

main()

function main() {
    //initGlobal()
    //removeOutput() 

    try {
        connect()           
            .then(removeAllDocs)
            .then(readLineByLine)
            .then(() => {db.close()})
    } catch (err) {
        console.error(err)
    }
}

function readLineByLine() {
    return new Promise(function (resolve, reject) { 

        LineByLineReader = require('line-by-line'),
            lr = new LineByLineReader(filename);

        lr.on('error', function (err) {
        	// 'err' contains error object
            console.log(err)
            reject(err)
        });

        lr.on('line', function (line) {
            count ++
            if (skip > count) { return }
            var time = new Date().getTime() & 100000
            console.log("------ " + count + "    ", line.length)

            try {
                lr.pause()
                processLine(line).then( () => {
                    lr.resume() 
                })
            } catch (err) {
                console.log(err.message)
            }

        });

        lr.on('end', function () {
        	// All lines are read, file is closed now.
            resolve()
        });
    });

}

function removeEvents() {
    var collection = db.collection('epcis_events');

    return new Promise(function (resolve, reject) { 
        var stream = collection.remove({}, function (err,numberRemoved) {
            if (err) {
                console.error(err)
                reject(err)
            }
            if (numberRemoved && numberRemoved.result && numberRemoved.result.n) {
                console.log("        removed: " + numberRemoved.result.n + " epcis events")
            }
            resolve(numberRemoved)
        })
    })
}

function removeRaws() {
    var collection = db.collection('epcis_raw');

    return new Promise(function (resolve, reject) { 
        var stream = collection.remove({}, function (err,numberRemoved) {
            if (err) {
                console.error(err)
                reject(err)
            }
            if (numberRemoved && numberRemoved.result && numberRemoved.result.n) {
                console.log("        removed: " + numberRemoved.result.n + " epcis raw")
            }
            resolve(numberRemoved)
        })
    })
}

function removeFinishedGoods() {
    var collection = db.collection('epcis_finishedGoods');

    return new Promise(function (resolve, reject) { 
        var stream = collection.remove({}, function (err,numberRemoved) {
            if (err) {
                console.error(err)
                reject(err)
            }
            if (numberRemoved && numberRemoved.result && numberRemoved.result.n) {
                console.log("        removed: " + numberRemoved.result.n + " epcis finishedGoods")
            }
            resolve(numberRemoved)
        })
    })
}

function removeSolds() {
    var collection = db.collection('epcis_sold');

    return new Promise(function (resolve, reject) { 
        var stream = collection.remove({}, function (err,numberRemoved) {
            if (err) {
                console.error(err)
                reject(err)
            }
            if (numberRemoved && numberRemoved.result && numberRemoved.result.n) {
                console.log("        removed: " + numberRemoved.result.n + " epcis sold")
            }
            resolve(numberRemoved)
        })
    })
}

function removeAllDocs() {
    console.log("remove: all documents from DB")

    return new Promise(function (resolve, reject) { 
        removeEvents()
            .then(() => {return removeRaws()})
            .then(() => {return removeFinishedGoods()})
            .then(() => {return removeSolds()})
            .then(resolve)
    })
}

var saveEvent = function(event) {
    //save the event
    var collection = db.collection('epcis_events');
    return new Promise(function (resolve, reject) { 
        collection.insert(event, function(err, res) {
            if (err) {
                reject(err)
            } else {
                resolve(res.result.n)
            }
        })
    })
}

var saveDocument = function(collection, document) {
    //save the event
    if (document.length == 0) {
        return Promise.resolve({result:{n:0,ok:false}})
    }
    var collection = db.collection(collection);
    return new Promise(function (resolve, reject) { 
        collection.insert(document, function(err, res) {
            if (err) {
                reject(err)
            } else {
                resolve(res.result.n)
            }
        })
    })
}

var saveEpcClass = function(collection, documents) {
    //save the event
    //console.log(collection,documents)
    var collection = db.collection(collection);
    var updatePromises = []
    for (doc of documents ) {
        if (doc.epcClass != "undefined") {
            updatePromises.push( new Promise(function(resolve, reject){
                var options = {upsert: true}
                var criteria = {"epcClass": doc.epcClass}
                var update = {"$inc": {times: 1}}
                collection.findOneAndUpdate(criteria, update, options, function(err, res) {
                   if (err) {
                    console.log(err)
                        reject(err)
                    } else {
                        resolve(1)
                    }
                })
            }))
        }
    }

    return new Promise(function (resolve, reject) { 
        var allUpdatePromises = Promise.all(updatePromises)
        allUpdatePromises.then( function(res) {
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

var processObjectEvent = function (object) {
    if (typeof(object.epcList[0]['epc']) == "undefined") {
        return new Promise( (resolve,reject) => {
            resolve(true)
        })
    }

    var epcidPromises = []

    var event = { eventType: 'object'}

    if (typeof(object.baseExtension[0].eventID) != "undefined") {
        event.eventId= object.baseExtension[0].eventID[0]
    }

    if (typeof(object.eventTime) != "undefined") {
        event.eventTime= object.eventTime[0]
    }

    if (typeof(object.recordTime) != "undefined") {
        event.recordTime= object.recordTime[0]
    }

    if (typeof(object.action) != "undefined") {
        event.action= object.action[0]
    }

    if (typeof(object.eventTimeZoneOffset) != "undefined") {
        event.eventTimeZoneOffset= object.eventTimeZoneOffset[0]
    }

    var soldProducts = false
    if (typeof(object.bizStep) != "undefined") {
        event.bizStep= object.bizStep[0]
        if (event.bizStep == "urn:epcglobal:cbv:bizstep:retail_selling") {
            soldProducts = true
        }
    }
    if (typeof(object.disposition) != "undefined") {
        event.disposition= object.disposition[0]
    }
    if (typeof(object.readPoint) != "undefined") {
        event.readPoint= object.readPoint[0].id[0]
    }
    if (typeof(object.bizLocation) != "undefined") {
        event.bizLocation= object.bizLocation[0].id[0]
    }

    var epcList = []
    var solds = []

    for (epcid of object.epcList[0].epc ) {
        epcList.push(epcid)
        solds.push( {epcid: epcid, lookups: []})
    }
    event.epcList = epcList

    return new Promise(function (resolve, reject) { 
        saveEvent(event)
            .then(
                () => {
                    if (!soldProducts) {
                        resolve(true)
                    } else {
                        return saveDocument("epcis_sold", solds)
                    }                    
                }
            )
            .then(
                (res) => {resolve(res)}
            )
            .catch((err) => {reject(err)})
    })
}

var processTransformationEvent = function (object) {
    if (typeof(object.inputEPCList[0]['epc']) == "undefined") {
        return Promise.reject("inputEPCList is empty")
    }

    var event = { eventType: 'transformation'}

    if (typeof(object.baseExtension[0].eventID) != "undefined") {
        event.eventId= object.baseExtension[0].eventID[0]
    }
    if (typeof(object.eventTime) != "undefined") {
        event.eventTime= object.eventTime[0]
    }

    if (typeof(object.recordTime) != "undefined") {
        event.recordTime= object.recordTime[0]
    }

    if (typeof(object.eventTimeZoneOffset) != "undefined") {
        event.eventTimeZoneOffset= object.eventTimeZoneOffset[0]
    }

    if (typeof(object.bizStep) != "undefined") {
        event.bizStep= object.bizStep[0]
    }
    if (typeof(object.disposition) != "undefined") {
        event.disposition= object.disposition[0]
    }
    if (typeof(object.readPoint[0].id) != "undefined") {
        event.readPoint= object.readPoint[0].id[0]
    }
    if (typeof(object.bizLocation[0].id) != "undefined") {
        event.bizLocation= object.bizLocation[0].id[0]
    }

    var raws = []
    var inputEPCList = []
    for (epcid of object.inputEPCList[0].epc ) {
        inputEPCList.push(epcid)
        raws.push( {epcid: epcid, lookups: []})
    }
    event.inputEPCList = inputEPCList

    var rawClasses = []
    var inputQuantityList = []
    if (typeof(object.inputQuantityList[0]['quantityElement']) != "undefined") {
        for (quantityElement of object.inputQuantityList[0].quantityElement ) {
            var qElement = {}
            if (typeof quantityElement.epcClass[0] != "undefined") {
                qElement.epcClass = quantityElement.epcClass[0]
            }
            if (typeof quantityElement.quantity[0] != "undefined") {
                qElement.quantity = quantityElement.quantity[0]
            }
            if (typeof quantityElement.uom != "undefined") {
                qElement.uom = quantityElement.uom[0]
            }
            inputQuantityList.push(qElement)
            rawClasses.push( {epcClass: qElement.epcClass, lookups: []})
        }
    }
    if (inputQuantityList.length>0) {
        event.inputQuantityList = inputQuantityList
    }

    var finishedGoods = []
    var outputEPCList = []
    for (epcid of object.outputEPCList[0].epc ) {
        outputEPCList.push(epcid)
        finishedGoods.push( {epcid: epcid, lookups: []})
    }
    event.outputEPCList = outputEPCList

    //save the event
    return new Promise(function (resolve, reject) { 
        saveEvent(event)
            .then(
                () => {return saveDocument("epcis_raw", raws)}
            )
            .then(
                () => {return saveEpcClass("epcis_raw", rawClasses)}
            )
            .then(
                (res) => {resolve(res)} 
            )
            .catch((err) => {reject(err)})
    })
}

var processAggregationEvent = function (object) {
    if (typeof(object.childEPCs[0]['epc']) == "undefined") {
        return Promise.reject("childEPCs is empty")
    }

    var event = { eventType: 'aggregation'}

    if (typeof(object.baseExtension[0].eventID) != "undefined") {
        event.eventId= object.baseExtension[0].eventID[0]
    }

    if (typeof(object.eventTime) != "undefined") {
        event.eventTime= object.eventTime[0]
    }

    if (typeof(object.recordTime) != "undefined") {
        event.recordTime= object.recordTime[0]
    }

    if (typeof(object.eventTimeZoneOffset) != "undefined") {
        event.eventTimeZoneOffset= object.eventTimeZoneOffset[0]
    }

    if (typeof(object.parentID) != "undefined") {
        event.parentID = object.parentID[0]
    }

    if (typeof(object.action) != "undefined") {
        event.action = object.action[0]
    }

    if (typeof(object.bizStep) != "undefined") {
        event.bizStep= object.bizStep[0]
    }
    if (typeof(object.disposition) != "undefined") {
        event.disposition= object.disposition[0]
    }
    if (typeof(object.readPoint[0].id) != "undefined") {
        event.readPoint= object.readPoint[0].id[0]
    }
    if (typeof(object.bizLocation[0].id) != "undefined") {
        event.bizLocation= object.bizLocation[0].id[0]
    }

    var childEPCs = []
    for (epcid of object.childEPCs[0].epc ) {
        childEPCs.push(epcid)
    }
    event.childEPCs = childEPCs

    //save the event
    var collection = db.collection('epcis_events');
    return new Promise(function (resolve, reject) { 
        collection.insert(event, function(err, res) {
            if (err) {
                reject(err)
            } else {
                //numItems++ //increase the number of items
                resolve(res.result)
            }
        })
    })

}

var processLine = function(line) {
    return new Promise( (resolve, reject) => {
        parseString(line, function (err, result) {
            if (err) {
                console.error(err)
                process.exit()
            }
            if (result["ObjectEvent"]) {
                processObjectEvent(result["ObjectEvent"])
                    .then(resolve)
                return
            } 
            if (result["TransformationEvent"]) {
                processTransformationEvent(result["TransformationEvent"])
                    .then(resolve)
                return
            } 

            if (result["AggregationEvent"]) {
                processAggregationEvent(result["AggregationEvent"])
                    .then(resolve)
                return
            } 
            console.log(result)
            process.exit(1)
            resolve(false)
        })
    })
    .catch((err) => {
        console.error(err)
        process.exit(1)
    });
}

function connect () {
    console.log("connect")
    return new Promise(function (resolve, reject) { 
        MongoClient.connect(url, function(err, dba) {
            if (err) {
                return reject(err)
            }
            console.log("        connected correctly to server");
            db = dba;
            resolve(db);
        })
    });
}
