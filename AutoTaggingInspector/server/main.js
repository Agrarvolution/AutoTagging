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

// Imports the Google Cloud client library
const vision = require('@google-cloud/vision');

// Imports the Google Cloud client library.
const googleStorage = require('@google-cloud/storage');

var dataVision = {};


const homedir = require('os').homedir();
var pathVision = homedir + "\\.vision\\AutoTagging-4abe7e16e510.json";
var pathAWS = homedir + "\\.aws\\credentials";

var imagePath = "C:/AutoTagging/tempImage.jpg";

function init()
{
    console.log("Starting server");
    //writeCredentials("asdf", "jklo");
    start();
    run();
    console.log("Waiting for an incoming request");
}

function start()
{
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

    app.get("/tagImage", function (req, res, next)
    {
        console.log("Incoming Labeling Request");
        //res.status(202).send("Starting image labeling");

        getVisionLabels()
            .then(function (data)
            {
                dataVision = data;
            })
            .then(detectLabels()
                .then(function (dataAWS)
                {
                    res.status(200).send({"dataAWS": dataAWS,"dataVision": dataVision});
                }));

    });
}

function detectLabels()
{
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
                        console.log("==========================");
                        console.log("Amazon Recognition Labels:");
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
    });
}

function getVisionLabels()
{
    return new Promise(function (resolve)
    {
        // Creates a client
        const client = new vision.ImageAnnotatorClient({
            keyFilename: pathVision
        });

        // Performs label detection on the image file
        client
            .labelDetection(imagePath)
            .then(function (results)
            {
                console.log("==========================");
                console.log("Google Vision Labels:");
                console.log(results);
                resolve(results);
                //dataVision = results;
            })
            .catch(function (err)
            {
                console.error('ERROR:', err);
                resolve(-1);
            });
    });
}

function testGoogleVision()
{
    return new Promise(function (resolve)
    {
        // Instantiates a client. If you don't specify credentials when constructing
        // the client, the client library will look for credentials in the
        // environment.
        var storage = new googleStorage.Storage({
            keyFilename: pathVision
        });

        // Makes an authenticated API request.
        storage
            .getBuckets()
            .then(function(results)
            {
                resolve(true);
            })
            .catch(function(err)
            {
                resolve(false);
            });
    });
}

function testAWS()
{
    return new Promise(function (resolve)
    {
        var s3 = new AWS.S3();
        resolve(s3.config);
    });
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
    var credentials = fs.readFile(pathAWS);

    if (credentials.err === 0) {
        // credentials file exists

        console.log(credentials.data); // credentials.data is file content

        // "The only way to check if credentials are valid is to attempt to send a request to one of our web services."
        var s3 = new AWS.S3();
        s3.getBucketLocation(function (err, data) {
            if (err)
                return false;
            return true;
        });
        console.log(s3.config.credentials);
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
    var content = "[default]\n" +
        "aws_access_key_id = " + aws_secret_access_key + "\n" +
        "aws_secret_access_key = " + aws_access_key_id + "\n";

    // write a new credentials file in the correct location
    // if an old file exists, it will be overwritten
    fs.mkdirSync(homedir + "\\.aws");

    return fs.writeFile(pathAWS, content, function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
}

module.exports = init();