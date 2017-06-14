
var fs = require('fs')
var path = require('path')
var rootPath = __dirname

	
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

module.exports.rootPath = rootPath
module.exports.setRootPath = function(p) {
	this.rootPath = p
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
	console.log(this.rootPath)
	//deleteFolderRecursive(this.rootPath)
	console.log(this.rootPath)

}
