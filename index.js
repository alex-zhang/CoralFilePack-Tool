var program = require('commander'),
	fs = require('fs'),
	packageJson = require('./package.json'),
	version = packageJson.version,
	zlib = require('zlib'),
	CoralPackFile = require("./libs/CoralPackFile.js"),
	CoralFile = require("./libs/CoralFile.js"),
	ByteBuffer = require('./libs/ByteBuffer.js');

program
  .version(version)
  .option('-s --src <path>', 'set the source package directory or file')
  .option('-o --output <path>', 'set the output file path')

program.parse(process.argv);


var coralPackFile = new CoralPackFile();
coralPackFile.isCompress(true);

fs.readdirSync("./test/src").forEach(function(fullFileName) {
	var fileBuffer = fs.readFileSync("./test/src/" + fullFileName);
	coralPackFile.addFile2(fullFileName, fileBuffer);
})

var byteBuffer = new ByteBuffer();
coralPackFile.serialize(byteBuffer, function() {
	byteBuffer.pack();
	console.log("success!!!!!!!!!!!!!!!");
})
