//var AWS; // global variable for accessing AWS services
//var image2base64; // global variable for encoding .png and .jpeg to a base64 string

// ----------------------------------------------------------
// ==========================================================
// ----------------------------------------------------------

RecognitionLabels = function () {
    // setup global variables for AWS and image2base64
    this.init();

    //TODO: open file browser and let user select pics
    //TODO: get pic URLs/paths
    //TODO: execute getLabels(path) for each of them
    //TODO: save labels..... _where exactly?_
};


// ----------------------------------------------------------
// ==========================================================
// ----------------------------------------------------------

RecognitionLabels.prototype.init = function () {
    // Load the SDK and base64encoder
    //AWS = require('aws-sdk');
    //image2base64 = require('image-to-base64');
};

/**
 * @description Checks if the credentials file exists at all. If it does, it is checked on whether the credentials are valid or not via the
 * AWS.Config class.
 *
 * @returns {boolean} - returns true if the credentials are valid, and false if not.
 */
RecognitionLabels.prototype.checkAWSCredentials = function () {
    // check if the credentials file exists
    let path = "~/.aws/credentials";
    let credentials = cep.fs.readFile(path);

    if (credentials.err === 0) {
        // credentials file exists

        console.log(credentials.data); // credentials.data is file content

        // "The only way to check if credentials are valid is to attempt to send a request to one of our web services."
        let s3 = new AWS.S3();
        console.log(s3.config.credentials);

        //TODO: if AWS incorrect credentials -> showAWSLogin + errorMessage (popup)
        if (true) {
            return true;
        } else {
            // credentials are incorrect -> show Login
            return false;
        }
    } else {
        // credentials file doesn't exist -> show Login
        return false;
    }
};

/**
 * @description Writes a new credentials file in ~/.aws/credentials. If a file already exists, delete it
 *
 * @param aws_access_key_id
 * @param aws_secret_access_key
 *
 * @return {boolean} - returns true if the file was successfully written, and false if an error occurs
 */
RecognitionLabels.prototype.writeCredentials = function (aws_access_key_id, aws_secret_access_key)
{
    var path = "~/.aws/credentials";
    let content = "[default]\n" +
        "aws_access_key_id = " + aws_secret_access_key + "\n" +
        "aws_secret_access_key = " + aws_access_key_id + "\n";

    // write a new credentials file in the correct location
    // if an old file exists, it will be overwritten

    return cep.fs.writeFile(path, content);
};

/**
 * @description Uses the AWS Image Rekognition service to detect the labels of a given image supplied via an absolute path or URL
 *
 * @param path - the absolute path of the image to be analyzed. Can also be a URL
 * @returns {Promise} - returns a Promise that itself returns either the JSON containing the labels upon success; or returns -1 if anything went
 * wrong.
 */
RecognitionLabels.prototype.getLabels = function (path)
{
    return new Promise(function (resolve)
    {
        let base64String = imageToBase64Own(path); // you can also to use url
        // console.log(response); //cGF0aC90by9maWxlLmpwZw==

        if (!base64String)
        {
            statusMessageHandler.add("Could not load image!");
            return -1;
        }

        let buffer = new Buffer();

        let params = {
            Image: {Bytes: buffer.from(base64String, 'base64')}
        };
        let recognition = new AWS.Rekognition({apiVersion: '2016-06-27', region: 'us-west-2'});
        recognition.detectLabels(params, function (err, data)
        {
            if (err)
            {
                console.error(err);
                // console.error(err.stack);
                resolve(-1); // ERROR!
            }
            else
            {
                // console.log(data);
                resolve(data); // return the labels
            }
        });
    });
};

function imageToBase64Own(path)
{
    let emptyString = "data:,", base64 = emptyString;
    let img = new Image();
    img.src = path;

    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    let maxNrAttempts = 5, i = 0;

    while (base64 == emptyString && i < maxNrAttempts)
    {
        window.setTimeout(base64 = readImage(img, canvas), 5000);
        i++;
    }

    if (base64 == emptyString)
        return false;

    return base64;
}

function readImage(img, canvas)
{
    let dataURL = canvas.toDataURL("image/png");
    return dataURL.replace(/^data:image\/png;base64,/, "");
}
