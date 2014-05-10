var Type_Byte = 1;
var Type_Short = 2;
var Type_UShort = 3;
var Type_Int32 = 4;
var Type_UInt32 = 5;
var Type_String = 6;//变长字符串，前两个字节表示长度
var Type_VString = 7;//定长字符串
var Type_Int64 = 8;
var Type_Float = 9;
var Type_Double = 10;

function ByteReadable(buffer) {
    var _org_buf = org_buf;

    if(!_org_buf) {
        throw new Error("buferr can't be null here!");
    }

    var _encoding = 'utf8';
    var _offset = 0;
    var _endian = 'B';

    //指定文字编码
    this.encoding = function(encode){
        _encoding = encode;
    }
    
    //指定字节序 为BigEndian
    this.bigEndian = function(){
       _endian = 'B';
    }

    this.readByte = function(){
        var result = _org_buf.readUInt8(_offset);
        _offset+=1;
        return result;
    }

    this.readShort = function(){
        var result = _org_buf['readInt16'+_endian+'E'](_offset);
        _offset+=2;
        return result;
    }

    this.readUShort = function(){
        var result = _org_buf['readUInt16'+_endian+'E'](_offset);
        _offset+=2;
        return result;
    }

    this.readInt32 = function(){
         var result = _org_buf['readInt32'+_endian+'E'](_offset);
        _offset+=4;
        return result;
    }

    this.readUInt32 = function(){
        var result = _org_buf['readUInt32'+_endian+'E'](_offset);
        _offset+=4;
        return result;
    }

    this.readString = function(){
        var len = _org_buf['readInt16'+_endian+'E'](_offset);
        _offset+=2;
        var result = _org_buf.toString(_encoding, _offset, _offset+len);
        _offset+=len;
        return result;
    }

    this.readVString = function(len){
        if(!len){
            throw new Error('vstring must got len argument');
        }

        var vlen = 0;//实际长度
        for(var i = _offset;i<_offset +len;i++){
            if(_org_buf[i]>0)vlen++;
        }
        var result = _org_buf.toString(_encoding, _offset, _offset+vlen);
        _offset+=len;
        return result;
    };

    this.readFloat = function(){
        var result = _org_buf['readFloat'+_endian+'E'](_offset)
        _offset+=4;
        return result;
    }

    this.readBuffer = function(length) {
        length = length || this.available();

        if(length < 0) length = 0
        else if(length > this.available()) length = this.available();

        var buffer = new Buffer(length);
        buffer.fill(0);
        if(length > 0) {
            _org_buf.copy(buffer, 0, _offset, length);
            _offset+=length;    
        }
        
        return buffer;
    }

    this.length = function(){
        return _org_buf.length;
    }

    this.available = function() {
        return _org_buf.length - _offset;
    }

    this.position = function(value) {
        if(arguments.length = 0) {//get
            return _offset;
        } else {
            if(value < 0) value = 0;
            else if(value > _org_buf.length){
                value = _org_buf.length;
            }
        }
    }

    this.buffer = function(value) {
        if(arguments.length = 0) {//get
            return _org_buf;
        } else {
            if(!value) {
                throw new Error("buferr can't be null here!");
            }

            _org_buf = value;
            _offset = 0;
        }
    }
}

