module.exports = {
	"steps" : {
		"1": {
			"name" : "Encode and tag items",
			"n" : 3000,
			"offset" : 0,
			"randomItemsProduced" : 7,
			"template" : "./templates/step1Commissioning.xml",
			"saveToXml" : true
		}, 
		"2": {
			"name" : "Pack items in cases",
			"template" : "./templates/step2PackIntoCases.xml",
			"poPercentage" : 0.9,
			"saveToXml" : true
		},
		"3": {
			"name" : "Print and apply case label",
			"template" : "./templates/step3PrintApplyCaseLabel.xml",
			"poPercentage" : 0.7,
			"saveToXml" : true
		},
		"4": {
			"name" : "Print pallet label",
			"description" : "",
			"template" : "./templates/step4PrintPalletLabel.xml",
			"template2" : "./templates/step5PackIntoPallets.xml",
			"poPercentage" : 0.7,
			"saveToXml" : true
		},
		"5": {
			"name" : "Pack cases into pallets",
		},
		"6": {
			"name" : "Ship the pallet",
			"description" : "",
			"template" : "./templates/step6ShipPallet.xml",
			"poPercentage" : 0.8,
			"saveToXml" : true
		},
		"7": {
			"name" : "receive the pallet",
			"description" : "",
			"template" : "./templates/step7ReceivePallet.xml",
			"poPercentage" : 0.8,
			"saveToXml" : true
		},
		"8": {
			"name" : "Put away(store) the pallet",
			"description" : "",
			"template" : "./templates/step8PutAwayPallet.xml",
			"poPercentage" : 0.8,
			"saveToXml" : true
		}
	},
	"startDate" : "May 18 2017",
	"startEventId" : 1,
	"iterations" : 2,
	"outputPath" : "supplyChainDemo",
	"removeXmlFile" : true,
	"mongodb" : "mongodb://localhost:27017/riot_main"
}
