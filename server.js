/**
 * Created by wuxingyu on 15/7/19.
 */

var http = require("http"),
    url = require("url");

function start(route, handle) {
    function onRequest(request, response) {
        var postData = "";
        var pathname = url.parse(request.url).pathname;
        console.log("Request for " + pathname + " received.");
        route(handle, pathname, response, request);
    }

    http.createServer(onRequest).listen(10000);
    console.log("Server has started.");
}

exports.start = start;