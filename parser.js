/* @flow */
/**
 * Created by wuxingyu on 15/7/27.
 */
var cheerio = require("cheerio");
var request = require("request");
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
        var url_obj = urlm.parse(url, true);
        var $ = cheerio.load(html);

        // 遍历本页的 album
        var albums = [];

        $("ul#cata_choose_product li").each(function(i,v){
          var good_name = $(v).find("div.listDescript a").text();
          var good_id = $(v).find("div.listbox").attr("data-specseq");
          var good_image = $(v).find("div.listPic img.fn_img_lazy").attr("data-original");

          console.log("the good_name is " + good_name);
          console.log("the good_id is " + good_id);
          console.log("the good_image is " + good_image);

          // 先插入数据库

          // 下载图片，保存，更新数据库

          // 获取价格，更新数据库
          request(
            { method: 'POST',
            uri:"http://www.feiniu.com/category/get_item_promo/" ,
            form:{
                specseq:good_id
            }
          },
          function (error, response, body) {
            if (!error) {
              var item = JSON.parse(body);
              console.log("the it_price is " + item[good_id].it_price);
            }
            else {
              console.log('request error is : '+ error);
            }
          }
          );

        });

        var page_next = $(".page-link.next").attr("url");

        if (page_next) {
          console.log("the next page url is " + page_next);
          parseHome(page_next, db, callback);
        }
        else {
          callback();
        }
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
