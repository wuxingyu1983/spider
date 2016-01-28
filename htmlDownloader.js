/**
 * Created by wuxingyu on 15/7/26.
 */

var http = require("http"),
    iconv = require("iconv-lite"),
    BufferHelper = require('bufferhelper');

function download(url, callback) {
    http.get(url, function(res) {
        var bufferHelper = new BufferHelper();
        res.on('data', function(chunk){
            bufferHelper.concat(chunk);
        });
        res.on('end', function(){
            var html = iconv.decode(bufferHelper.toBuffer(), 'gbk');
            callback(html);
        });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
}

exports.download = download;
