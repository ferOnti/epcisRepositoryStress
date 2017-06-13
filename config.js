module.exports = {
	"steps" : {
		"1": {
			"name" : "Encode and tag items",
			"n" : 40,
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
			"name" : "product packaged into pallets",
			"description" : "Denotes a specific activity within a business process that includes putting objects into a larger container – usually for shipping. Aggregation of one unit to another typically occurs at this point.",
			"template" : "./templates/empty.xml",
			"poPercentage" : 0.9,
			"saveToXml" : false
		},
		"5": {
			"name" : "staging_outbound products before departing",
			"description" : "Denotes a specific activity within a business process in which an object moves from a facility to an area where it will await transport pick-up",
			"template" : "./templates/staging_outbound.xml",
			"poPercentage" : 0.8,
			"saveToXml" : false
		},
		"6": {
			"name" : "loading products before shipping",
			"description" : "Denotes a specific activity within a business process where an object is loaded into shipping conveyance.",
			"template" : "./templates/loading.xml",
			"poPercentage" : 0.8,
			"saveToXml" : false
		},
		"7": {
			"name" : "departing products for shipping",
			"description" : "Denotes a specific activity within a business process where an object leaves a location on its way to a destination",
			"template" : "./templates/departing.xml",
			"poPercentage" : 0.8,
			"saveToXml" : false
		}
	},
	"startDate" : "May 18 2017",
	"startEventId" : 1,
	"outputXmlFile" : "output.ecpis.xml",
	"removeXmlFile" : true,
	"mongodb" : "mongodb://localhost:27017/riot_main"
}
