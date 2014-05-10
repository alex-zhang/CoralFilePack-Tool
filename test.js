var buffer1 = new Buffer("hello");
var buffer2 = new Buffer(buffer1.length - 2);
buffer2.fill(0);

buffer1.copy(buffer2, 0, 1, buffer1.length - 1);
console.log(buffer1.toString());
console.log(buffer2.toString());

return;