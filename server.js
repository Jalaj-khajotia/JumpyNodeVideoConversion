var express = require('express');
var Sequelize = require('sequelize');
var config = require('./config.json');
var bodyParser = require('body-parser');
var path = require('path');
var gm = require('gm'); //.subClass({ imageMagick: true });
var fabric = require('fabric').fabric;
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var base64 = require('node-base64-image');
var exec = require('child_process').exec;
var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');
var AWS = require('aws-sdk'),
    s3 = new AWS.S3(),
    params = { Bucket: 'marketing.snipebills', Key: '1.txt', Expires: 20 };

var audioLocation = 'D:\\down_files\\songs\\song.mp3';
var finalVideoLocation = 'convert.mp4';
var mergedVideoLocation = 'd:\\down_files\\out.mp4';

var videoNAudio = 'down_files\\convert.mp4';
var finalvideopath = path.join(__dirname, videoNAudio);
var scaledPhotos = 'down_files\\scaledPhotos\\';
var cropedPhotos = 'down_files\\cropedPhotos\\';
var photosLocation = 'down_files\\Photos\\';
var modifiedPhotos = "down_files\\modifiedPhotos\\";

var videoLocation = 'd:\\down_files\\out.mp4';


var options = {
    tmpDir: __dirname + '/../public/uploaded/tmp',
    uploadDir: __dirname + '/../public/uploaded/files',
    uploadUrl: '/uploaded/files/',
    storage: {
        type: 'local'
    }
};


AWS.config.update({ accessKeyId: 'AKIAIW2EOFJOSJTIGWSQ', secretAccessKey: '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' });

var config = { secretKey: "oO1D4uskO68y6WiaDISIIR3GG0FTJ4x9M1TSh+5b" };
var http = require('https');
var fs = require('fs');
var password = config.password ? config.password : null;

var sequelize = new Sequelize(
    config.database,
    config.user,
    config.password, {
        logging: console.log,
        define: {
            timestamps: false
        }
    }
);

var app = express();
var port = 3000;
var router = express.Router(); // will help in adding routes
var viewRouter = express.Router();
app.use(bodyParser({ limit: '50mb' }));
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
        next();
    });
}

var bookModel = sequelize.define('books', { //define your model
    "bookName": Sequelize.STRING,
    "bookPrice": Sequelize.INTEGER
});

app.set('views', path.join(__dirname, 'views/home'));

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static(path.join(__dirname, 'node_modules')));


app.all('/*', function(req, res, next) {
    // CORS headers
    res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    // Set custom headers for CORS
    res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
    if (req.method == 'OPTIONS') {
        res.status(200).end();
    } else {
        next();
    }
});
app.use('/api', router); //this will add routing to your api.
//your api endpoint  localhost:3000/api/books
app.use('/', viewRouter);

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
    next();
});

var uploadManager = require('./uploader')(router);

viewRouter.get('/', function(req, res) {
    res.render('index', { title: 'Express' });
});

router.get('/signed-request', function(req, res) {
    var sig = require('amazon-s3-url-signer');

    var bucket1 = sig.urlSigner('AKIAIW2EOFJOSJTIGWSQ', 'oO1D4uskO68y6WiaDISIIR3GG0FTJ4x9M1TSh+5b');

    var url1 = bucket1.getUrl('GET', '2.jpg', 'marketing.snipebills', 10); //url expires in 10 minutes
    res.status(200).json(url1);
});

router.get('/sign-policy', function(req, res) {
    var crypto = require("crypto");
    var s3Policy = {
        "expiration": "2016-12-13T00:00:00Z",
        "conditions": [
            { "bucket": "marketing.snipebills" },
            ["starts-with", "$key", "1"],
            { "acl": "public-read" },
            { "success_action_redirect": "https://s3.amazonaws.com/marketing.snipebills/upload-success.html" },
            ["starts-with", "$Content-Type", "image/jpeg"]
        ]
    };

    var stringPolicy = JSON.stringify(s3Policy);
    var base64Policy = Buffer(stringPolicy, "utf-8").toString("base64");

    // sign the base64 encoded policy
    var signature = crypto.createHmac("sha1", config.secretKey)
        .update(new Buffer(base64Policy, "utf-8")).digest("base64");

    // build the results object
    var s3Credentials = {
        s3Policy: base64Policy,
        s3Signature: signature
    };
    res.status(200).json(s3Credentials);
});

viewRouter.get('/fetch-video', function(req, res) {

    var stat = fs.statSync(path.join(__dirname, videoNAudio));

    res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Content-Length': stat.size
    });
    console.log(path.join(__dirname, videoNAudio));

    var readStream = fs.createReadStream(path.join(__dirname, videoNAudio));
    // We replaced all the event handlers with a simple call to readStream.pipe()
    readStream.pipe(res);

    //res.status(200).json('video');

});