function ByteWritable() {
    var _list = [];

    var _encoding = 'utf8';
    var _offset = 0;
    var _endian = 'B';

    //指定文字编码
    this.encoding = function(encode){
        _encoding = encode;
    }
    
    //指定字节序 为BigEndian
    this.bigEndian = function(){
       _endian = 'B';
    }

    this.writeByte = function(val){
        _list.push({t:Type_Byte,d:val,l:1});
        _offset+= 1;
    };

    this.writeShort = function(val){
        _list.push({t:Type_Short,d:val,l:2});
        _offset += 2;
    };

    this.writeUShort = function(val){
        _list.push({t:Type_UShort,d:val,l:2});
        _offset += 2;
    };

    this.writeInt32 = function(val){
        _list.push({t:Type_Int32,d:val,l:4});
        _offset += 4;
    };

    this.writeUInt32 = function(val){
        _list.push({t:Type_UInt32,d:val,l:4});
        _offset += 4;
    };

    /**
    * 变长字符串 前2个字节表示字符串长度
    **/
    this.writeString = function(val){
        var len = 0;
        if(val)len = Buffer.byteLength(val, _encoding);
        _list.push({t:Type_String,d:val,l:len});
        _offset += len + 2;
    };

    /**
    * 定长字符串 val为null时，读取定长字符串（需指定长度len）
    **/
    this.writeVString = function(len, val){
        if(!len){
            throw new Error('vstring must got len argument');
        }

        _list.push({t:Type_VString,d:val,l:len});
        _offset += len;
    };

    this.writeFloat = function(val){
        _list.push({t:Type_Float,d:val,l:4});
        _offset += 4;
    };

    this.writeBuffer = function(val, offset, length) {
        offset = offset || 0;
        length = length || val.length;

        if(length < 0) length = 0;
        else if(length > val.length) length = val.length;

        if(offset < 0) offset = 0;
        else if(offset > val.length) offset = val.length;

        length = val.length - offset;

        for(var i = offset; i < length; i++) {
            this.writeByte(val.readUInt8(i));
        }
    }

    this.length = function() {
        return _offset;
    }

    this.writeBytesReadable = function(value, offset, length) {
        this.writeBuffer(value.buffer());
    }

    this.pack = function(){
        var packBuffer = new Buffer(_offset);
        var offset = 0;

        for (var i = 0; i < _list.length; i++) {
            switch(_list[i].t){
                case Type_Byte:
                    packBuffer.writeUInt8(_list[i].d,offset);
                    offset+=_list[i].l;
                    break;
                case Type_Short:
                    packBuffer['writeInt16'+_endian+'E'](_list[i].d,offset);
                    offset+=_list[i].l;
                    break;
                case Type_UShort:
                    packBuffer['writeUInt16'+_endian+'E'](_list[i].d,offset);
                    offset+=_list[i].l;
                    break;
                case Type_Int32:
                    packBuffer['writeInt32'+_endian+'E'](_list[i].d,offset);
                    offset+=_list[i].l;
                    break;
                case Type_UInt32:
                    packBuffer['writeUInt32'+_endian+'E'](_list[i].d,offset);
                    offset+=_list[i].l;
                    break;
                case Type_String:
                    //前2个字节表示字符串长度
                    packBuffer['writeInt16'+_endian+'E'](_list[i].l,offset);
                    offset+=2;
                    packBuffer.write(_list[i].d,_encoding,offset);
                    offset+=_list[i].l;
                    break;
                case Type_VString:
                    var vlen = Buffer.byteLength(_list[i].d, _encoding);//字符串实际长度
                    packBuffer.write(_list[i].d,_encoding,offset);
                    //补齐\0
                    for(var j = offset + vlen;j<offset+_list[i].l;j++){
                         packBuffer.writeUInt8(0,j);
                    }
                    offset+=_list[i].l;
                    break;
                case Type_Int64:
                    packBuffer['writeDouble'+_endian+'E'](_list[i].d,offset);
                    offset+=_list[i].l;
                    break;
                case Type_Float:
                    packBuffer['writeFloat'+_endian+'E'](_list[i].d,offset);
                    offset+=_list[i].l;
                    break;
                case Type_Double:
                    packBuffer['writeDouble'+_endian+'E'](_list[i].d,offset);
                    offset+=_list[i].l;
                    break;
            }
        }
        return packBuffer;
    };
}

module.exports = {
    createByteReadable :function(buff) {
        return new ByteReadable(buff);
    },
    createByteWritable: function() {
        return new ByteWritable();
    }
}