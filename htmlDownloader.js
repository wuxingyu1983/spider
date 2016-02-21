/**
 * Created by wuxingyu on 15/7/26.
 */

 var http = require("http"),
 request = require("request"),
 iconv = require("iconv-lite"),
 BufferHelper = require('bufferhelper');

 function download(url, callback) {
   console.log("the url is " + url);

   request(
     { method: 'GET',
     uri: url
   },
   function (error, response, body) {
     if (!error) {
       callback(body);
     }
     else {
       console.log('request error is : '+ error);
     }
   }
 );
}

exports.download = download;
