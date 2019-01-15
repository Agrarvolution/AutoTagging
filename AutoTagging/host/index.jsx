//var AWS; // global variable for accessing AWS services
//var image2base64; // global variable for encoding .png and .jpeg to a base64 string

// ----------------------------------------------------------
// ==========================================================
// ----------------------------------------------------------
function startLabelDetection() {
    // setup global variables for AWS and image2base64
    //AWS = require('aws-sdk');
    //image2base64 = require('image-to-base64');
    
    //TODO: open file browser and let user select pics
    //TODO: get pic URLs/paths
    //TODO: execute getLabels(path) for each of them
    //TODO: save labels..... _where exactly?_
}



// ----------------------------------------------------------
// ==========================================================
// ----------------------------------------------------------

/**
 * @description Checks if the credentials file exists at all. If it does, it is checked on whether the credentials are valid or not via the
 * AWS.Config class.
 *
 * @returns {boolean} - returns true if the credentials are valid, and false if not.
 */
function checkAWSCredentials() {
    // check if the credentials file exists
    var path = "~/.aws/credentials";
    var credentials = window.cep.fs.readFile(path);
    
    if (credentials.err === 0) {
        // credentials file exists
        
        console.log(credentials.data); // credentials.data is file content
        
        // "The only way to check if credentials are valid is to attempt to send a request to one of our web services."
        var s3 = new AWS.S3();
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
}

/**
 * @description Writes a new credentials file in ~/.aws/credentials. If a file already exists, delete it
 *
 * @param aws_access_key_id
 * @param aws_secret_access_key
 *
 * @return {boolean} - returns true if the file was successfully written, and false if an error occurs
 */
function writeCredentials(aws_access_key_id, aws_secret_access_key) {
    var path = "~/.aws/credentials";
    var content = "[default]\n" +
        "aws_access_key_id = " + aws_secret_access_key + "\n" +
        "aws_secret_access_key = " + aws_access_key_id + "\n";
    
    // write a new credentials file in the correct location
    // if an old file exists, it will be overwritten
    var fileCreated = window.cep.fs.writeFile(path, content);
    
    return fileCreated;
}

/**
 * @description Uses the AWS Image Rekognition service to detect the labels of a given image supplied via an absolute path or URL
 *
 * @param path - the absolute path of the image to be analyzed. Can also be a URL
 * @returns {Promise} - returns a Promise that itself returns either the JSON containing the labels upon success; or returns -1 if anything went
 * wrong.
 */
function getLabels(path) {
    return new Promise(resolve => {
        image2base64(path) // you can also to use url
            .then((response) => {
                // console.log(response); //cGF0aC90by9maWxlLmpwZw==
                var params = {
                    Image: {
                        Bytes: Buffer.from(response, 'base64')
                    },
                };
                var rekognition = new AWS.Rekognition({ apiVersion: '2016-06-27', region: 'us-west-2' });
                rekognition.detectLabels(params, (err, data) => {
                    if (err) {
                        console.error(err);
                        // console.error(err.stack);
                        resolve(-1); // ERROR!
                    } else {
                        // console.log(data);
                        resolve(data); // return the labels
                    }
                });
            })
            .catch((error) => {
                console.log(error); //Exception error....
                resolve(-1); // ERROR!
            });
    });
}


