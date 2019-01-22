function CombineScript()
{

}

/**
 * Processes responses from Google Vision and Amazon Rekognition
 * @return {Array} array with combined values and confidences
 * @param {Array} visionObject
 * @param {Array} recognitionObject
 */
CombineScript.prototype.getSingleList = function(visionObject, recognitionObject)
{
    var outputObject = [];

    if (typeof visionObject !== 'undefined' && visionObject.length > 0 && typeof recognitionObject !== 'undefined' && recognitionObject.length > 0)
    {
        for (var i = 0; i < visionObject.length; i++)
        {
            var matchingIndex = searchInDescription(recognitionObject, visionObject[i].description);
            if (matchingIndex >= 0)
            {
                var tempObject = recognitionObject[matchingIndex];
                recognitionObject.splice(matchingIndex, 1); //doesn't take Vision parents in account
                tempObject.confidence*= visionObject[i].confidence;
                outputObject.push(tempObject);
                visionObject.splice(i--,1);
            }
        }
        outputObject.concat(squareConfidence(visionObject));
        outputObject.concat(squareConfidence(recognitionObject));
    }
    else if (typeof visionObject !== 'undefined' && visionObject.length > 0)
    {
        outputObject = squareConfidence(recognitionObject);
    }
    else if (typeof recognitionObject !== 'undefined' && recognitionObject.length > 0)
    {
        outputObject = squareConfidence(visionObject);
    }
    return outputObject;
};

/**
 * Squares all confidence levels in the array
 * @param {Array} array
 * @return {Array}
 */
CombineScript.prototype.squareConfidence = function(array)
{
    for (var i = 0; i < array.length; i++)
    {
        array[i].square();
    }
    return array;
};