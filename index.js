/**
 * Created by wuxingyu on 15/7/20.
 */

var server = require("./server.js"),
    router = require("./router.js"),
    requstHandler = require("./requestHandler.js");

var handle = {};
handle["/"] = requstHandler.start;
handle["/start"] = requstHandler.start;
handle["/upload"] = requstHandler.upload;
handle["/show"] = requstHandler.show;
handle["/scan"] = requstHandler.scan;
handle["/download"] = requstHandler.download;

server.start(router.route, handle);
