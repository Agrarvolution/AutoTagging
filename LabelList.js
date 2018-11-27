
var labels = [];
/**
 * Stores and processes all the labels for a picture
 * @param {array} labels 
 */
function LabelList(labels, filePath)
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
    var newLabelArray = [];
    for (var i = 0; i < labels.length; i++)
    {
        if (labels[i].confidence >= confidence)
        {
            newLabelArray.push(labels[i]);
        }
    }
}

/**
    check if array contains value
    because indexOf doesn't work
    */
   function searchInArray(value) 
   {
       for (var i = 0; i < labels.length; i++) 
       {
           if (labels[i].value === value) 
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
 */
function sanitizeArray()
{
    var parentIndex = 0;
    //iterate for description
    for (var i = 0; i < labels.length; i++)
    {
        if (typeof labels[i].name === 'string' || labels[i].name instanceof String)
        {
            labels[i].name = sanitizeString(labels[i].name);
            
            //iterate for parent description

            for (parentIndex = 0; parentIndex < labels[i].parents.length; parentIndex++)
            {
                if (typeof labels[i].parents[parentIndex].name === 'string' || labels[i].parents[parentIndex].name instanceof String)
                {
                    labels[i].parents[parentIndex].name = sanitizeString(labels[i].parents[parentIndex].name);
                }
                else 
                {
                    labels.parents.splice(parentIndex--, 1);
                }
            }
        }
        else 
        {
            labels.splice(i--, 1);
        }
    }
}

/**
 * Sanitation method for a single string
 * @param {string} text 
 */
function sanitizeString(text)
{
    return text.replace("/[/\\<>|,.;:%{}()\[\]#\'\"&?~*+\-_!@`´^]/gi", "").replace("\(^[\s\n\r\t\x0B]+)|([\s\n\r\t\x0B]+$)/g", "");
}