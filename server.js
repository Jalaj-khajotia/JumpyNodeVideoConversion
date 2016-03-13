var express = require('express');
var Sequelize = require('sequelize');
var config = require('./config.json');
var bodyParser = require('body-parser');
path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var base64 = require('node-base64-image');
var exec = require('child_process').exec;
var AWS = require('aws-sdk'),
    s3 = new AWS.S3(),
    params = { Bucket: 'marketing.snipebills', Key: '1.txt', Expires: 20 };

    var audioLocation = 'D:\\down_files\\songs\\song.mp3';
    var finalVideoLocation = 'convert.mp4';
    var mergedVideoLocation ='d:\\down_files\\out.mp4';
    var finalvideopath = path.join(__dirname, 'convert.mp4');


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

    var stat = fs.statSync(finalvideopath);

    res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Content-Length': stat.size
    });
    console.log(finalvideopath);

    var readStream = fs.createReadStream(finalvideopath);
    // We replaced all the event handlers with a simple call to readStream.pipe()
    readStream.pipe(res);

    //res.status(200).json('video');

});

router.post('/uploadImages', function(req, res) {
console.log(req.file);
 res.status(200).json("uploaded"); 
});
router.post('/updateimg', function(req, res) {

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

    base64.base64encoder(imgurl, options, function(err, image) {
        if (err) {
            console.log(err);
        }
        var buf = new Buffer(image.replace(/^data:image\/\w+;base64,/, ""),'base64')
        uploadS3(buf, imagname);
    });

});
router.post('/process-video', function(req, res) {
    console.log(req.body);
    var ffmpeg = require('fluent-ffmpeg');
    var files = [];
    var ff = [];
    if (req.body.files.length > 0) {
        for (var i = 0; i < req.body.files.length; i++) {
            files.push('https://s3-us-west-2.amazonaws.com/jumpy007/' + req.body.files[i]);
            ff.push(req.body.files[i]);
        }
    }
    console.log('ff[0]= ' + ff[0] + ' ff[1]= ' + ff[1]);
    /* var files = ["https://s3-us-west-2.amazonaws.com/jumpy007/Screenshot_2015-12-06-12-47-25.png",
         "https://s3-us-west-2.amazonaws.com/jumpy007/Screenshot_2015-12-06-12-48-33.png"
     ]*/

    var i = 0;
    var readFile = function(callback) {
        if (files.length > 0) {
            var file = files.shift();
            var filew = fs.createWriteStream('down_files/'+ req.body.files[i]);
            console.log('file being created ' + req.body.files[i]);
            console.log('file being written ' + 'https://s3-us-west-2.amazonaws.com/jumpy007/' + req.body.files[i]);
            var request = http.get('https://s3-us-west-2.amazonaws.com/jumpy007/' + req.body.files[i], function(response) {

                response.pipe(filew);
                i++;
                readFile(callback);
            });
        } else {
            callback();
        }
    }
    readFile(function() {
        console.log("Downloading finished.");
        setTimeout(function() {
            console.log('Video Conversion started.');
            console.log(ff[1]);
            ProcessVideo(ff);
        }, 1500);

    });

    function ProcessVideo(fles) {
        // make sure you set the correct path to your video file
        /* for (var i = 0; i < req.body.files.length; i++) {
             var proc = ffmpeg({ source: req.body.files[i], nolog: false }) //%03d.jpg
                 // loop for 5 seconds
                 .loop(5)
                 // using 25 fps
                 .fps(10)
                 .addInput('audio.mp3')
                 //.withFps(1)
                 // setup event handlers
                 .on('end', function() {
                     console.log('Image 1 has been converted');
                 })
                 .on('error', function(err) {
                     console.log('an error happened: ' + err.message);
                 })
                 // save to file
                 .save(i + '.avi');
         }*/
        var allFiles = fles;
        var i = 0;
        var convertfiles = function(callback) {
            if (allFiles.length > 0) {
                var name = allFiles.shift();
                console.log(name + ' file being processed');
                var proc = ffmpeg({ source:'down_files/'+ name, nolog: false }) //%03d.jpg
                    // loop for 5 seconds
                    .loop(5)
                    // using 25 fps
                    .fps(10)
                    // .addInput('audio.mp3')
                    //.withFps(1)
                    // setup event handlers
                    .on('end', function() {
                        console.log(name + 'image has been converted');
                        i++;
                        convertfiles(callback);
                    })
                    .on('error', function(err) {
                        console.log(fles[i] + ' an error happened: ' + err.message);
                    })
                    // save to file
                    .save('down_files/'+ i + '.avi');

            } else {
                callback();
            }
        }
        convertfiles(function() {
            console.log('All images have been converted');
            mergeVideos();
        });

        function AddAudio(callback) {
            console.log('adding audio started');
            var ffmpegpath = 'C:\\ffmpeg-20160301-git-1c7e2cf-win64-static\\bin\\ffmpeg';
            var cmd = ffmpegpath + ' -i d:\\down_files\\out.mp4 -i '+ audioLocation +' -codec copy -shortest '+ finalVideoLocation;
            //del/f convert.mp4
            exec('del/f convert.mp4', function(error, stdout, stderr) {
                console.log('convert.avi deleted' + error + stdout + stderr);
                exec(cmd, function(error, stdout, stderr) {
                    console.log('audio successsfully added' + error + stdout + stderr);
                    callback();
                    // command output is in stdout
                });
                // command output is in stdout
            });
        }

        function mergeVideos() {
            var firstFile = "down_files\\0.avi";
            var secondFile = "down_files\\1.avi";
                        /*
            var thirdFile = "third.mov";*/        

            var proc = ffmpeg(firstFile)
                .input(secondFile)
                //.input(thirdFile)
                //.input(fourthFile)
                //.input(...)
                .on('end', function() {
                    console.log('Video is successfully merged');
                    AddAudio(function() {
                        setTimeout(function() {
                            res.status(200).json("Done");
                        }, 4000);
                    });
                })
                .on('error', function(err) {
                    console.log('an error happened: ' + err.message);
                })
                .mergeToFile(mergedVideoLocation);
        }

        /*   var proc = ffmpeg({ source: 'image1.png', nolog: false }) //%03d.jpg
               // loop for 5 seconds
               .loop(5)
               // using 25 fps
               .fps(10)
               .addInput('audio.mp3')
               //.withFps(1)
               // setup event handlers
               .on('end', function() {
                   console.log('Image 2 has been converted');



               })
               .on('error', function(err) {
                   console.log('an error happened: ' + err.message);
               })
               // save to file
               .save('2.avi');*/
    }
});


/*app.listen(port, function() {

});
console.log('my api is running on port:' + port);*/
module.exports = app;