function upload(filename, callback) {
    console.log('uploading image to aws');
    fs.readFile(filename, function(err, data) {
        if (err) {
            throw err;
        }
        // var metaData = getContentTypeByFile('test.jpg'); 'edited' + filename
        DirectUploadS3(data, 'image/png', filename, function() {
            console.log('image updated onserver');
            callback();
        });
    });
}

router.post('/uploadImages', function(req, res) {

    try {
        var callback = function(){            
            res.status(200).json('uploaded');
        }
        var filename = req.body.filename;
        // var abc = req.body;
        //  console.log(req.body.base64.match(/^data:image\/jpeg;base64,/));
        if (req.body.base64.indexOf('data:image/jpeg;') > -1) {
            var imageBuf = new Buffer(req.body.base64.replace(/^data:image\/jpeg;base64,/, ""), 'base64');
            console.log('image is jpeg');
            //var buf = require('fs').readFileSync('1.jpg'); 
            gm(imageBuf, '1.jpg')
                .setFormat("png")
                .write(filename, function(err) {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log('out.png Created an image from a Buffer!');
                        upload(filename , callback);                        
                    }
                });
        } else {
            var imageBuf = new Buffer(req.body.base64.replace(/^data:image\/png;base64,/, ""), 'base64');
            console.log('image is png');
            //var buf = require('fs').readFileSync('1.jpg'); 
            gm(imageBuf, '1.png')
                .write('out.png', function(err) {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log('out.png Created an image from a Buffer!');
                        upload('out.png',callback);                       
                    };
                });
        }
        //res.status(200).json("uploaded");
    } catch (e) {
        console.log(e);
    }

});
router.post('/saveimg', function(req, res) {
    try {
        //var dt = JSON.parse(req.body);
        // console.log(dt);
        // var base64Data = req.body.replace(/^data:image\/png;base64,/, "");
        var options = { filename: 'test', filetype: '.png' };
        //console.log(req.body.img.replace(/^data:image\/png;base64,/, ""));
        var imageData = new Buffer(req.body.img.replace(/^data:image\/png;base64,/, ""), 'base64');

        base64.base64decoder(imageData, options, function(err, saved) {
            if (err) { console.log(err); }

            console.log(saved);
            setTimeout(function() {
                fs.readFile('test.png', function(err, data) {
                    if (err) {
                        throw err;
                    }
                    // var metaData = getContentTypeByFile('test.jpg');
                    DirectUploadS3(data, 'image/png', 'edited' + req.body.filename, function() {
                        console.log('image updated onserver');
                        res.status(200).json('uploaded');
                    });
                });
            }, 2000);

        });
    } catch (e) {
        console.log(e);
    }


    /* require("fs").writeFile('down_files\\out.png', base64Data, 'base64', function(err) {
         console.log(err);
         res.status(200).json('uploaded');
     });*/
});

router.post('/updateimg', function(req, res) {
    // console.log( req.body.url);

    var imgurl = req.body.url;
    var imagname = req.body.key;

    /*  console.log(req.body.url);
      var data;
      var filew = fs.createWriteStream(imagname);
      var request = http.get(imgurl, function(response) {
          data = response;
          response.pipe(filew);
      });*/

    AWS.config.update({
        accessKeyId: 'AKIAIW2EOFJOSJTIGWSQ',
        secretAccessKey: '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'
    });

    AWS.config.region = 'us-west-2';
    //s3.getObject({Bucket: 'bucketName', Key: 'keyName'});  

    function uploadS3(file, name) {
        // var params = {Bucket: 'jumpy007', Key: file.name, Body: file};
        var s3 = new AWS.S3();
        /*s3.upload(params, function(err, data) {
          console.log(err, data);
        });*/
        var params = {
            Bucket: 'jumpy007',
            /* required */
            Key: name,
            /* required */
            // ACL: ' public-read ',
            Body: file,
            ContentEncoding: 'base64',
            ContentType: 'image/jpeg'
        };

        s3.putObject(params, function(err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
                res.status(500).send(err);
            } else {
                console.log(data);
                res.status(200).json('uploaded');
            } // successful response
        });
    }

    var options = { string: true };
    var buf = new Buffer(imgurl.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    uploadS3(buf, imagname);
    /*  base64.base64encoder(imgurl, options, function(err, image) {
          if (err) {
              console.log(err);
              console.log(image);
          }
          var buf = new Buffer(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
          uploadS3(buf, imagname);
      });*/

});

