function BytesArray() {
	var mBytesAvailable = 0;
	var mLength = 0;
	var mPosition = 0;

	this.getBytesAvailable = function() {
		return mBytesAvailable;
	}

	this.getLength = function() {
		return mLength;
	}

	this.setLength = function(value) {
		mLength = value;
	}

	this.getPosition = function() {
		return mPosition;
	}

	this.setPosition = function(value) {
		mPosition = value;
	}


	this.clear = function() {

	}

	this.compress = function() {

	}

	this.readBoolean = function() {

	}

	this.readBytes = function(bytesArray, offset, length) {
		
	}

	this.readDouble = function() {

	}

	this.readFloat = function() {

	}

	this.readInt = function() {

	}

	this.readMultiByte = function(length, charSet) {

	}

	this.readShort = function() {

	}

	this.readUnsignedByte = function() {

	}

	this.readUnsignedInt = function() {

	}

	this.readUnsignedShort = function() {

	}

	this.readUTF = function() {

	}

	this.readUTFBytes = function(length) {

	}

	this.toString = function() {

	}

	this.uncompress = function(algorithm) {

	}

	this.writeBoolean = function(value) {

	}

	this.writeByte = function(value) {

	}

	this.writeBytes = function(byteArray, offset, length) {

	}

	this.writeDouble = function(value) {

	}

	this.writeFloat = function(value) {

	}

	this.writeInt = function(value) {

	}

	this.writeMultiByte(value:String, charSet:String):void



}

exports = BytesArray;