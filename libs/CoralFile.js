/**
 * CoralPackFile Bytes Structure
 *
 * |------------------------------------------------------------------------
 * | flag 'crf' 3Bytes         |
 * 
 * | version				   |
 * | 16bit + charBytes
 * 
 * | fileFullName
 * | 16bit + charBytes
 * 
 * | hasCompressed             | compression
 * 	 1Byte                     | 16bit + charBytes
 * 
 * | contentBytesLen  		   | contentBytes
 * | 32bit            		   | bytes
 * |------------------------------------------------------------------------
 * 
 * @author Alex Zhang
 * 
 */
CoralFile.FILE_FLAG = "crf";
CoralFile.VERSION = "0.0.1";

function CoralFile() {
	var mVersion = CoralFile.VERSION;
	var mPureName = null;
	var mFullName = null;
	var mExtention = null;
	var mContentCompression = null;

	this.getVersion = function() {
		return mVersion;
	}

	this.getPureName = function() {
		return mPureName;
	}

	this.getFullName = function() {
		return mFullName;
	}

	this.setFullName = function(value) {
		mFullName = value;
	}

	function updatePureNameAndExtentionByFullName() {
		var indexOfDot:int = mFullName.lastIndexOf(".");
		if(indexOfDot != -1) {
			mPureName = mFullName.slice(0, indexOfDot);
			mExtention = mFullName.substr(indexOfDot + 1);
		}
		else {
			mPureName = mFullName;
			mExtention = "";
		}
	}

	this.getCompression = function() {
		return mContentCompression;
	}

	this.setCompression = function(value) {
		if(!value || value == "" ||
			value == "lzma") {
			mContentCompression = value;
		}
	}

	this.getContentBytes = function() { 
		return mContentBytes; 
	}

	this.setContentBytes = function(value) { 
		mContentBytes = value; 
	}

	public function deserialize(input):void {
			input.readUTFBytes(3);//->crf just ignore
			mVersion = input.readUTF();//version
			mFullName = input.readUTF();//fullName
			updatePureNameAndExtentionByFullName();
			
			var hasCompressed:Boolean = input.readBoolean();
			mContentCompression = hasCompressed ? input.readUTF() : null;
			
			var contentBytesLen:uint = input.readUnsignedInt();
			
			mContentBytes = new ByteArray();
			input.readBytes(mContentBytes, 0, contentBytesLen);

			if(hasCompressed)
			{
				mContentBytes.uncompress(mContentCompression);
			}
		}
}
exports = CoralFile;
