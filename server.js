var express = require('express');
var Sequelize = require('sequelize');
var config = require('./config.json');
var bodyParser = require('body-parser');
var path = require('path');
var gm = require('gm').subClass({ imageMagick: true });
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

router.post('/uploadImages', function(req, res) {
    console.log(req.file);
    res.status(200).json("uploaded");
});
router.post('/saveimg', function(req, res) {
    try{
 //var dt = JSON.parse(req.body);
   // console.log(dt);
    // var base64Data = req.body.replace(/^data:image\/png;base64,/, "");
var options = {filename: 'test'};
var dta = 'data:image/jpeg;base64,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';
var imageData = new Buffer(req.body.img.replace(/^data:image\/png;base64,/, ""), 'base64');
   
base64.base64decoder(imageData, options, function (err, saved) {
    if (err) { console.log(err); } 

    console.log(saved);    
}); 
    }catch(e){
        console.log(e);
    }
   
    
   /* require("fs").writeFile('down_files\\out.png', base64Data, 'base64', function(err) {
        console.log(err);
        res.status(200).json('uploaded');
    });*/
})
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
            var filew = fs.createWriteStream(photosLocation + 'IMG00' + j + '.JPG');
            console.log('file being created IMG00' + j + '.JPG');
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
            }, 3000);
        });
    });

    function ScaleImage() {
        //ffmpeg -i 0.jpg -vf scale=800:-1 output_800x500.jpg
        var exec = require('child_process').exec;
        var ffmpegpath = 'C:\\ffmpeg-20160301-git-1c7e2cf-win64-static\\bin\\ffmpeg';
        var cmd = ffmpegpath + ' -i ' + photosLocation + 'IMG%03d.JPG -vf scale=1280:-1 ' + scaledPhotos + 'IMG%03d.JPG';
        //del/f convert.mp4          
        exec('del /q ' + scaledPhotos, function(error, stdout, stderr) {
            console.log('convert.avi deleted' + error + stdout + stderr);
            exec(cmd, function(error, stdout, stderr) {
                console.log('all images have been scaled' + error + stdout + stderr);
                // createVideoFromImages();
                setTimeout(function() {
                    CropImage();
                }, 2000);
                // command output is in stdout
            });
        });
    }

    function CropImage() {
        // ffmpeg -i 0.jpg -vf "crop=500:800:0:0" after.mp4
        var exec = require('child_process').exec;
        var ffmpegpath = 'C:\\ffmpeg-20160301-git-1c7e2cf-win64-static\\bin\\ffmpeg';
        var cmd = ffmpegpath + ' -i ' + scaledPhotos + 'IMG%03d.JPG -vf "crop=1280:720:0:0" ' + cropedPhotos + 'IMG%03d.JPG';
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
        var cmd = ffmpegpath + ' -framerate 1/5 -i ' + cropedPhotos + 'IMG%03d.JPG -c:v libx264 -r 30 -pix_fmt yuv420p ' + videoLocation;
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