function DirectUploadS3(file, metaData, filename, callback) {
    AWS.config.update({
        accessKeyId: 'AKIAIW2EOFJOSJTIGWSQ',
        secretAccessKey: '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'
    });
    AWS.config.region = 'us-west-2';
    console.log(file);
    // var params = {Bucket: 'jumpy007', Key: file.name, Body: file};
    var s3 = new AWS.S3();
    /*s3.upload(params, function(err, data) {
      console.log(err, data);
    });*/
    var params = {
        Bucket: 'jumpy007',
        /* required */
        Key: filename,
        ContentType: metaData,
        /* required */
        // ACL: ' public-read ',
        Body: file
    };  
    s3.putObject(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
            console.log(data);
            callback();
        } // successful response
    });
}
router.post('/image-edited', function(req, res) {

    /* var body = {
         "image_name": "",
         "canvas_json": ""
     }*/
    //var canvas_json = JSON.parse(req.body.canvas_json);
    var reqFile = fs.createWriteStream(modifiedPhotos + req.body.image_name);
    // myrequest = http.get('https://s3-us-west-2.amazonaws.com/jumpy007/' + req.body.image_name, function(response) {

    response.pipe(reqFile);
    myrequest.on('close', function() {
        var sizeOf = require('image-size');
        var dimensions = sizeOf(modifiedPhotos + req.body.image_name);
        var canvas = fabric.createCanvasForNode(dimensions.width, dimensions.height);
        console.log(dimensions.width, dimensions.height);
        //canvas.setDimensions({ width: dimensions.width, height: dimensions.height });
        /*canvas.setBackgroundImage(modifiedPhotos + req.body.image_name,
            canvas.renderAll.bind(canvas), {
                width: dimensions.width,
                height: dimensions.height
            });*/
        setTimeout(function() {
            //var image = canvas.toDataURL("image/png"); //.replace("image/png", "image/octet-stream");
            //console.log(image);
        }, 2000);
        var out = fs.createWriteStream(modifiedPhotos + "new.png");
        if (canvas_json !== null) {
            fabric.loadSVGFromURL('http://fabricjs.com/assets/55.svg', function(ob, op) {
                canvas.add(new fabric.PathGroup(ob, op).set({ left: 100, top: 100 }).scale(0.3));
                var stream = canvas.createPNGStream();
                stream.on('data', function(chunk) {
                    var output = png.pack();
                    res.setHeader('Content-Type', 'image/png');
                    output.pipe(res);
                    out.write(chunk);
                    console.log('done');
                });
                stream.pipe(out);
            }, { crossOrigin: 'anonymous' });
            /*  });*/
        }
    });

    //  });

});

