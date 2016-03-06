var express = require('express');
var Sequelize = require('sequelize');
var config = require('./config.json');
var bodyParser = require('body-parser');
 path = require('path');
var AWS = require('aws-sdk'),
    s3 = new AWS.S3(),
    params = { Bucket: 'marketing.snipebills', Key: '1.txt', Expires: 20 };

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
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

var bookModel = sequelize.define('books', { //define your model
    "bookName": Sequelize.STRING,
    "bookPrice": Sequelize.INTEGER
});
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

router.get('/signed-request', function(req, res) {
    var sig = require('amazon-s3-url-signer');

    var bucket1 = sig.urlSigner('AKIAIW2EOFJOSJTIGWSQ', 'oO1D4uskO68y6WiaDISIIR3GG0FTJ4x9M1TSh+5b');

    var url1 = bucket1.getUrl('GET', '2.jpg', 'marketing.snipebills', 10); //url expires in 10 minutes
    res.status(200).json(url1);
    /*  var s3bucket = new AWS.S3({params: {Bucket: 'marketing.snipebills'}});
    s3bucket.createBucket(function() {
      var params = {Key: 'myKey', Body: 'Hello!'};
      s3bucket.upload(params, function(err, data) {
        if (err) {
          console.log("Error uploading data: ", err);
        } else {
          console.log("Successfully uploaded data to myBucket/myKey");
        }
      });
    });*/
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
router.get('/fetch-video', function(req, res) {

    var filePath = path.join(__dirname, 'out.mp4');
    var stat = fs.statSync(filePath);

    res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': stat.size
    });

    var readStream = fs.createReadStream(filePath);
    // We replaced all the event handlers with a simple call to readStream.pipe()
    readStream.pipe(res);
    //res.status(200).json('video');
    
});
router.post('/process-video', function(req, res) {
    console.log(req.body);    
    var ffmpeg = require('fluent-ffmpeg');
    var files = [];
    if(req.body.files.length > 0)
    {
        for (var i=0;i<req.body.files.length;i++)
        {
            files.push('https://s3-us-west-2.amazonaws.com/jumpy007/'+req.body.files[0]);
        }
    }
   /* var files = ["https://s3-us-west-2.amazonaws.com/jumpy007/Screenshot_2015-12-06-12-47-25.png",
        "https://s3-us-west-2.amazonaws.com/jumpy007/Screenshot_2015-12-06-12-48-33.png"
    ]*/

    var i = 0;
    var readFile = function(callback) {
        if (files.length > 0) {
            var file = files.shift();
            var filew = fs.createWriteStream("image" + i + ".png");
            var request = http.get(file, function(response) {
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
            ProcessVideo();
        }, 1500);

    });

    function ProcessVideo() {
        // make sure you set the correct path to your video file
        
        var proc = ffmpeg({ source: 'image0.png', nolog: false }) //%03d.jpg
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
            .save('1.avi');

        var proc = ffmpeg({ source: 'image1.png', nolog: false }) //%03d.jpg
            // loop for 5 seconds
            .loop(5)
            // using 25 fps
            .fps(10)
            .addInput('audio.mp3')
            //.withFps(1)
            // setup event handlers
            .on('end', function() {
                console.log('Image 2 has been converted');

                var firstFile = "1.avi";
                var secondFile = "2.avi";
                /*
                var thirdFile = "third.mov";*/
                var outPath = "out.mp4";

                var proc = ffmpeg(firstFile)
                    .input(secondFile)
                    //.input(thirdFile)
                    //.input(fourthFile)
                    //.input(...)
                    .on('end', function() {
                        console.log('Video is successfully merged');
                    })
                    .on('error', function(err) {
                        console.log('an error happened: ' + err.message);
                    })
                    .mergeToFile(outPath);

            })
            .on('error', function(err) {
                console.log('an error happened: ' + err.message);
            })
            // save to file
            .save('2.avi');
            res.status(200).json("Done");
    }   
});
router.put('/book/:id', function(req, res) {
    var data = {
        id: req.params.id,
        bookName: req.body.bookName,
        bookPrice: req.body.bookPrice
    };

    bookModel.update(data, {
        where: {
            id: data.id
        }
    }).
    then(function(book) {
        res.status(200).json(book);
    }, function(error) {
        res.status(500).send(error);
    });
});

router.delete('/book/:id', function(req, res) {
    var data = {
        id: req.params.id
    };

    bookModel.destroy({
        where: {

            id: data.id

        }
    }).
    then(function(book) {
        res.status(200).json(book);
    }, function(error) {
        res.status(500).send(error);
    });
});


app.listen(port, function() {

});
console.log('my api is running on port:' + port);
