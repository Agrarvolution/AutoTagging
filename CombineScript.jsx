function CombineScript()
{

}

/**
 * Processes responses from Google Vision and Amazon Rekognition
 * @return array with combined values and confidences
 * @param {array} visionResponse 
 * @param {array} rekognitionResponse 
 */
CombineScript.prototype.getSingleList = function(visionObject, rekognitionObject)
{
    var outputObject = [];

    if (typeof visionObject !== 'undefined' && visionObject.length > 0 && typeof rekognitionObject !== 'undefined' && rekognitionObject.length > 0)
    {
        for (var i = 0; i < visionObject.length; i++)
        {
            var matchingIndex = searchInDescription(rekognitionObject, visionObject[i].description);
            if (matchingIndex >= 0)
            {
                var tempObject = rekognitionObject[matchingIndex];
                rekognitionObject.splice(matchingIndex, 1); //doesn't take Vision parents in account
                tempObject.confidence*= visionObject[i].confidence;
                outputObject.push(tempObject);
                visionObject.splice(i--,1);
            }
        }
        outputObject.concat(squareConfidence(visionObject));
        outputObject.concat(squareConfidence(rekognitionObject));
    }
    else if (typeof visionObject !== 'undefined' && visionObject.length > 0)
    {
        outputObject = squareConfidence(rekognitionObject);
    }
    else if (typeof rekognitionObject !== 'undefined' && rekognitionObject.length > 0)
    {
        outputObject = squareConfidence(visionObject);
    }
    return outputObject;
}

/**
 * Squares all confidence levels in the array
 * @param {array} array 
 */
function squareConfidence(array)
{
    for (var i = 0; i < array.length; i++)
    {
        array[i].square();
    }
    return array;
}