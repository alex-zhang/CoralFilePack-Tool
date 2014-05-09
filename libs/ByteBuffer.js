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
var Type_ByteArray = 11;

/*
* 构造方法
* @param org_buf 需要解包的二进制
* @param offset 指定数据在二进制的初始位置 默认是0
*/
var ByteBuffer = function (org_buf) {

    var _org_buf = org_buf;
    var _encoding = 'utf8';
    var _offset = 0;
    var _list = [];
    var _offset = 0;
    var _endian = 'B';

    //指定文字编码
    this.encoding = function(encode){
        _encoding = encode;
    };
    
    //指定字节序 为BigEndian
    this.bigEndian = function(){
       _endian = 'B';
    };

    //指定字节序 为LittleEndian
    this.littleEndian = function(){
       _endian = 'L';
    };

    this.byte = function(val){
        if(arguments.length == 0) {
            var result = _org_buf.readUInt8(_offset);
            _offset+=1;
            return result;
        } else {
            _list.splice(_list.length,0,{t:Type_Byte,d:val,l:1});
            _offset+= 1;
        }
    };

    this.short = function(val){
        if(arguments.length == 0) {
            var result = _org_buf['readInt16'+_endian+'E'](_offset);
            _offset+=2;
            return result;
        } else {
            _list.splice(_list.length,0,{t:Type_Short,d:val,l:2});
            _offset += 2;
        }
    };

    this.ushort = function(val){
        if(arguments.length == 0) {
            var result = _org_buf['readUInt16'+_endian+'E'](_offset);
            _offset+=2;
            return result;
        } else {
            _list.splice(_list.length,0,{t:Type_UShort,d:val,l:2});
            _offset += 2;
        }
    };

    this.int32 = function(val){
        if(arguments.length == 0) {
            var result = _org_buf['readInt32'+_endian+'E'](_offset);
            _offset+=4;
            return result;
        } else {
            _list.splice(_list.length,0,{t:Type_Int32,d:val,l:4});
            _offset += 4;
        }
    };

    this.uint32 = function(val){
        if(arguments.length == 0) {
            var result = _org_buf['readUInt32'+_endian+'E'](_offset);
            _offset+=4;
            return result;
        } else {
            _list.splice(_list.length,0,{t:Type_UInt32,d:val,l:4});
            _offset += 4;
        }
    };

    /**
    * 变长字符串 前2个字节表示字符串长度
    **/
    this.string = function(val){
        if(arguments.length == 0) {
            var len = _org_buf['readInt16'+_endian+'E'](_offset);
            _offset+=2;
            var result = _org_buf.toString(_encoding, _offset, _offset+len);
            _offset+=len;
            return result;
        } else {
            var len = 0;
            if(val)len = Buffer.byteLength(val, _encoding);
            _list.splice(_list.length,0,{t:Type_String,d:val,l:len});
            _offset += len + 2;
        }
    };

    /**
    * 定长字符串 val为null时，读取定长字符串（需指定长度len）
    **/
    this.vstring = function(len, val){
        if(!len){
            throw new Error('vstring must got len argument');
        }

        if(arguments.length == 1) {
            var vlen = 0;//实际长度
            for(var i = _offset;i<_offset +len;i++){
                if(_org_buf[i]>0)vlen++;
            }
            var result = _org_buf.toString(_encoding, _offset, _offset+vlen);
            _offset+=len;
            return result;
        } else {
            _list.splice(_list.length,0,{t:Type_VString,d:val,l:len});
            _offset += len;
        }
    };

    this.int64 = function(val){
        if(arguments.length == 0) {
            var result = _org_buf['readDouble'+_endian+'E'](_offset);
            _offset+=8;
            return result;
        } else {
            _list.splice(_list.length,0,{t:Type_Int64,d:val,l:8});
            _offset += 8;
        }
    };

    this.float = function(val){
        if(arguments.length == 0) {
            var result = _org_buf['readFloat'+_endian+'E'](_offset)
            _offset+=4;
            return result;
        } else {
            _list.splice(_list.length,0,{t:Type_Float,d:val,l:4});
            _offset += 4;
        }
    };

    this.double = function(val){
        if(arguments.length == 0) {
            var result = _org_buf['readDouble'+_endian+'E'](_offset);
            _offset+=8;
            return result;
        } else {
            _list.splice(_list.length,0,{t:Type_Double,d:val,l:8});
            _offset += 8;
        }
    };

    /**
    * 写入或读取一段字节数组
    **/
    this.byteArray = function(len, val){
        if(!len){
            throw new Error('byteArray must got len argument');
        }

        if(arguments.length == 1) {
            var arr = [];
            for(var i = _offset;i<_offset +len;i++){
                if(i<_org_buf.length){
                    arr.push(_org_buf.readUInt8(i));
                }else{
                    arr.push(0);
                }
            }
           _offset+=len;
           return arr;
        } else {
            _list.splice(_list.length,0,{t:Type_ByteArray,d:val,l:len});
            _offset += len;
        }
    }

    /**
    * 解包成数据数组
    **/
    this.unpack = function(){
        return _list.concat();
    };

    this.resetOffset = function() {
        _offset = 0;
    }

    /**
    * 打包成二进制
    * @param ifHead 是否在前面加上2个字节表示包长
    **/
    this.pack = function(ifHead){
        _org_buf = new Buffer((ifHead)?_offset+2:_offset);
        var offset = 0;
        if(ifHead){
            _org_buf['writeUInt16'+_endian+'E'](_offset,offset);
            offset+=2;
        }
        for (var i = 0; i < _list.length; i++) {
            switch(_list[i].t){
                case Type_Byte:
                    _org_buf.writeUInt8(_list[i].d,offset);
                    offset+=_list[i].l;
                    break;
                case Type_Short:
                    _org_buf['writeInt16'+_endian+'E'](_list[i].d,offset);
                    offset+=_list[i].l;
                    break;
                case Type_UShort:
                    _org_buf['writeUInt16'+_endian+'E'](_list[i].d,offset);
                    offset+=_list[i].l;
                    break;
                case Type_Int32:
                    _org_buf['writeInt32'+_endian+'E'](_list[i].d,offset);
                    offset+=_list[i].l;
                    break;
                case Type_UInt32:
                    _org_buf['writeUInt32'+_endian+'E'](_list[i].d,offset);
                    offset+=_list[i].l;
                    break;
                case Type_String:
                    //前2个字节表示字符串长度
                    _org_buf['writeInt16'+_endian+'E'](_list[i].l,offset);
                    offset+=2;
                    _org_buf.write(_list[i].d,_encoding,offset);
                    offset+=_list[i].l;
                    break;
                case Type_VString:
                    var vlen = Buffer.byteLength(_list[i].d, _encoding);//字符串实际长度
                    _org_buf.write(_list[i].d,_encoding,offset);
                    //补齐\0
                    for(var j = offset + vlen;j<offset+_list[i].l;j++){
                         _org_buf.writeUInt8(0,j);
                    }
                    offset+=_list[i].l;
                    break;
                case Type_Int64:
                    _org_buf['writeDouble'+_endian+'E'](_list[i].d,offset);
                    offset+=_list[i].l;
                    break;
                case Type_Float:
                    _org_buf['writeFloat'+_endian+'E'](_list[i].d,offset);
                    offset+=_list[i].l;
                    break;
                case Type_Double:
                    _org_buf['writeDouble'+_endian+'E'](_list[i].d,offset);
                    offset+=_list[i].l;
                    break;
                case Type_ByteArray:
                    var indx = 0;
                    for(var j = offset;j<offset+_list[i].l;j++){
                         if(indx<_list[i].d.length){
                            _org_buf.writeUInt8(_list[i].d[indx],j);
                         }else{//不够的话，后面补齐0x00
                            _org_buf.writeUInt8(0,j);
                         }
                         indx++
                    }
                    offset+=_list[i].l;
                    break;
            }
        }
        return _org_buf;
    };
    
     /**
    * 未读数据长度
    **/
    this.getAvailable = function(){
        if(!_org_buf)return 0;
        return _org_buf.length - _offset;
    };
}

module.exports = ByteBuffer;