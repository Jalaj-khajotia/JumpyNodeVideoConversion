$(document).ready(function() {
    AWS.config.update({
        accessKeyId: 'AKIAIW2EOFJOSJTIGWSQ',
        secretAccessKey: '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'
    });
    AWS.config.region = 'us-west-2';
    //s3.getObject({Bucket: 'bucketName', Key: 'keyName'});

    function uploadS3(file, callback) {
        console.log(file);
        // var params = {Bucket: 'jumpy007', Key: file.name, Body: file};
        var s3 = new AWS.S3();
        /*s3.upload(params, function(err, data) {
          console.log(err, data);
        });*/
        console.log(file);
        var params = {
            Bucket: 'jumpy007',
            /* required */
            Key: file.name,
            ContentType: 'image/jpeg',
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

    function CanvasSaver(url) {
        this.url = url;
        this.savePNG = function(fname) {
            console.log('in area');
            if (!url) return;
            fname = fname || 'picture';
            var canvas = document.getElementById("canvas");
            var data = canvas.toDataURL("image/png");
            data = data.substr(data.indexOf(',') + 1).toString();

            var dataInput = document.createElement("input");
            dataInput.setAttribute("name", 'imgdata');
            dataInput.setAttribute("value", data);
            dataInput.setAttribute("type", "hidden");

            var nameInput = document.createElement("input");
            nameInput.setAttribute("name", 'name');
            nameInput.setAttribute("value", fname + '.png');

            var myForm = document.createElement("form");
            myForm.method = 'post';
            myForm.action = url;
            myForm.appendChild(dataInput);
            myForm.appendChild(nameInput);

            document.body.appendChild(myForm);
            console.log('sending request');
            myForm.submit();
            document.body.removeChild(myForm);
        };

        this.generateButton = function(label, cnvs, fname) {

            $("#cntr-btn").append("<button id='downloadImg' >Save Image</button>");
            var scope = this;
            var btn = $('#downloadImg');
            btn.innerHTML = label;
            console.log('starting');
            btn.click(function() { scope.savePNG(fname); });
            return btn;
        };
    }

    function removeCropper() {
        $('#img').remove();
        $($('.cropper-container.cropper-bg')[0]).remove();
    }
    var files = [];

    $('#imgselector').change(function() {
        $('#loading').fadeIn();
        $('#spinner').show();

        function readURL(input) {           
            if (input.files && input.files[0]) {
                var reader = new FileReader();
                var name = "";
                if (input.files[0].name.indexOf('png') > -1 || input.files[0].name.indexOf('PNG') > -1) {
                    name = input.files[0].name;
                } else {
                    if (input.files[0].name.indexOf('jpg') > -1) {
                        name = input.files[0].name.substring(0, input.files[0].name.indexOf('jpg')) + 'png';
                    } else {
                        name = input.files[0].name.substring(0, input.files[0].name.indexOf('JPG')) + 'png';
                    }
                }
                 files.push(name);
                console.log('uploaded image name ' + name);

                reader.onload = function(e) {
                    var imgdata = { "base64": e.target.result, 'filename': name };
                    $.ajax({
                        url: 'http://localhost:3000/api/uploadImages',
                        dataType: 'json',
                        data: imgdata,
                        type: 'POST',
                        success: function(data) {
                            var index = files.indexOf(Cookies.get('imageName'));
                            console.log('image arrary updated');
                            if (index > -1) {
                                files[index] = 'edited' + name;
                            }
                            $('#loading').fadeOut();
                            $('#img-collection')
                                .append(
                                    $('<li>').append(
                                        $('<div class="thumbnail">').append(
                                            $('<img class="image image_picker_image" name="' + name + '">').attr('src', 'https://s3-us-west-2.amazonaws.com/jumpy007/' + name))));
                            // $('<img class="image image_picker_image" name="' + input.files[0].name + '">').attr('src', e.target.result))));
                            $('.thumbnail').last().append('<a class="delete-photo-a icon mini vis remove3 abs" title="Delete" href="#" rel="2">Delete</a>');
                            $('#spinner').hide();
                            console.log(data);
                        }
                    });

                }
                reader.readAsDataURL(input.files[0]);
                console.log(typeof(input.files[0]));
                /* uploadS3(input.files[0], function() {
                     $('#loading').fadeOut();
                     $('#img-collection')
                         .append(
                             $('<li>').append(
                                 $('<div class="thumbnail">').append(
                                     $('<img class="image image_picker_image" name="' + input.files[0].name + '">').attr('src', 'https://s3-us-west-2.amazonaws.com/jumpy007/' + input.files[0].name))));
                     //$('<img class="image image_picker_image" name="' + input.files[0].name + '">').attr('src', e.target.result))));
                     $('.thumbnail').last().append('<a class="delete-photo-a icon mini vis remove3 abs" title="Delete" href="#" rel="2">Delete</a>');
                     $('#spinner').hide();
                 });*/
            }
        }
        readURL(this);
    });

    function uploadEditedPhoto(url, name, callback) {
        // var params = {Bucket: 'jumpy007', Key: file.name, Body: file};
        $.post("http://localhost:3000/api/updateimg", {
            "url": url,
            "key": name
        }, function(res) {
            callback();
            console.log(res);
        });
    }

    /* var featherEditor = new Aviary.Feather({
         apiKey: '58f7bfc1-afdc-41cb-930a-caf9aca5cd62',
         theme: 'dark', // Check out our new 'light' and 'dark' themes!
         tools: 'all',
         appendTo: '',
         onSave: function(imageID, newURL) {
             var img = document.getElementById(imageID);
             img.src = newURL;
             console.log(newURL);
             console.log(typeof(newURL));

             var selectedImg = $('.thumbnail.selected').find('.image.image_picker_image');
             name = selectedImg.attr("name");
             selectedImg.attr('src', newURL);
             uploadEditedPhoto(newURL, name, function() {});
         },
         onError: function(errorObj) {
             alert(errorObj.message);
         }
     });*/

    function launchEditor(id, src) {
        featherEditor.launch({
            image: id,
            url: src
        });
        return false;
    }
    var imageName = "";



    $('#edit-btn').click(function() {
        imageName = Cookies.get('imageName');
        var url = 'https://s3-us-west-2.amazonaws.com/jumpy007/' + imageName;
        console.log(url);
        launchEditor('selectedimg', url);
    });

    function download(url, name) {
        // make the link. set the href and download. emulate dom click
        $('<a>').attr({
            href: url,
            download: name
        })[0].click();
    }

    function downloadFabric(canvas, name) {
        //  convert the canvas to a data url and download it.
        download(canvas.toDataURL(), name + '.png');
    }

    $('body').on('click', '.delete-photo-a.icon.mini.vis.remove3.abs', function() {

        var name = $('.thumbnail.selected').find('img').attr('name');
        var index = files.indexOf(name);
        console.log(files);
        console.log(name);
        console.log('number found ' + index);
        if (index > -1) {
            files.splice(index, 1);
        }
        $('.thumbnail.selected').parent().remove();
    });

    $(document).on("mouseenter", ".thumbnail.selected", function() {
        $('.thumbnail.selected').find('a').css('display', 'inherit');
    });

    $(document).on("mouseleave", ".thumbnail.selected", function() {
        $('.thumbnail.selected').find('a').hide();
    });


    $("#gen-video").click(function() {
        $('#video').addClass('loading');
        $.post("http://localhost:3000/api/process-video", {
            "files": files
        }, function(res) {
            console.log(res);
            $('#video').remove();
            $('#video-screen').append('<video id="video" class="" width="600" height="400" controls><source src="" type="video/mp4"> Your browser does not support the video tag.</video>');
            var video = document.getElementById('video');
            var source = document.createElement('source');
            source.setAttribute('src', 'http://localhost:3000/fetch-video');

            video.appendChild(source);
            video.play();
        });
    });

    function UploadEditedImage(imgName, srcImg) {
        var objectName = imgName;
        var img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');
        var canvas = new fabric.Canvas();
        var w, h;
        img.onload = function() {
            w = this.width;
            h = this.height;
            canvas.setDimensions({ width: w, height: h });
            console.log(srcImg);
            /* canvas.setBackgroundImage(img.src , canvas.renderAll.bind(canvas), {
                 width: w,
                 height: h
             }); */
            setTimeout(function() {
                var image = canvas.toDataURL("image/png"); //.replace("image/png", "image/octet-stream");
                //console.log(image);
                var newImg = { "img": image, 'filename': imgName };
                //newImg.src = image;
                var dta = JSON.stringify(image);
                $.ajax({
                    url: 'http://localhost:3000/api/saveimg',
                    dataType: 'json',
                    data: newImg,
                    type: 'POST',
                    success: function(data) {
                        var index = files.indexOf(Cookies.get('imageName'));
                        console.log('image arrary updated');
                        if (index > -1) {
                            files[index] = 'edited' + imgName;
                        }
                        console.log(data);
                    }
                });
                /* $.post("http://localhost:3000/api/saveimg", {
                     "canvas_json": JSON.stringify(newImg)
                 }, function(res) {
                     console.log(res);
                 });*/
            }, 2000);
            var coki = localStorage.getItem(objectName);
            if (coki !== null) {
                var ratio = Cookies.get(objectName + 'ratio');
                var json = JSON.parse(coki);
                console.log(json.objects);
                console.log(json.backgroundImage.width);

                json.backgroundImage.width = json.backgroundImage.width * ratio;
                json.backgroundImage.height = json.backgroundImage.height * ratio;
                json.objects[0].left = json.objects[0].left * ratio;
                json.objects[0].top = json.objects[0].top * ratio;
                json.objects[0].width = json.objects[0].width * ratio;
                json.objects[0].height = json.objects[0].height * ratio;
                json.objects[0].scaleX = json.objects[0].scaleX * ratio;
                json.objects[0].scaleY = json.objects[0].scaleY * ratio;

                canvas.loadFromJSON(json);
            }
            canvas.renderAll();
            console.log(w + " " + h);
        };
        img.src = srcImg;
    }

    $('#update-image').click(function() {
        var name = Cookies.get('imageName');
        var originalImg = $('.thumbnail.selected').find('.image.image_picker_image');
        var srcImg = originalImg.attr("src");
        UploadEditedImage(name, srcImg);
    });

    function drawImage() {
        var ctx = $("canvas")[0].getContext("2d"),
            img = new Image();

        img.onload = function() {
            ctx.drawImage(img, 0, 0, 500, 500);
            $("span").text("Loaded.");
        };
        img.src = "http://photojournal.jpl.nasa.gov/jpeg/PIA17555.jpg";
        $("span").text("Loading...");
    }

    function ResizeCanvas(imageElement) {
        var canvas = document.getElementById("canvas");
        var maxWidth = '800';
        var maxHeight = '600';
        var imageWidth = imageElement[0].naturalWidth;
        var imageHeight = imageElement[0].naturalHeight;
        var wRatio = maxWidth / imageWidth;
        var hRatio = maxHeight / imageHeight;
        console.log('wratio= ' + wRatio + "hRatio");
        var newWidth = maxWidth;

        var newHeight = imageHeight * wRatio;
        console.log('canvas width= ' + canvas.width);
        console.log('image Width= ' + imageWidth);
        if (canvas.width < imageWidth) {
            console.log('resizing width= ' + newWidth);
            canvas.width = newWidth * hRatio;
        }
        if (canvas.height < imageHeight) {
            console.log('resizing height= ' + newHeight);
            // canvas.height = newHeight;
        }
        console.log(imageWidth + imageHeight);
    }

    function makeImage(objectName, imageUrl) {
        var img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');
        var canvas = new fabric.Canvas();
        var w, h;
        img.onload = function() {
            w = this.width;
            h = this.height;
            canvas.setDimensions({ width: w, height: h });
            canvas.setBackgroundImage(imageUrl, canvas.renderAll.bind(canvas), {
                width: w,
                height: h
            });
            setTimeout(function() {
                var image = canvas.toDataURL("image/png"); //.replace("image/png", "image/octet-stream");
                //console.log(image);
                var newImg = { "img": image };
                newImg.src = image;
                $.post("http://localhost:3000/api/uploadImages", {
                    "canvas_json": newImg
                }, function(res) {
                    console.log(res);
                });
            }, 2000);
            var coki = localStorage.getItem(objectName);

            if (coki !== null) {
                canvas.loadFromJSON(JSON.parse(coki));
            }

            canvas.renderAll();
            console.log(w + " " + h);
        };
        img.src = imageUrl;
    }

    $('#makeImge').click(function() {
        makeImage('IMG-20151024-WA0001.jpg', 'http://localhost:3000/img/2.jpg');
    });

    $("#send-canvas").click(function() {
        var canvas_Json = JSON.stringify(localStorage.getItem("IMG_0725.JPG"));
        console.log(canvas_Json);
        $.post("http://localhost:3000/api/image-edited", {
            "image_name": "1.jpg",
            "canvas_json": canvas_Json
        }, function(res) {

            console.log(res);
        });
    });

    function LoadCanvas(objectName, image) {

        var coki = localStorage.getItem(objectName);
        var canvas = new fabric.Canvas("canvas");
        if (coki !== null) {
            canvas.loadFromJSON(JSON.parse(coki));
        }
        var imageDetails = JSON.parse(Cookies.get(objectName));
        canvas.setBackgroundImage(image.src, canvas.renderAll.bind(canvas), {
            backgroundImageOpacity: 1,
            width: imageDetails.width,
            height: imageDetails.height
        });

        function updateControls() {
            console.log(JSON.stringify(canvas));
            var newObject = jQuery.extend(true, {}, canvas);
            //newObject.backgroundImage = false;
            var imageName = localStorage.getItem('imageSelected');
            localStorage.setItem(imageName, JSON.stringify(newObject));
            console.log('json updated');

        }
        canvas.on({
            'object:moving': updateControls,
            'object:scaling': updateControls,
            'object:resizing': updateControls,
            'object:rotating': updateControls
        });
        canvas.renderAll();
        setTimeout(function() {
            //  var image = canvas.toDataURL("image/png"); //.replace("image/png", "image/octet-stream");
            // localStorage.setItem('imagedown', image);
        }, 1000);
    }

    $('body').on('click', '.thumbnail', function() {
        $('#spinner2').show();
        removeCropper();
        $(".canvas-container").remove();
        $("#canvas-row").append("<canvas id='canvas' width='800' height='500'></canvas>");

        var canvas = document.getElementById("canvas");
        // make the link. set the href and download. emulate dom click
        var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        var elements = $('.image.image_picker_image');
        var name = Cookies.get('imageName');

        /*   for (var i = 0; i < elements.length; i++) {
               if ($(elements[i]).attr('name') == name) {
                   // $(elements[i]).attr('src', image);
               }
           }*/

        $(".image").css("border", "0");
        $(".image").css("border", "0");
        $('.thumbnail').removeClass('selected');
        $(this).toggleClass('selected');
        /* var img = $('#selectedimg').attr('src', $('.thumbnail.selected').find('.image.image_picker_image').attr('src'));*/
        var imageName = $('.thumbnail.selected').find('.image.image_picker_image').attr("name");
        Cookies.set('imageName', imageName);
        localStorage.setItem('imageSelected', imageName);
        var originalImg = $('.thumbnail.selected').find('.image.image_picker_image');
        var coki = localStorage.getItem(imageName);
        $('.thumbnail.selected').find('a').css('display', 'inherit');
        var img = new Image();
        img.src = originalImg.attr("src");
        if (coki === null) {
            // ResizeCanvas(originalImg);


            /*  var ctx = $("#canvas")[0].getContext("2d");
              img.onload = function() {
                  ctx.drawImage(img, 0, 0, 350, 500);
                  $("span").text("Loaded.");
              };*/

            var canvas = new fabric.Canvas("canvas");
            var imageHeight = originalImg[0].naturalHeight;
            var imageWidth = originalImg[0].naturalWidth;

            var maxWidth = 500;
            var maxHeight = 500;
            var newHeight, newWidth;
            var hRatio = maxHeight / imageHeight;
            var wRatio = maxWidth / imageWidth;

            if (hRatio > 1) {
                newHeight = imageHeight;
            }
            if (wRatio > 1) {
                newWidth = imageWidth;
            }
            if (wRatio < 1 && hRatio >= 1) {
                newHeight = imageHeight * wRatio;
                newWidth = maxWidth;
            }
            if (wRatio >= 1 && hRatio < 1) {
                newHeight = maxHeight;
                newWidth = imageWidth * hRatio;
            }
            if (wRatio < 1 && hRatio < 1) {
                var ratio = Math.min(wRatio, hRatio);
                newHeight = imageHeight * ratio;
                newWidth = imageWidth * ratio;
            }
            console.log('ratio = ' + imageWidth / newWidth);
            Cookies.set(imageName + 'ratio', imageWidth / newWidth);

            console.log('newWidth= ' + newWidth + " newHeight = " + newHeight);
            /* canvas.clear();
             */
            var imageDetails = {
                "width": newWidth,
                "height": newHeight
            }

            Cookies.set(imageName, JSON.stringify(imageDetails));

            canvas.setBackgroundImage(img.src, canvas.renderAll.bind(canvas), {
                backgroundImageOpacity: 1,
                width: newWidth,
                height: newHeight
            });
            var object = new fabric.IText("Write Your Content Here", {
                fontFamily: "Arial",
                left: 150,
                top: 100,
                fontSize: 24,
                textAlign: "left",
                fill: "#000000"
            });

            canvas.add(object).setActiveObject(object);
            canvas.renderAll();

            function updateControls() {
                console.log(JSON.stringify(canvas));
                var newObject = jQuery.extend(true, {}, canvas);
                // newObject.backgroundImage = false;
                localStorage.setItem(imageName, JSON.stringify(newObject));
                console.log('json added');
            }
            canvas.on({
                'object:moving': updateControls,
                'object:scaling': updateControls,
                'object:resizing': updateControls,
                'object:rotating': updateControls
            });
        } else {
            LoadCanvas(imageName, img);
        }
        $('#spinner2').hide();
        /*  canvas.on({
              'touch:gesture': function() {
                  
                  console.log('gesture');
              },
              'touch:drag': function() {
                  console.log('dragging');
                  
              },
              'touch:orientation': function() {
                  console.log('orientation');
              },
              'touch:shake': function() {
                  console.log('shake');
              },
              'touch:longpress': function() {
                  console.log('longpress');
              }
          });*/

        //console.log(JSON.stringify(canvas));

        //  $(this).css("border", "14px double green");
    });

    function uploadBase64S3(file, fileName, callback) {
        console.log(file);
        // var params = {Bucket: 'jumpy007', Key: file.name, Body: file};
        var s3 = new AWS.S3();
        var buf = new Buffer(file.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        /*s3.upload(params, function(err, data) {
          console.log(err, data);
        });*/
        var params = {
            Bucket: 'jumpy007',
            /* required */
            Key: fileName,
            /* required */
            // ACL: ' public-read ',
            Body: buf,
            ContentEncoding: 'base64',
            ContentType: 'image/jpeg'
        };
        s3.putObject(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else {
                console.log(data);
                callback();
            } // successful response
        });
    }

    $('#Upload').click(function() {
        /* $('#img').cropper({
             built: function() {
                 $('#img').cropper('getCroppedCanvas').toBlob(function(blob) {
                     console.log(blob);
                 });
             }
         });*/


        /*  var canvas = new fabric.Canvas("canvas");
          downloadFabric(canvas, 'abc');*/
        var canvas = document.getElementById("canvas");

        // make the link. set the href and download. emulate dom click
        var image = localStorage.getItem('imagedown'); // here is the most important part because if you dont replace you will get a DOM 18 exception.
        var imageN = localStorage.getItem('imageSelected');
        console.log(imageN);
        //var imageN = $('.thumbnail.selected').find('.image.image_picker_image').src;
        // var image = image.replace("image/png", "image/octet-stream");
        var imageObj = new Image();
        imageObj.src = image;

        $('#loading').fadeIn();
        $.post("http://localhost:3000/api/updateimg", {
            "url": imageObj.src,
            "key": imageN
        }, function(res) {
            $('#loading').fadeOut();
            console.log(res);
        });
        /*   $('#loading').fadeIn();
          var data = {
              "url": imageObj.src,
              "key": imageN
          };

          $.ajax({
              type: "POST",
              url: "/api/updateimg",
              processData: false,
              contentType: 'application/json',
              data: JSON.stringify(data),
              success: function(r) {
                  console.log(r);
              }
          });*/
        var s3 = new AWS.S3();
        /*s3.upload(params, function(err, data) {
          console.log(err, data);
        });*/
        var params = {
            Bucket: 'jumpy007',
            /* required */
            Key: imageN,
            /* required */
            // ACL: ' public-read ',
            Body: image
        };
        /*s3.putObject(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else {
                console.log(imageN);
                $('#loading').fadeOut();
            } // successful response
        });*/
        /* uploadBase64S3(image,'test1', function() {
             $('#loading').fadeOut();
         });*/
        // window.location.href = image;
        /* var cs = new CanvasSaver('http://greenethumb.com/canvas/lib/saveme.php');
         cs.generateButton('save an image!', 'myimage');*/
    });

    $('body').on('click', '#crop', function() {
        var result = $('#img').cropper('getCroppedCanvas');
        console.log();
        //$('#selectedimg').modal().find('.modal-body').html(result);
        // $('#canvas-row').append();
        var myimage = new Image();
        myimage.src = result.toDataURL("image/png");
        console.log(result);
        var name = localStorage.getItem('imageSelected');
        $(".canvas-container").remove();
        $('#canvas').remove();
        $("#canvas-row").append("<canvas id='canvas' width='800' height='500'></canvas>");
        LoadCanvas(name, myimage);
        // $('.canvas-container').show();
        $('.cropper-container.cropper-bg').remove();
    });

    $('body').on('click', '#Edit', function() {

        $('.canvas-container').hide();
        $('#img').remove();
        $($('.cropper-container.cropper-bg')[0]).remove();
        var img = $('.thumbnail.selected').find('.image.image_picker_image')[0].src;
        var tag = "<img id='img' src=" + img + " style='width='800';height='500';'> </img>";
        $("#canvas-row").before(tag);
        $('#img').cropper({
            aspectRatio: 16 / 9,
            viewMode: 2,
            movable: true,
            minContainerWidth: 800,
            minCropBoxWidth: 600,
            crop: function(e) {
                // Output the result data for cropping image.
                /*console.log(e.x);
                console.log(e.y);
                console.log(e.width);
                console.log(e.height);
                console.log(e.rotate);
                console.log(e.scaleX);
                console.log(e.scaleY);*/
            }
        });



        // $($('.cropper-container.cropper-bg')[0]).width(800)
        // var canvas = new fabric.Canvas("canvas");
        //  console.log(canvas.toDataURL('png'));
        //  console.log(JSON.stringify(canvas));
        /* var coki = localStorage.getItem('obj');
         var canvas = new fabric.Canvas("canvas");
         canvas.loadFromJSON(JSON.parse(coki));
         canvas.renderAll();*/

        /*   var object = new fabric.IText("NEW TEXT", {
               fontFamily: "Arial",
               left: 150,
               top: 100,
               fontSize: 24,
               textAlign: "left",
               fill: "#000000"
           });
            canvas.add(object);
           canvas.renderAll();*/
        // var canvas = JSON.parse(Cookies.get('canvas'));

        console.log('object added');
    });

    $('#video').on('loadstart', function(event) {
        $(this).addClass('loading');
    });
    $('#video').on('canplay', function(event) {
        $(this).removeClass('loading');
    });
});
