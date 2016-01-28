/**
 * Created by wuxingyu on 15/7/28.
 */

function saveAlbum(obj, db, callback) {
    var collection = db.collection('album');

    collection.findOne({name: obj.name, url: obj.url}, {limit: 1}, function (err, result) {
        if (null == result) {
            // download = 0，还未下载
            collection.insertOne({name: obj.name, url: obj.url, download:0}, null, function (err, result) {
                if (err) {
                    console.log("insert data error!!");
                }
                else {
                    console.log("save ablum name is " + obj.name + " url is " + obj.url);
                }
                callback(1);
            });
        }
        else {
            // 已经存在
            callback(!result.download);
        }
    });
}

function saveAlbumDownloaded(obj, db, callback) {
    var collection = db.collection('album');

    collection.updateOne({name: obj.name, url: obj.url}, {$set:{download:1}});
    callback();
}

function saveImage(obj, db, callback) {
    var collection = db.collection('image');

    collection.findOne({ablum: obj.album, url: obj.url}, {limit: 1}, function (err, result) {
        if (null == result) {
            collection.insertOne({ablum: obj.album, url: obj.url, download:0}, null, function (err, result) {
                if (err) {
                    console.log("insert data error!!");
                }
                else {
                    console.log("insert ablum: " + obj.album + " image url:" + obj.url);
                }
                callback();
            });
        }
        else {
            console.log("already exist!! ablum: " + obj.album + " image url:" + obj.url);
            callback();
        }
    });
}

function getImages(db, callback) {
    var collection = db.collection('image');

    collection.find({download:0}).toArray(function(err, docs) {
        if (err) {
            callback(null);
        }
        else {
            callback(docs);
        }
    });
}

function imageSaved(obj, db, callback) {
    var collection = db.collection('image');

    collection.updateOne({ablum: obj.ablum, url: obj.url}, {$set:{download:1}});

    callback();
}

exports.saveAlbum = saveAlbum;
exports.saveAlbumDownloaded = saveAlbumDownloaded;
exports.saveImage = saveImage;
exports.getImages = getImages;
exports.imageSaved = imageSaved;
