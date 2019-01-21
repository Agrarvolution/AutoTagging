/**

 File zur Verwaltung aller Daten, die bei der Ver- und Bearbeitung der Tags anfallen

 */

/**
 * Exports the selected image(s) and returns the absolute path to the copy or creates a list of files to tag if multiple images are selected
 */
function getImagePath()
{
    var imagePath = "C:/AutoTagging/tempImage.jpg";

    return imagePath;
}

function DataManagement()
{

}

/**
 * responseJSON gets parsed and the object is checked, whether the result is a valid Amazon Rekognition response.
 * @return empty array or array map with the description and confidence of the found tags
 * @param responseJSON
 */
DataManagement.prototype.handleRecognitionResponse = function(responseJSON)
{
    //let recognitionObject = JSON.parse(responseJSON);
    var recognitionObject = responseJSON;
    var tagArray = [];

    // check validity
    if (!recognitionObject.Labels)
    {
        return [];
    }


    for (var i = 0; i < recognitionObject.Labels.length; i++)
    {
        var responsePart = recognitionObject.Labels[i];
        if (recognitionObject.Labels[i].Name && recognitionObject.Labels[i].Confidence && recognitionObject.Labels[i].Parents && recognitionObject.Labels[i].Parents.length > 0)
        {
            var parents = [];
            for (var pIndex = 0; pIndex < recognitionObject.Labels[i].Parents.length; pIndex++)
            {
                parents.push(recognitionObject.Labels[i].Parents[pIndex]);
            }

            if (typeof(responsePart.Name) === 'string')
            {
                var labelNew = new Label(recognitionObject.Labels[i].Name, recognitionObject.Labels[i].Confidence, parents);
                labelNew.clamp();
                labelNew.sanitize();
                tagArray.push(labelNew);
            }
        }
        else if (recognitionObject.Labels[i].Name && recognitionObject.Labels[i].Confidence)
        {
            if (typeof(responsePart.Name) === 'string')
            {
                var labelNew = new Label(recognitionObject.Labels[i].Name, recognitionObject.Labels[i].Confidence, []);
                labelNew.clamp();
                labelNew.sanitize();
                tagArray.push(labelNew);
            }
        }
    }
    return tagArray;
};

/**
 * responseJSON gets parsed and the object is checked, whether the result is a valid Google Vision response.
 * @return empty array or array map with the description and confidence of the found tags
 * @param {string} responseJSON
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