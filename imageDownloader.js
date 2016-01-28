/**
 * Created by wuxingyu on 15/7/26.
 */

var database = require("./database");
var fs = require("fs");
var http = require("http");
var async = require("async");

function download(db) {
    database.getImages(db, function(images) {
        if (images) {
            downloadImage(images, db, function() {
               console.log("download finished!!");
            });
        }
        else {
            console.log("download query error")
        }
    });
}

function downloadImage(images, db, callback) {
    if (0 == images.length) {
        callback();
    }
    else {
        var obj = images.shift();

        // 先判断目录是否已经建立
        var path = "./download/" + obj.ablum;
        obj.path = path;
        fs.exists(path, function (exists) {
            if (exists) {
                q.push(obj, function(err) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        // 记录已经下载过了
                        database.imageSaved(obj, db, function(){
                            console.log(obj.path + " downloaded !!");
                        });
                    }
                });
                downloadImage(images, db, callback);
            }
            else {
                fs.mkdir(path, 0777, function (err) {
                    if (err) {
                        downloadImage(images, db, callback);
                    }
                    else {
                        q.push(obj, function(err) {
                            if (err) {
                                console.log(err);
                                downloadImage(images, db, callback);
                            }
                            else {
                                // 记录已经下载过了
                                console.log(obj.path + " downloaded !!");
                                database.imageSaved(obj, db, function(){
                                    downloadImage(images, db, callback);
                                });
                            }
                        });
                    }
                });
            }
        });
    }
}

var q = async.queue(function(obj, callback){
    var url = obj.url;
    if (0 <= url.indexOf("http://www.zhuamei5.com/http://img.zhuamei.net")) {
        url = url.substring("http://www.zhuamei5.com/".length, url.length);
    }
    http.get(url, function(res){
        if (res.statusCode == 200) {
            var save_path = obj.path + "/" + Math.floor(Math.random()*100000) + url.substr(-4,4);
            var writestream = fs.createWriteStream(save_path);

            var finished = 0;
            var timeout = 0;

            var timer = setTimeout(function() {
                // 60 秒超时
                if (0 == finished) {
                    timeout = 1;
                    writestream.end();
                    fs.unlinkSync(save_path);
                    callback("writestream time out");
                }
            }, 1000 * 60 * 5);

            res.pipe(writestream);
            writestream.on('finish', function(){
                if (0 == timeout) {
                    finished = 1;
                    clearTimeout(timer);
                    callback(null);
                }
            });
            writestream.on('error', function(){
                if (0 == timeout) {
                    finished = 1;
                    fs.unlinkSync(save_path);
                    clearTimeout(timer);
                    callback("writestream error");
                }
            });
        }
        else {
            callback("statusCode: " + res.statusCode + " url is " + obj.url);
        }
    }).on('error', function(e) {
        callback("Got error: " + e.message);
    });
}, 25);

exports.download = download;
