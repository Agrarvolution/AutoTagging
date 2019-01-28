function CombineScript()
{
    this.dataManagement = new DataManagement();
}

/**
 * Processes responses from Google Vision and Amazon Recognition
 * @return {LabelList} array with combined values and confidences
 * @param {Object} visionResponse
 * @param {Object} recognitionResponse
 */
CombineScript.prototype.getSingleList = function(visionResponse, recognitionResponse)
{
    var visionObject = this.dataManagement.handleVisionResponse(visionResponse);
    var recognitionObject = this.dataManagement.handleRecognitionResponse(recognitionResponse);
    var outputObject = [];

    if (typeof visionObject !== 'undefined' && visionObject.length > 0 && typeof recognitionObject !== 'undefined' && recognitionObject.length > 0)
    {
        for (var i = 0; i < visionObject.length; i++)
        {
            var matchingIndex = this.searchInDescription(recognitionObject, visionObject[i].name);
            if (matchingIndex >= 0)
            {
                var tempObject = recognitionObject[matchingIndex];
                recognitionObject.splice(matchingIndex, 1); //doesn't take Vision parents in account
                tempObject.confidence*= visionObject[i].confidence;
                outputObject.push(tempObject);
                visionObject.splice(i--,1);
            }
        }

        visionObject = this.squareConfidence(visionObject);
        recognitionObject = this.squareConfidence(recognitionObject);

        outputObject = outputObject.concat(visionObject);
        outputObject = outputObject.concat(recognitionObject);
    }
    else if (typeof visionObject !== 'undefined' && visionObject.length > 0)
    {
        outputObject = this.squareConfidence(visionObject);
    }
    else if (typeof recognitionObject !== 'undefined' && recognitionObject.length > 0)
    {
        outputObject = this.squareConfidence(recognitionObject);
    }

    return new LabelList(outputObject);
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


/**
 * Checks if the value is contained in the description in the array
 * @return {number} int position in the array
 * @param {Object} array
 * @param {string} value
 */
CombineScript.prototype.searchInDescription = function(array, value)
{
    for (var i = 0; i < array.length; i++)
    {
        if (array[i].name.toLowerCase() === value.toLowerCase())
        {
            return i;
        }
    }
    return -1;
};