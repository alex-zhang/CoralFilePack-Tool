var program = require('commander'),
	fs = require('fs'),
	packageJson = require('./package.json'),
	version = packageJson.version,
	zlib = require('zlib'),
	CoralPackFile = require("./libs/CoralPackFile.js"),
	ByteArray = require('./libs/ByteArray.js'),
	path = require('path');

program
  .version(version)
  .option('-s --source dir <path>', 'set the source of package dir')
  .option('-o --output <path>', 'set the output file path')
  .option('-c --isCompress', 'use the lzma Algorithm')
//  .option('-r --recursive', 'recursive pack all the file')

program.parse(process.argv);

if(program.source && program.output) {
	var dirSourcePath = program.source;

	if(!fs.existsSync(dirSourcePath)) {
		console.error("source dir path: " + dirSourcePath + " is not exist!");
		return;
	}

	var dirFilestat = fs.statSync(dirSourcePath);
	if(!dirFilestat.isDirectory()) {
		console.error("source dir: " + dirSourcePath + " is not dir!");
		return;
	}

	var dirFileName = path.basename(dirSourcePath);
	if(isDefultIgnore(dirFilestat, dirFileName)) {
		console.error("source dir: " + dirSourcePath + " is a isHidden file!");
		return;
	}
	
	var coralPackFile = new CoralPackFile();
	coralPackFile.isCompress(!!program.isCompress);

	fs.readdirSync(dirSourcePath).forEach(function(childFileName) {
		var childFilePath = dirSourcePath + "/" + childFileName;
		var childFilestat = fs.statSync(childFilePath);
		if(!childFilestat.isDirectory() && !isDefultIgnore(childFilestat, childFileName)) {
			var childBuffer = fs.readFileSync(childFilePath);
			coralPackFile.addFile2(childFileName, childBuffer);
		}
	});
	

	if(coralPackFile.fileCount() == 0) {
		console.error("pack files count is 0");
		return;
	}

	var outputFilePath = program.output;
	var outputFileName = path.basename(outputFilePath);

	console.log("start pack dir " + dirSourcePath);
	console.log("pack file count " + coralPackFile.fileCount());
	console.log("output file " + outputFilePath);

	var outputFileByteWritable = ByteArray.createByteWritable();
	coralPackFile.serialize(outputFileByteWritable, function() {
			var outputResultFileBuffer = outputFileByteWritable.pack();
			fs.writeFileSync(outputFilePath, outputResultFileBuffer);

			console.log("success!");
		})

} else {
	program.help();
}

function isDefultIgnore(fileStat, fileName) {
	if(fileName) {
		var isHidden = /^\./.test(fileName);
		if(isHidden) return true;
	}

	if(false) {
		switch(fileStat.mode) {
			case 16895:
			case 33206:
			case 33060:
				return true;
				break;
		}
	}

	return false;
}


return;
var coralPackFile = new CoralPackFile();
coralPackFile.isCompress(true);

fs.readdirSync("./test/src").forEach(function(fullFileName) {
	var fileBuffer = fs.readFileSync("./test/src/" + fullFileName);
	coralPackFile.addFile2(fullFileName, fileBuffer);
})

var byteBuffer = new ByteBuffer();
coralPackFile.serialize(byteBuffer, function() {
	var resultFileBuffer = byteBuffer.pack();
	console.log(resultFileBuffer.length);
	
	fs.writeFileSync("./test/" + "output.pppppp", resultFileBuffer);
	console.log("success!");
})
