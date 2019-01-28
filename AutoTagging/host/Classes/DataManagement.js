/**

 File zur Verwaltung aller Daten, die bei der Ver- und Bearbeitung der Tags anfallen

 */


function DataManagement()
{

}

/**
 * @return {string} the absolute path to the copy of file to tag
 */
DataManagement.prototype.getImagePath = function()
{
    return "C:/AutoTagging/tempImage.jpg";
};

/**
 * responseJSON gets parsed and the object is checked, whether the result is a valid Amazon Recognition response.
 * @return Array, that is either empty or filled with the description and confidence of the found tags
 * @param {Object} responseJSON
 * @param {Object} responseJSON.Labels
 * @param {string} responseJSON.Labels.Name
 * @param {number} responseJSON.Labels.Confidence
 * @param {Array} responseJSON.Labels.Parents
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
                parents.push(new Label(recognitionObject.Labels[i].Parents[pIndex].Name, 0, []));
            }

            if (typeof(responsePart.Name) === 'string')
            {
                tagArray.push(new Label(recognitionObject.Labels[i].Name, recognitionObject.Labels[i].Confidence / 100.0, parents));
            }
        }
        else if (recognitionObject.Labels[i].Name && recognitionObject.Labels[i].Confidence)
        {
            if (typeof(responsePart.Name) === 'string')
            {
                tagArray.push(new Label(recognitionObject.Labels[i].Name, recognitionObject.Labels[i].Confidence / 100.0, []));
            }
        }
    }
    return tagArray;
};

/**
 * responseJSON gets parsed and the object is checked, whether the result is a valid Google Vision response.
 * @return Array, that is either empty or filled with the description and confidence of the found tags
 * @param {Object} responseJSON
 * @param {Object} responseJSON.responses
 * @param {string} responseJSON.responses.labelAnnotations
 * @param {number} responseJSON.responses.score
 */
DataManagement.prototype.handleVisionResponse = function(responseJSON)
{
    //var visionObject = secureParseJSON(responseJSON);
    var visionObject = responseJSON;
    var tagArray = [];

    // check validity
    if (!visionObject)
    {
        return [];
    }
    else if (!visionObject[0].labelAnnotations)
    {
        return [];
    }


    for (var i = 0; i < visionObject[0].labelAnnotations.length; i++)
    {
        var responsePart = visionObject[0].labelAnnotations[i];
        if (responsePart.description && responsePart.score)
        {
            var labelNew = new Label(responsePart.description, responsePart.score, []);
            tagArray.push(labelNew);
        }
    }

    return tagArray;
};