router.post('/process-video', function(req, res) {
    console.log(req.body);
    var files = [];
    var ff = [];
    if (req.body.files.length > 0) {
        for (var i = 0; i < req.body.files.length; i++) {
            files.push('https://s3-us-west-2.amazonaws.com/jumpy007/' + req.body.files[i]);
            ff.push(req.body.files[i]);
        }
    }
    //  console.log('ff[0]= ' + ff[0] + ' ff[1]= ' + ff[1]);
    /* var files = ["https://s3-us-west-2.amazonaws.com/jumpy007/Screenshot_2015-12-06-12-47-25.png",
         "https://s3-us-west-2.amazonaws.com/jumpy007/Screenshot_2015-12-06-12-48-33.png"
     ]*/

    var i = 0;
    var readFile = function(callback) {
        var request;
        if (files.length > 0) {
            var file = files.shift();
            var j = i + 1;
            var filew = fs.createWriteStream(photosLocation + 'IMG00' + j + '.PNG');
            console.log('file being created IMG00' + j + '.PNG');
            console.log('file being written ' + 'https://s3-us-west-2.amazonaws.com/jumpy007/' + req.body.files[i]);
            request = http.get('https://s3-us-west-2.amazonaws.com/jumpy007/' + req.body.files[i], function(response) {

                response.pipe(filew);
                i++;
                console.log(i);
                console.log('file length ' + files.length);
                if (files.length == 0) {
                    request.on('close', callback);
                }
                readFile(callback);
            });
        } else {

            //callback();
        }
    }
    exec('del /q ' + photosLocation, function(error, stdout, stderr) {
        console.log('convert.avi deleted' + error + stdout + stderr);
        readFile(function() {
            console.log("Downloading finished.");
            setTimeout(function() {
                console.log('Video Conversion started.');
                console.log(ff[1]);
                ScaleImage();
                // ProcessVideo(ff);
            }, 5000);
        });
    });

    function ScaleImage() {
        //ffmpeg -i 0.jpg -vf scale=800:-1 output_800x500.jpg
        var exec = require('child_process').exec;
        var ffmpegpath = 'C:\\ffmpeg-20160301-git-1c7e2cf-win64-static\\bin\\ffmpeg';
        var cmd = ffmpegpath + ' -i ' + photosLocation + 'IMG%03d.PNG -vf scale=1280:-1 ' + scaledPhotos + 'IMG%03d.PNG';
        //del/f convert.mp4          
        exec('del /q ' + scaledPhotos, function(error, stdout, stderr) {
            console.log('convert.avi deleted' + error + stdout + stderr);
            exec(cmd, function(error, stdout, stderr) {
                console.log('all images have been scaled' + error + stdout + stderr);
                // createVideoFromImages();
                setTimeout(function() {
                    CropImage();
                }, 5000);
                // command output is in stdout
            });
        });
    }

    function CropImage() {
        // ffmpeg -i 0.jpg -vf "crop=500:800:0:0" after.mp4
        var exec = require('child_process').exec;
        var ffmpegpath = 'C:\\ffmpeg-20160301-git-1c7e2cf-win64-static\\bin\\ffmpeg';
        var cmd = ffmpegpath + ' -i ' + scaledPhotos + 'IMG%03d.PNG -vf "crop=1280:720:0:0" ' + cropedPhotos + 'IMG%03d.PNG';
        //del/f convert.mp4          
        exec('del /q ' + cropedPhotos, function(error, stdout, stderr) {
            exec(cmd, function(error, stdout, stderr) {
                console.log('all images have been Croped' + error + stdout + stderr);
                ConvertImagestoVideo(function() {
                    AddAudio(function() {
                        setTimeout(function() {
                            res.status(200).json("Done");
                        }, 4000);
                    })
                });
                // command output is in stdout
            });
        });
    }

    function AddAudio(callback) {
        console.log('adding audio started');
        var ffmpegpath = 'C:\\ffmpeg-20160301-git-1c7e2cf-win64-static\\bin\\ffmpeg';
        var cmd = ffmpegpath + ' -i ' + videoLocation + ' -i ' + audioLocation + ' -codec copy -shortest ' + videoNAudio;
        //del/f convert.mp4
        exec('del/f ' + videoNAudio, function(error, stdout, stderr) {
            console.log(videoNAudio + ' deleted' + error + stdout + stderr);
            exec(cmd, function(error, stdout, stderr) {
                console.log('audio successsfully added' + error + stdout + stderr);
                callback();
                // command output is in stdout
            });
            // command output is in stdout
        });
    }

    function ConvertImagestoVideo(callback) {
        // 'ffmpeg -framerate 1/5 -i img%03d.jpg -c:v libx264 -r 30 -pix_fmt yuv420p out.mp4'
        console.log('Converting images to video');
        var exec = require('child_process').exec;
        var ffmpegpath = 'C:\\ffmpeg-20160301-git-1c7e2cf-win64-static\\bin\\ffmpeg';
        var cmd = ffmpegpath + ' -framerate 1/5 -i ' + cropedPhotos + 'IMG%03d.PNG -c:v libx264 -r 30 -pix_fmt yuv420p ' + videoLocation;
        //del/f convert.mp4          
        exec('del/f ' + videoLocation, function(error, stdout, stderr) {
            console.log(videoLocation + ' deleted' + error + stdout + stderr);
            exec(cmd, function(error, stdout, stderr) {
                console.log('all images are added to video' + error + stdout + stderr);
                callback();
                // command output is in stdout
            });
        });
        // command output is in stdout
    }

    function ProcessVideo(fles) {
        var allFiles = fles;
        var i = 0;
        var convertfiles = function(callback) {
                if (allFiles.length > 0) {
                    var name = allFiles.shift();
                    console.log(name + ' file being processed');
                    var proc = ffmpeg({ source: 'down_files/' + name, nolog: false }) //%03d.jpg
                        // loop for 5 seconds
                        .loop(5)
                        // using 25 fps
                        .fps(10)
                        // .addInput('audio.mp3')
                        //.withFps(1)
                        // setup event handlers
                        .on('end', function() {
                            console.log(name + 'image has been converted to video');
                            i++;
                            convertfiles(callback);
                        })
                        .on('error', function(err) {
                            console.log(fles[i] + ' an error happened: ' + err.message);
                        })
                        // save to file
                        .save('down_files/' + i + '.avi');

                } else {
                    callback();
                }
            }
            /*  convertfiles(function() {
                  console.log('All images have been converted');
                  mergeVideos();
              });*/

        ConvertImagestoVideo(function() {
            AddAudio(function() {
                setTimeout(function() {
                    res.status(200).json("Done");
                }, 4000);
            });
        });
    }
});


/*app.listen(port, function() {

});
console.log('my api is running on port:' + port);*/
module.exports = app;
