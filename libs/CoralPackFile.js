/**
 * CoralPackFile Bytes Structure
 *
 * |------------------------------------------------------------------------
 * | flag 'coral'          | version				   |
 * | 4Bytes				   | 16bit + charBytes         |
 * |
 * | hasCompressed         |
 * | 1Byte
 * |
 * | contentBytesLen  	   | contentBytes
 * | 32bit            	   | bytes
 * |
 * | ----------------------------------------
 * | fileCount
 * | 16bit
 * | 
 * | fileBytesLength       | CoralPackFile(Bytes Structure)
 * | 32bit                 | bytes
 * |
 * | ...
 * |
 * | ----------------------------------------
 * |
 * |------------------------------------------------------------------------
 * 
 * @author Alex Zhang
 * 
 */

var ByteArray = require('./ByteArray.js');
var CoralFile = require('./CoralFile.js');
var LZMA = require("lzma").LZMA;

CoralPackFile.FILE_FLAG = "coral";
CoralPackFile.VERSION = "0.0.1";

function CoralPackFile() {
	var mVersion = CoralPackFile.VERSION;
	var mIsContentCompress = false;
	
	var mFileCount = 0;
	var mFileFullNameMap = [];

	this.version = function() {
		return mVersion;
	}

	this.isCompress = function(value) {
		if(arguments.length > 0) {//set
			mIsContentCompress = !!value;
		} else {
			return mIsContentCompress;
		}
	}

	this.fileCount = function() {
		return mFileCount;
	}

	this.hasFile = function(fileFullName) {
		return mFileFullNameMap[fileFullName] !== undefined;
	}

	this.getFile = function(fileFullName) {
		return mFileFullNameMap[fileFullName];
	}

	this.getAllFiles = function(results) {
		if(!results) results = [];

		mFileFullNameMap.forEach(function(file) {
			results.push(file);
		});

		return results;
	}

	this.getFilesByExtention = function(extention, results) {
		if(!results) results = [];

		mFileFullNameMap.forEach(function(file) {
			if(file.extention() == extention) {
				results.push(file);
			}
		});

		return results;
	}

	this.getFilesByFilter = function(filterFunction, results) {
		if(!results) results = [];

		mFileFullNameMap.forEach(function(file) {
			if(filterFunction(file)) {
				results.push(file);
			}
		});
		
		return results;
	}

	this.addFile = function(file) {
		var fileFullName = file.fullName();

		if(this.hasFile(fileFullName)) return null;
			
		mFileFullNameMap[fileFullName] = file;
		mFileCount++;

		return file;
	}

	this.addFile2 = function(fileFullName, fileBuffer) {
		if(this.hasFile(fileFullName)) return null;
			
		var coralFile = new CoralFile();
		coralFile.fullName(fileFullName);
		coralFile.fileBuffer(fileBuffer);

		return this.addFile(coralFile);
	}

	this.removeFile = function (fileFullName, dispose) {
		if(!this.hasFile(fileFullName)) return null;

		var file = mFileFullNameMap[fileFullName];
		if(dispose) {
			file.dispose();
		}
			
		delete mFileFullNameMap[fileFullName];
		mFileCount--;
			
		return file;
	}

	this.deserialize = function(bytesReadable, completeCallback) {
		bytesReadable.readVString(FILE_FLAG.length);
		mVersion = bytesReadable.readString();
		mIsContentCompress = !!bytesReadable.readByte();
		
		var contentBytesBuffer = null;
		var contentBytesLen = bytesReadable.readUInt32();
		if(contentBytesLen > 0) {
			contentBytesBuffer = bytesReadable.readBuffer(contentBytesLen);

			if(mIsContentCompress) {
				//lzma
				var lzmaIns = LZMA();
				//syc process.
				lzmaIns.decompress(contentBytesBuffer.toString("base64") ,function(lzmaResultStr) {
					contentBytesBuffer = new Buffer(lzmaResultStr, "base64");
					parseInputBytes();
				})
			} else {
				parseInputBytes();
			}

			function parseInputBytes() {
				var contentBytesReadable = ByteArray.createByteReadable(contentBytesBuffer);
				mFileCount = contentBytesReadable.readUShort();

				var fileBytesLen = 0;
				var fileBytesReadable;
				var file;

				for(i = 0; i < mFileCount; i++) {
					fileBytesLen = contentBytesReadable.uint32();
					if(fileBytesLen > 0) {
						fileBytesReadable = ByteArray.createByteReadable(contentBytesReadable.readBuffer(fileBytesLen));

						file = new CoralFile();
						file.deserialize(fileBytesReadable);
						addFile(file);	
					}
				}

				if(completeCallback) {completeCallback()}
			}
		}
		else {
			if(completeCallback) {completeCallback()}
		}
	}

	this.serialize = function(bytesWritable, completeCallback) {
		var contentBytesWritable = null;

		if(mFileCount > 0) {
			contentBytesWritable = ByteArray.createByteWritable();
			contentBytesWritable.writeUShort(mFileCount);
			
			var fileBytesLen = 0;
			var fileBytesWritable;

			var file;

			for(var fullFileName in mFileFullNameMap) {
				file = mFileFullNameMap[fullFileName];

				fileBytesWritable = ByteArray.createByteWritable();
				file.serialize(fileBytesWritable);

				fileBytesLen = fileBytesWritable.length();
				contentBytesWritable.writeUInt32(fileBytesLen);
				if(fileBytesLen > 0) {
					contentBytesWritable.writeBuffer(fileBytesWritable.pack());
				}
			}
			
			if(mIsContentCompress) {
				//lzma
				var lzmaIns = LZMA();
				//syc process.
				lzmaIns.compress(contentBytesWritable.pack().toString("base64") , 1, 
					function(lzmaResultStr) {
						var lzmaContentBuffer = new Buffer(lzmaResultStr, "base64");
						contentBytesWritable = ByteArray.createByteWritable();
						contentBytesWritable.writeBuffer(lzmaContentBuffer);

						process.stdout.clearLine(); 
  						process.stdout.cursorTo(0);

						buildOutputBytes();
					}, 
					function(progress) {
						process.stdout.clearLine(); 
  						process.stdout.cursorTo(0);
						process.stdout.write("progress " + Math.round(progress * 100));
					});
			} else {
				buildOutputBytes();
			}
		} else {
			buildOutputBytes();
		}

		function buildOutputBytes() {

			var mContentByteBuffer = contentBytesWritable ? contentBytesWritable.pack() : null;
			var contentBytesLen = mContentByteBuffer.length;
		
			bytesWritable.writeVString(CoralPackFile.FILE_FLAG.length, CoralPackFile.FILE_FLAG);
			bytesWritable.writeString(CoralPackFile.VERSION);
			bytesWritable.writeByte(mIsContentCompress ? 1 : 0);
			bytesWritable.writeUInt32(contentBytesLen);
			
			console.log("content size is ", contentBytesLen);
			if(contentBytesLen > 0) {
				bytesWritable.writeBuffer(mContentByteBuffer);
			}

			if(completeCallback) {
				completeCallback()
			}
		}
	}
}

module.exports = CoralPackFile;