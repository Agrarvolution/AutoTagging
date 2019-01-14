/**

 File zur Verwaltung aller Daten, die bei der Ver- und Bearbeitung der Tags anfallen

 */

//#include "js/libs/json2.js"
//#include "js/libs/promise.js"
#include "AWS/RekognitionLabels.js"
//#include "VisionLabels.js"
#include "CombineScript.jsx"
#include "ModifyTags.jsx"
#include "Label.js"
#include "LabelList.js"

function main()
{
    var imagePath = getImagePath();

    var labelList = new LabelList([], imagePath);

    findLabels(labelList);
}

function findLabels(labelList)
{
    if (labelList.imagePath !== null && labelList.imagePath !== "")
    {
        var jsonAWS = sendToAWS(labelList.imagePath);
        var jsonVision = sendToVision(labelList.imagePath);

        var recognitionObject = handleRekognitionResponse(jsonAWS);
        var visionObject = handleVisionResponse(jsonVision);

        labelList.labels = CombineScript.getSingleList(recognitionObject, visionObject);
        
	    alert(labelList.labels);
    }
}

/**
 * Exports the selected image(s) and returns the absolute path to the copy or creates a list of files to tag if multiple images are selected
 */
function getImagePath()
{
    var imagePath = "C:/AutoTagging/tempImage.jpg";

    /*
    Handler for multiple selected images

    var selectedFiles = app.document.selections;

    for (var i = 0; i < selectedFiles.length; i++)
    {

    }
    */

    var currentPreviewFile = app.document.selections[0].core.preview.preview;
    currentPreviewFile.exportTo (imagePath, 10);

    return imagePath;
}

function sendToAWS(imagePath)
{
    var recognitionLabelsObject = new RecognitionLabels();
    var recognitionLabels = recognitionLabelsObject.getLabels(imagePath);
    return recognitionLabels;
}

function sendToVision(imagePath)
{
    //return visionLabelScript.getLabels(imagePath);
    return [];
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










// TODO: Event handler anbinden, der onSelectionChanged das script startet

main();