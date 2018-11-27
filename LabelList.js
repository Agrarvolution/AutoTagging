
/**
 * Stores and processes all the labels for a picture
 * @param {array} labels 
 */
function LabelList(labels, filePath = "C:/Users/Public/Pictures/Sample Pictures/Wüste.jpg")
{
    this.labels = labels;
    this.filePath = filePath;
}

LabelList.prototype.toJSON = function()
{
    return JSON.stringify(this);
}



/**
 * Compares to another array and removes duplicates from the current array.
 * @param {array} decider 
 */
function stripArray(decider)
{
    for (var i = 0; i < labels.length; i++)
    {
        if (searchInArray(decider, labels[i]))
        {
            labels.splice(i--,1);
        }
    }
}

/**
 * Deletes all objects in the array that have a lower ocnfidence than a given threshold.
 * @param {float} confidence Threshold to decide if a entry is deleted or not
 */
function deleteByConfidence(confidence)
{
    for (var i = 0; i < labels.length; i++)
    {
        if (labels[i].confidence < confidence)
        {
            labels.splice(i--, 1);
        }
    }
}

/**
    check if array contains value
    because indexOf doesn't work
    */
   function searchInArray(array, value) 
   {
       for (var i = 0; i < array.length; i++) 
       {
           if (array[i].value === value) 
           {
               return true;
           }
       }
       return false;
   }

/**
 * Checks if the value is contained in the name in the array
 * @return int position in the array
 * @param {string} value 
 */
function searchInName(value) 
{
    for (var i = 0; i < labels.length; i++) 
    {
        if (labels[i].name === value) 
        {
            return i;
        }
    }
    return -1;
}

/**
 * Sanitizes the description & parents of the array, and removes items from the array that aren't a String.
 * @param {array} array 
 */
function sanitizeArray(array)
{
    var parentIndex = 0;
    //iterate for description
    for (var i = 0; i < array.length; i++)
    {
        if (typeof array[i].description === 'string' || array[i].description instanceof String)
        {
            array[i].description = sanitizeString(array[i].description);
            
            //iterate for parent description

            for (parentIndex = 0; parentIndex < array[i].parents.length; parentIndex++)
            {
                if (typeof array[i].parents[parentIndex].name === 'string' || array[i].parents[parentIndex].name instanceof String)
                {
                    array[i].parents[parentIndex].name = sanitizeString(array[i].parents[parentIndex].name);
                }
                else 
                {
                    array.parents.splice(i, 1);
                }
            }
        }
        else 
        {
            array.splice(i, 1);
        }
    }
    return array;
}