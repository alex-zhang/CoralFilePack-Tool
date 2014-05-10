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
		mFullName = inputBytesBuffer.readString();
		updatePureNameAndExtentionByFullName();

		mFileBuffer = null;

		var mFileBufferLen = inputBytesBuffer.readUInt32();
		if(mFileBufferLen > 0) {
			mFileBuffer = inputBytesBuffer.readBuffer(mFileBufferLen);
		}
	}

	this.serialize = function(outputBytesBuffer) {
		outputBytesBuffer.writeString(this.fullName());
		var contentBytesLen = mFileBuffer ? mFileBuffer.length : 0;
		outputBytesBuffer.writeUInt32(contentBytesLen);
		if(contentBytesLen > 0) {
			outputBytesBuffer.writeBuffer(mFileBuffer);
		}
	}
}

module.exports = CoralFile;
