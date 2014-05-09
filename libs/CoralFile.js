/**
 * CoralFile Bytes Structure
 *
 * |------------------------------------------------------------------------
 * |
 * | fileFullName
 * | 16bit + charBytes
 * |
 * | contentBytesLen  		   | contentBytes
 * | 32bit            		   | bytes
 * |------------------------------------------------------------------------
 * 
 * @author Alex Zhang
 * 
 */

var ByteBuffer = require('./ByteBuffer.js');

function CoralFile() {
	var mPureName;
	var mFullName;
	var mExtention;
	var mFileBuffer = null;//Buffer

	this.pureName = function() {
		return mPureName || "";
	}

	this.extention = function() {
		return mExtention || "";
	}
	
	this.fullName = function(value) { 
		if(arguments.length > 0) {//set
			if(mFullName != value) {
				mFullName = value;
				updatePureNameAndExtentionByFullName();	
			}
		}
		else {//get
			return mFullName || "";
		}
	}

	function updatePureNameAndExtentionByFullName() {
		if(mFullName && mFullName.length > 0) {
			var indexOfDot = mFullName.lastIndexOf(".");
			if(indexOfDot != -1) {
				mPureName = mFullName.slice(0, indexOfDot);
				mExtention = mFullName.substr(indexOfDot + 1);
			} else {
				mPureName = mFullName;
				mExtention = "";
			}
		}
	}

	this.fileBuffer = function(fileBuffer) {
		if(arguments.length > 0) {//set
			mFileBuffer = fileBuffer;
		} else {
			return mFileBuffer;
		}
	}

	this.deserialize = function(inputBytesBuffer) {
		mFullName = inputBytesBuffer.string();
		updatePureNameAndExtentionByFullName();

		mFileBuffer = null;

		var mFileBufferLen = inputBytesBuffer.uint32();
		if(mFileBufferLen > 0) {
			var mContentByteBuffer = new ByteBuffer();
			mContentByteBuffer.byteArray(mFileBufferLen, inputBytesBuffer.byteArray(mFileBufferLen));
			mFileBuffer = mContentByteBuffer.unpack();
		}
	}

	this.serialize = function(outputBytesBuffer) {
		outputBytesBuffer.string(this.fullName());
		var contentBytesLen = mFileBuffer ? mFileBuffer.length : 0;
		outputBytesBuffer.uint32(contentBytesLen);
		if(contentBytesLen > 0) {
			var mContentByteBuffer = new ByteBuffer(mFileBuffer);
			outputBytesBuffer.byteArray(contentBytesLen, mContentByteBuffer.byteArray(contentBytesLen));
		}
	}
}

module.exports = CoralFile;
