module.exports = {
	"steps" : {
		"1": {
			"name" : "mix raw materials",
			"n" : 140,
			"sgtin1": "urn:epc:id:sgtin:4012345.011122",
			"sgtin2": "urn:epc:id:sgtin:4000001.065432",
			"sgtinOut": "urn:epc:id:sgtin:4012345.077889",
			"outputEpcs" : 100,
			"maxItemsPerCase": 30,
			"template" : "./templates/scnStep1Transformation.xml",
			"saveToXml" : true
		}, 
		"1b": {
			"name" : "mix raw materials",
			"n" : 140,
			"sgtin1": "urn:epc:id:sgtin:4567890.001122",
			"sgtin2": "urn:epc:id:sgtin:4321001.003322",
			"sgtinOut": "urn:epc:id:sgtin:4433221.004455",
			"outputEpcs" : 100,
			"maxItemsPerCase": 60,
			"template" : "./templates/scnStep1Transformation.xml",
			"saveToXml" : true
		}, 
		"2": {
			"name" : "Pack items in cases",
			"template" : "./templates/step2PackIntoCases.xml",
			"maxCases" : 200,
			"saveToXml" : true
		},
		"3": {
			"name" : "Print and apply case label",
			"template" : "./templates/step3PrintApplyCaseLabel.xml",
			"poPercentage" : 0.9,
			"saveToXml" : true
		},
		"4": {
			"name" : "Print pallet label",
			"description" : "",
			"template" : "./templates/step4PrintPalletLabel.xml",
			"template2" : "./templates/step5PackIntoPallets.xml",
			"poPercentage" : 0.9,
			"maxCasesPerPallet": 8,
			"maxPallets" : 12,
			"saveToXml" : true
		},
		"5": {
			"name" : "Pack cases into pallets",
		},
		"6": {
			"name" : "Ship some pallets",
			"description" : "",
			"template" : "./templates/step6ShipPallet.xml",
			"poPercentage" : 0.9,
			"saveToXml" : true
		},
		"7": {
			"name" : "receive pallets",
			"description" : "",
			"template" : "./templates/step7ReceivePallet.xml",
			"poPercentage" : 0.9,
			"saveToXml" : true
		},
		"8": {
			"name" : "unpack pallets",
			"description" : "",
			"template" : "./templates/step8UnpackFromPallets.xml",
			"poPercentage" : 0.9,
			"saveToXml" : true
		},
		"9": {
			"name" : "Ship some cases",
			"description" : "",
			"template" : "./templates/step9ShipCases.xml",
			"poPercentage" : 0.9,
			"maxCasesToSend": 6,
			"saveToXml" : true
		},
		"10": {
			"name" : "receive cases",
			"description" : "",
			"template" : "./templates/step7ReceivePallet.xml",
			"poPercentage" : 0.9,
			"saveToXml" : true
		},
		"11": {
			"name" : "Ship some cases",
			"description" : "",
			"template" : "./templates/step9ShipCases.xml",
			"poPercentage" : 0.9,
			"maxCasesToSend": 4,
			"saveToXml" : true
		},
		"12": {
			"name" : "receive cases",
			"description" : "",
			"template" : "./templates/step7ReceivePallet.xml",
			"poPercentage" : 0.9,
			"saveToXml" : true
		},
		"13": {
			"name" : "unpack cases",
			"description" : "",
			"template" : "./templates/step8UnpackFromPallets.xml",
			"poPercentage" : 0.9,
			"saveToXml" : true
		},
		"14": {
			"name" : "stocking products for selling",
			"description" : "",
			"template" : "./templates/step14genericObjectEvent.xml",
			"poPercentage" : 0.9,
			"saveToXml" : true
		},
		"15": {
			"name" : "product bougth by consumer",
			"description" : "",
			"template" : "./templates/step14genericObjectEvent.xml",
			"poPercentage" : 0.05,
			"saveToXml" : true
		},
/*		
		"1": {
			"name" : "Encode and tag items",
			"n" : 1000,
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
		*/
	},
	"startDate" : "May 18 2017",
	"startEventId" : 1,
	"iterations" : 24,
	"outputPath" : "supplyChainNestle",
	"removeXmlFile" : true,
	"mongodb" : "mongodb://localhost:27017/supplyChainNestle"
}
