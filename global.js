var dateFormat = require('dateformat');
var sprintf = require('sprintf').sprintf;

var db 
var currentDate
var eventId = 0
var count = 0
var parentIdAsCase   = 0
var parentIdAsPallet = 0
var purchaseOrderNumber = 0

module.exports.db = db
module.exports.currentDate = currentDate
module.exports.eventId = eventId
module.exports.parentIdAsCase = parentIdAsCase
module.exports.parentIdAsPallet = parentIdAsPallet
module.exports.count = count
module.exports.purchaseOrderNumber = purchaseOrderNumber

module.exports.getNextCurrentDate = function(secs = 10) {
	var ms = Math.round(Math.random()* secs * 1000)

    this.currentDate = new Date(new Date(this.currentDate).getTime() + ms);	
    return this.currentDate
}

module.exports.getNextEventId = function() {
	this.eventId ++
	
    return sprintf("urn:uuid:0359868b-958a-4433-9623-%012d", this.eventId)
}

module.exports.getNextParentIdFromCases = function() {
	this.parentIdAsCase ++
    return sprintf("urn:epc:id:sscc:5012345.%010d",this.parentIdAsCase)
}

module.exports.getNextParentIdFromPallets = function() {
	this.parentIdAsPallet ++
    return sprintf("urn:epc:id:sscc:0000123.%010d",this.parentIdAsPallet)
}

module.exports.getNextPurchaseOrderNumber = function() {
	this.purchaseOrderNumber ++
	//urn:epc:id:gdti:0614141.06012.1234
	//http://transaction.acme.com/po/12345678
    return sprintf("http://epcis.mojix.com/po/%07d",this.purchaseOrderNumber)
}

/* 

<epc>urn:epc:id:sgtin:12345123.04512.00000001</epc>
<epc>urn:epc:id:sscc:12345678.090123456</epc>
<epc>urn:epc:id:grai:01234567.8901.3456</epc>
<epc>urn:epc:id:gdti:01234567.8901.34</epc>


<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<epcis:EPCISDocument
    xmlns:epcis="urn:epcglobal:epcis:xsd:1"
    xmlns:example="http://ns.example.com/epcis"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:vizix="vizix" 
    creationDate="2005-07-11T11:30:47.0Z"
    schemaVersion="1.2">
  <EPCISBody>
    <EventList>


*/

