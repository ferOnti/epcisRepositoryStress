var dateFormat = require('dateformat');
var sprintf = require('sprintf').sprintf;

var db = 2
var currentDate
var eventId
var count
var purchaseOrderNumber = 0

module.exports.db = db
module.exports.currentDate = currentDate
module.exports.eventId = eventId
module.exports.count = count
module.exports.purchaseOrderNumber = purchaseOrderNumber

module.exports.getNextCurrentDate = function(secs = 10) {
	var ms = Math.round(Math.random()* secs * 1000)

    this.currentDate = new Date(new Date(this.currentDate).getTime() + ms);	
    return this.currentDate
}

module.exports.getNextEventId = function() {
	this.eventId ++
    return this.eventId
}

module.exports.getNextPurchaseOrderNumber = function() {
	this.purchaseOrderNumber ++
	//urn:epc:id:gdti:0614141.06012.1234
	//http://transaction.acme.com/po/12345678
    return sprintf("http://epcis.mojix.com/po/%07d",this.purchaseOrderNumber)
}
