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

var ByteBuffer = require('./ByteBuffer.js');
var CoralFile = require('./CoralFile.js');
var LZMA = require("lzma").LZMA;

CoralPackFile.FILE_FLAG = "coral";
CoralPackFile.VERSION = "0.0.1";

function CoralPackFile() {
	var mVersion = CoralPackFile.VERSION;
	var mIsContentCompress = false;
	
	var mFileCount = 0;
	var mFileFullNameMap = [];
	
	var mContentBytes = null;//ByteBuffer

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

	this.deserialize = function(inputByteBuffer, completeCallback) {
		inputByteBuffer.vstring(FILE_FLAG.length);
		mVersion = inputByteBuffer.string();
		mIsContentCompress = !!inputByteBuffer.byte();
		
		mContentBytes = null;
		var contentBytesLen = inputByteBuffer.uint32();
		if(contentBytesLen > 0) {
			mContentBytes = new ByteBuffer();
			mContentBytes.byteArray(contentBytesLen, inputByteBuffer.byteArray(contentBytesLen));
			mContentBytes.resetOffset();

			if(mIsContentCompress) {
				//lzma
				var lzmaIns = LZMA();
				//syc process.
				lzmaIns.decompress(mContentBytes.pack().toString("base64") ,function(lzmaResultStr) {
					var lzmaBase64Buffer = new Buffer(lzmaResultStr, "base64");
					mContentBytes = new ByteBuffer(lzmaBase64Buffer);
					parseInputBytes();
				})
			} else {
				parseInputBytes();
			}

			function parseInputBytes() {
				mFileCount = mContentBytes.short();

				var fileBytesLen = 0;
				var fileBytes;
				var file;

				for(i = 0; i < mFileCount; i++) {
					fileBytesLen = mContentBytes.uint32();
					fileBytes = new ByteBuffer();
					fileBytes.byteArray(fileBytesLen, mContentBytes.byteArray(fileBytesLen));
					fileBytes.resetOffset();

					file = new CoralFile();
					file.deserialize(fileBytes);
					
					addFile(file);
				}

				if(completeCallback) {completeCallback()}
			}
		}
		else {
			if(completeCallback) {completeCallback()}
		}
	}

	this.serialize = function(outputByteBuffer, completeCallback) {
		mContentBytes = null;

		if(mFileCount > 0) {
			mContentBytes = new ByteBuffer();
			mContentBytes.short(mFileCount);
			
			var fileBytesLen = 0;
			var fileBytes;
			var fileByteBuffer;
			var file;

			for(var fullFileName in mFileFullNameMap) {
				file = mFileFullNameMap[fullFileName];

				fileBytes = new ByteBuffer();
				file.serialize(fileBytes);
				fileByteBuffer = fileBytes.pack();
				fileBytes.resetOffset();

				fileBytesLen = fileByteBuffer.length;
				mContentBytes.uint32(fileBytesLen);
				mContentBytes.byteArray(fileBytesLen, fileBytes.byteArray(fileBytesLen));
			}
			
			if(mIsContentCompress) {
				//lzma
				var lzmaIns = LZMA();
				//syc process.
				lzmaIns.compress(mContentBytes.pack().toString("base64") , 1, function(lzmaResultStr) {
					var lzmaBase64Buffer = new Buffer(lzmaResultStr, "base64");
					mContentBytes = new ByteBuffer(lzmaBase64Buffer);
					buildOutputBytes();
				});
			} else {
				buildOutputBytes();
			}
		} else {
			buildOutputBytes();
		}

		function buildOutputBytes() {

			var mContentByteBuffer = mContentBytes ? mContentBytes.pack() : null;
			var contentBytesLen = mContentByteBuffer ? mContentByteBuffer.length : 0;
		
			outputByteBuffer.vstring(CoralPackFile.FILE_FLAG.length, CoralPackFile.FILE_FLAG);
			outputByteBuffer.string(CoralPackFile.VERSION);
			outputByteBuffer.byte(mIsContentCompress ? 1 : 0);
			outputByteBuffer.uint32(contentBytesLen);
			
			if(contentBytesLen > 0) {
				mContentBytes.resetOffset();
				outputByteBuffer.byteArray(contentBytesLen, mContentBytes.byteArray(contentBytesLen));
			}

			if(completeCallback) {
				completeCallback()
			}
		}
	}
}

module.exports = CoralPackFile;