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
var labels = require('Label');

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

        var recognitionObject = handleRekognitionResponse(jsonAWS);
        var visionObject = handleVisionResponse(jsonVision);

        var totalJSON = combineScript.getSingleList(recognitionObject, visionObject);
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

/**
 * reponseJSON gets parsed and the object is checked, whether the result is a valid Google Vision response.
 * @return empty array or array map with the description and confidence of the found tags
 * @param {string} reponseJSON 
 */
function handleVisionResponse(responseJSON) 
{
    var visionObject = secureParseJSON(responseJSON);
    var tagArray = [];

    // check validity
    if (!visionObject.reponses) 
    {
        return [];
    }
    else if (!visionObject.reponses[0].labelAnnotations) 
    {
        return [];
    }


    for (var i = 0; i < visionObject.responses[0].labelAnnotations.length; i++) 
    {
        var responsePart = visionObject.responses[0].labelAnnotations[i];
        if (reponsePart.description && reponsePart.score)
        {
            var labelNew = new Label(reponsePart.description, reponsePart.score, []);
            tagArray.push(labelNew);
            labelNew.sanitize();
            labelNew.clamp();
        }
    }

    return tagArray;
}

/**
 * reponseJSON gets parsed and the object is checked, whether the result is a valid Amazon Rekognition response.
 * @return empty array or array map with the description and confidence of the found tags
 * @param {string} reponseJSON 
 */
function handleRekognitionResponse(responseJSON) 
{
    var rekognitionObject = secureParseJSON(responseJSON);
    var tagArray = [];

    // check validity
    if (!rekognitionObject.Labels) 
    {
        return [];
    }


    for (var i = 0; i < rekognitionObject.Labels.length; i++) 
    {
        if (rekognitionObject.Labels[i].Name && rekognitionObject.Labels[i].Confidence && rekognitionObject.Labels[i].Parents)
        {
            var parents = [];
            for (var pIndex = 0; pIndex < rekognitionObject.Labels[i].Parents.length; pIndex++)
            {
                parents.push = rekognitionObject.Labels[i].Parents[pIndex];
            }
            tagArray.push({name: rekognitionObject.Labels[i].Name, confidence: rekognitionObject.Labels[i].Confidence, parents: parents});
        }
        else if (rekognitionObject.Labels[i].Name && rekognitionObject.Labels[i].Confidence)
        {
            tagArray.push({name: rekognitionObject.Labels[i].Name, confidence: rekognitionObject.Labels[i].Confidence, parents: []});
        }
    }
    return clampConfidence(sanitizeArray(tagArray));
}












main();