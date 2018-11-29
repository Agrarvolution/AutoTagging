/**

 File zur Verwaltung aller Daten, die bei der Ver- und Bearbeitung der Tags anfallen

 */

#include "js/libs/json2.js"
#include "js/libs/promise.js"
#include "AWS/RekognitionLabels.js"
//#include "VisionLabels.js"
#include "CombineScript.jsx"
#include "ModifyTags.jsx"
#include "Label.js"
#include "LabelList.js"

function main()
{
    imagePath = getImagePath();

    labelList = new LabelList([], imagePath);

    findLabels();
}

function findLabels()
{
    if (imagePath !== null && imagePath !== "")
    {
        var jsonAWS = sendToAWS(labelList.imagePath);
        var jsonVision = sendToVision(labelList.imagePath);

        var recognitionObject = handleRekognitionResponse(jsonAWS);
        var visionObject = handleVisionResponse(jsonVision);

        labelList.labels = CombineScript.getSingleList(recognitionObject, visionObject);
    }
}

function getImagePath()
{
    return "C:/Users/Public/Pictures/Sample Pictures/Wüste.jpg";
}

function sendToAWS(imagePath)
{
    var recLabels = new RecognitionLabels();
    return recLabels.getLabels(imagePath);
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
    if (!visionObject.responses) 
    {
        return [];
    }
    else if (!visionObject.responses[0].labelAnnotations) 
    {
        return [];
    }


    for (var i = 0; i < visionObject.responses[0].labelAnnotations.length; i++) 
    {
        var responsePart = visionObject.responses[0].labelAnnotations[i];
        if (responsePart.description && responsePart.score)
        {
            if (responsePart.description === 'string' || responsePart.description instanceof String)
            {
                var labelNew = new Label(responsePart.description, responsePart.score, []);
                labelNew.clamp();
                labelNew.sanitize();
                tagArray.push(labelNew);
            }
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
            
            var responsePart = rekognitionObject.Labels[i];
            if (responsePart.Name === 'string' || responsePart.Name instanceof String)
            {
                var labelNew = new Label(rekognitionObject.Labels[i].Name, rekognitionObject.Labels[i].Confidence, parents);
                labelNew.clamp();
                labelNew.sanitize();
                tagArray.push(labelNew);
            }
        }
        else if (rekognitionObject.Labels[i].Name && rekognitionObject.Labels[i].Confidence)
        {
            if (responsePart.Name === 'string' || responsePart.Name instanceof String)
            {
                var labelNew = new Label(rekognitionObject.Labels[i].Name, rekognitionObject.Labels[i].Confidence, []);
                labelNew.clamp();
                labelNew.sanitize();
                tagArray.push(labelNew);
            }
        }
    }
    return tagArray;
}












main();