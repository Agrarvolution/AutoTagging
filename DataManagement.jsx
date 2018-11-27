/**

 File zur Verwaltung aller Daten, die bei der Ver- und Bearbeitung der Tags anfallen

 */

#include 'EventManager.jsinc'
#include "js/libs/json2.js"  

var imagePath;
var recognitionLabelScript = require('RecognitionLabels');
var visionLabelScript = require('VisionLabels');
var combineScript = require('Combinescript');
var modifyTagsScript = require('ModifyTags');

function main()
{
    imagePath = getImagePath();

    findLabels();
}

function findLabels()
{
    if (imagePath !== null && imagePath !== "")
    {
        var jsonAWS = sendToAWS(imagePath);
        var jsonVision = sendToVision(imagePath);

        var totalJSON = combineScript.getSingleList(jsonAWS, jsonVision);
    }
}

function getImagePath()
{
    return "C:\\Users\\Public\\Pictures\\Sample Pictures\\Wüste.jpg";
}

function sendToAWS(imagePath)
{
    return recognitionLabelScript.getLabels(imagePath);
}

function sendToVision(imagePath)
{
    return visionLabelScript.getLabels(imagePath);
}












main();