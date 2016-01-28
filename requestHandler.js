/**
 * Created by wuxingyu on 15/7/25.
 */

var querystring = require("querystring"),
    formidable = require("formidable"),
    parser = require("./parser"),
    fs = require("fs"),
    imageDownloader = require("./imageDownloader"),
    mongoClient = require('mongodb').MongoClient;

function start(response, request) {
    console.log("Request handler 'start' was called.");

    var body = '<html>'+
        '<head>'+
        '<meta http-equiv="Content-Type" '+
        'content="text/html; charset=UTF-8" />'+
        '</head>'+
        '<body>'+
        '<form action="/scan"'+
        'method="post">'+
        '<input type="input" name="url">'+
        '<input type="submit" value="Scan" />'+
        '</form>'+
        '</body>'+
        '</html>';

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(body);
    response.end();
}

function upload(response, request) {
    console.log("Request handler 'upload' was called.");

    var form = new formidable.IncomingForm();
    console.log("about to parse");
    form.parse(request, function(error, fields, files) {
        console.log("parsing done");
        fs.renameSync(files.upload.path, "/tmp/test.png");
        response.writeHead(200, {"Content-Type": "text/html"});
        response.write("received image:<br/>");
        response.write("<img src='/show' />");
        response.end();
    });
}

function show(response, request) {
    console.log("Request handler 'show' was called.");
    fs.readFile("/tmp/test.png", "binary", function(error, file) {
        if(error) {
            response.writeHead(500, {"Content-Type": "text/plain"});
            response.write(error + "\n");
            response.end();
        } else {
            response.writeHead(200, {"Content-Type": "image/png"});
            response.write(file, "binary");
            response.end();
        }
    });
}

function scan(response, request) {
    var postData = "";

    request.setEncoding("utf8");

    request.addListener("data", function(postDataChunk) {
        postData += postDataChunk;
        console.log("Received POST data chunk '"+
            postDataChunk + "'.");
    });

    request.addListener("end", function() {
        console.log("the post data is " + postData);

        var params = querystring.parse(postData);

        console.log("the url is " + params['url']);

        mongoClient.connect('mongodb://localhost:27017/zhum_spider', function (err, db) {
            if (db) {
                parser.parseHome(params['url'], db, function() {
                    console.log("Finished !!");
                });
            }
            else {
                console.log("connect db error !!");
            }
        });

        response.writeHead(200, {"Content-Type": "text/html"});
        response.write("the url is " + params['url']);
        response.end();
    });
}

function download(response, request) {
    mongoClient.connect('mongodb://localhost:27017/zhum_spider', function (err, db) {
        if (db) {
            imageDownloader.download(db);
        }
        else {
            console.log("connect db error !!");
        }
    });

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write("start !");
    response.end();
}

exports.start = start;
exports.upload = upload;
exports.show = show;
exports.scan = scan;
exports.download = download;
