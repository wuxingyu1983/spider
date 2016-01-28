/* @flow */
/**
 * Created by wuxingyu on 15/7/27.
 */
var cheerio = require("cheerio");
var database = require("./database");
var html_downloader = require("./htmlDownloader");
var urlm = require("url");
// 处理照片详情页
function parseDetail(obj, db, callback) {
    var url = obj.url;
    html_downloader.download(url, function(html){
        var url_obj = urlm.parse(url);
        var prefix = url_obj.protocol + "//" + url_obj.host + "/";
        var $ = cheerio.load(html);

        // 照片的地址
        var image_url = null;
        $("#photo_pic > a > img").each(function(i, v){
            image_url = prefix + $(v).attr("src");
//            console.log("the Image url is " + image_url);
        });

        callback(image_url);
    });
}

// 处理相册、下一页
function parseAlbum(obj, db, callback) {
    var url = obj.url;
    var ablum_name = obj.name;
    html_downloader.download(url, function(html){
        var url_obj = urlm.parse(url);
        var prefix = url_obj.protocol + "//" + url_obj.host + "/";
        var $ = cheerio.load(html);

        // 遍历照片详情
        var details = [];
        $("#tiles li").each(function(i,v){
            var image_src = $(v).find("img").attr("src");
            var detail_url = image_src;
            if (0 > image_src.indexOf("http:")) {
                // 不是以 http 开头的
                detail_url = prefix + detail_url;
            }
            var processed_url = detail_url.substring(0, detail_url.lastIndexOf(".thumb.jpg"));
//            console.log(i + ": the Detail url is " + detail_url);
            details.push({url:processed_url, name:ablum_name});
//            html_downloader.download(detail_url, parseDetail);
        });

        // 是否还有下一页
        var nxt_url = null;
        $(".nxt").each(function(i, v){
            nxt_url = prefix + $(v).attr("href");
        });

        processDetails(details, db, function(){
            if (nxt_url) {
                // 还有下一页
                console.log("the next page is " + nxt_url);
                parseAlbum({url:nxt_url, name:ablum_name}, db, callback);
            }
            else {
                // 全部处理完了
                callback();
            }
        });
    });
}

// 处理首页列表、下一页
function parseHome(url, db, callback) {
    html_downloader.download(url, function(html){
        var url_obj = urlm.parse(url);
        var prefix = url_obj.protocol + "//" + url_obj.host + "/";
        var $ = cheerio.load(html);

        // 遍历本页的 album
        var albums = [];

        $("#tiles li").each(function(i,v){
            var album_url = prefix + $(v).find("a").attr("href");
            var album_name = $(v).find("img").attr("alt");

            var album_obj = new Object();
            album_obj.name = album_name;
            album_obj.url = album_url;

            albums.push(album_obj);
        });

        var nxt_url = null;

        // 是否还有下一页
        $(".nxt").each(function(i, v){
            nxt_url = prefix + $(v).attr("href");
        });

        processAlbums(albums, db, function(){
            // albums 中的已经处理完了
            if (nxt_url) {
                // 还有下一页
                console.log("the next page is " + nxt_url);
                parseHome(nxt_url, db, callback);
            }
            else {
                // 全部处理完了
                callback();
            }
        });
    });
}

function processAlbums(albums, db, callback) {
    if (0 < albums.length) {
        var obj = albums.shift();

        database.saveAlbum(obj, db, function(need_proc) {
            // 存储后
            if (need_proc) {
                parseAlbum(obj, db, function () {
                    database.saveAlbumDownloaded(obj, db, function() {
                        console.log("add ablum " + obj.name);
                        processAlbums(albums, db, callback);
                    });
                });
            }
            else {
                processAlbums(albums, db, callback);
            }
        });
    }
    else {
        callback();
    }
}

function processDetails(details, db, callback) {
    if (0 < details.length) {
        var obj = details.shift();
        database.saveImage({album:obj.name, url:obj.url}, db, function(){
            processDetails(details, db, callback);
        });
        /*
         parseDetail(obj, db, function(img_url){
         database.saveImage({album:obj.name, url:img_url}, db, function(){
         processDetails(details, db, callback);
         });
         });
         */
    }
    else {
        callback();
    }
}

exports.parseHome = parseHome;
exports.parseAlbum = parseAlbum;
exports.parseDetail = parseDetail;
