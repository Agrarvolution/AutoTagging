/* npm Modules */
const express = require("express");
const app = express();
const request = require('request');
const http = require('http');
const path = require("path");
const bodyParser = require("body-parser");
const fs = require('fs');
const httpServer = http.Server(app);
const AWS = require('../node_modules/aws-sdk');
const image2base64 = require('image-to-base64');

function init()
{
    //writeCredentials("asdf", "jklo");
    start();
    run();
}

function start()
{
    console.log("Starting server");
    var port = 3200;
    var hostname = "localhost";

    /* Start the server */
    httpServer.listen(port);
}

function run()
{
    /* Middlewares */
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
    app.use(express.static(path.join(__dirname, "../client")));

    app.get("/test", function (req, res, next)
    {
        console.log("Calling test");
        res.status(200).send("Calling test, the servers response");
    });

    app.get("/tagImage", function (req, res, next)
    {
        console.log("Incoming Labeling Request");
        res.send(202, "Starting image labeling");

        detectLabels()
            .then(function (data) {
                res.status(200).send(data);
            });

    });
}

function detectLabels()
{
    var imagePath = "C:/AutoTagging/tempImage.jpg";

    return new Promise(function (resolve)
    {
        image2base64(imagePath) // you can also to use url
            .then(function (response)
            {
                // console.log(response); //cGF0aC90by9maWxlLmpwZw==
                var params = {
                    Image: { Bytes: Buffer.from(response, 'base64') }
                };

                var recognition = new AWS.Rekognition({apiVersion: '2016-06-27', region: 'us-west-2'});
                recognition.detectLabels(params, function (err, data)
                {
                    if (err)
                    {
                        console.error(err);
                        console.error(err.stack);
                        resolve(-1); // ERROR!
                    }
                    else
                    {
                        console.log(data);
                        resolve(data); // return the labels
                    }
                });
            })
            .catch(function (error)
            {
                console.log(error); //Exception error....
                resolve(-1); // ERROR!
            });
    })
}



/**
 * @description Checks if the credentials file exists at all. If it does, it is checked on whether the credentials are valid or not via the
 * AWS.Config class.
 *
 * @returns {boolean} - returns true if the credentials are valid, and false if not.
 */
function checkAWSCredentials()
{
    // check if the credentials file exists
    const homedir = require('os').homedir();
    var path = homedir + "\\.aws\\credentials";
    var credentials = fs.readFile(path);

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
function writeCredentials (aws_access_key_id, aws_secret_access_key)
{
    const homedir = require('os').homedir();
    //var path = "~/.aws/credentials";
    var path = homedir + "\\.aws\\credentials";
    var content = "[default]\n" +
        "aws_access_key_id = " + aws_secret_access_key + "\n" +
        "aws_secret_access_key = " + aws_access_key_id + "\n";

    // write a new credentials file in the correct location
    // if an old file exists, it will be overwritten
    fs.mkdirSync(homedir + "\\.aws");

    return fs.writeFile(path, content, function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
}

module.exports = init();