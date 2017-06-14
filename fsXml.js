
var fs = require('fs')
var path = require('path')
var rootPath = __dirname
var playlistFilename = ""
var fullxmlFilename = ""

	
deleteFolderRecursive = function(folder) {
    var files = [];
    if( fs.existsSync(folder) ) {
        files = fs.readdirSync(folder);
        files.forEach(function(file, index){
            var curPath = folder + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folder);
    }
};

module.exports.fullxmlFilename = fullxmlFilename
module.exports.rootPath = rootPath
module.exports.setRootPath = function(root, folder) {
	if (root == null || path == "") {
		console.error("root folder is empty")
		process.exit(1)
	}
	if (folder == null || folder == "") {
		console.error("base folder is empty, check config file")
		process.exit(1)
	}
	
	this.rootPath = path.join(root, folder)
	this.fullxmlFilename = path.join(this.rootPath, "output.xml")
}

module.exports.saveToXml = function(step, eventId, sb) {
	if (!fs.existsSync(this.rootPath)) {
		fs.mkdirSync(this.rootPath)
	}

	let stepPath = path.join(this.rootPath, "/step"+step)
	if (!fs.existsSync(stepPath)) {
		fs.mkdirSync(stepPath)
	}

	var fileId = eventId.split("-").pop()
	let outfilename = path.join(stepPath, "/" + fileId + ".xml")
	fs.appendFileSync(outfilename, sb + "\n")

	let playlistFilename = path.join(this.rootPath, "/playlist.txt")
	let nextFilename = outfilename.replace(this.rootPath, "")
    fs.appendFileSync(playlistFilename, nextFilename + "\n");

}

module.exports.removeFiles = function() {
	console.log("remove: all files from filesystem")
	if (path.resolve(__dirname) == path.resolve(this.rootPath)) {
		console.error("error, the rootPath: '%s' is invalid, check config file", this.rootPath)
		process.exit(1)
	}
	deleteFolderRecursive(this.rootPath)
}

module.exports.getStatsFullxml = function () {
	res = {
		rootPath : this.rootPath,
		filename : this.fullxmlFilename.replace(this.rootPath,""),
		fileSizeInBytes : 0,
		fileSizeInMegabytes : 0 
	}
	if (!fs.existsSync(this.rootPath)) {
		return (res)
	}

	if (!fs.existsSync(this.fullxmlFilename) ) {
		return (res)
	} else {
		const stats = fs.statSync(fsXml.fullxmlFilename)
		res.fileSizeInBytes = stats.size
		res.fileSizeInMegabytes = fileSizeInBytes / 1000000.0
	}
	return res
}
