module.exports = {
	"steps" : {
		"1": {
			"name" : "Encode and tag items",
			"n" : 20,
			"offset" : 250,
			"randomItemsProduced" : 10,
			"template" : "./templates/step1Commissioning.xml",
			"saveToXml" : true,
			"savePrettyXml" : false
		}, 
		"2": {
			"name" : "Pack items in cases",
			"template" : "./templates/step2PackIntoCases.xml",
			"poPercentage" : 0.9,
			"saveToXml" : true,
			"savePrettyXml" : false
		},
		"3": {
			"name" : "Print and apply case label",
			"template" : "./templates/step3PrintApplyCaseLabel.xml",
			"poPercentage" : 0.8,
			"saveToXml" : true,
			"savePrettyXml" : false
		},
		"4": {
			"name" : "Pack cases into pallets",
			"description" : "",
			"template" : "./templates/step4PackIntoPallets.xml",
			"poPercentage" : 0.5,
			"saveToXml" : true,
			"savePrettyXml" : true
		},
		"5": {
			"name" : "Print pallet label",
			"description" : "",
			"template" : "./templates/staging_outbound.xml",
			"poPercentage" : 0.8,
			"saveToXml" : false
		},
		"6": {
			"name" : "Ship the pallet",
			"description" : "",
			"template" : "./templates/loading.xml",
			"poPercentage" : 0.8,
			"saveToXml" : false
		},
		"7": {
			"name" : "receive the pallet",
			"description" : "",
			"template" : "./templates/departing.xml",
			"poPercentage" : 0.8,
			"saveToXml" : false
		}
	},
	"startDate" : "May 18 2017",
	"startEventId" : 1,
	"outputPath" : "supplyChainDemo",
	"removeXmlFile" : true,
	"mongodb" : "mongodb://localhost:27017/riot_main"
}
