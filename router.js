/**
 * Created by wuxingyu on 15/7/22.
 */

function route(handle, pathname, response, request) {
    if (typeof handle[pathname] === 'function') {
        handle[pathname](response, request);
    } else {
        console.log("No request handler found for " + pathname);
    }

}

exports.route = route;
