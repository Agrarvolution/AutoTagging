﻿
exports.LabelList = class
{
    /**
     * Stores and processes all the labels for a picture
     * @param {array} labels 
     */
    constructor(labels, filePath)
    {
        this.labels = labels;
        this.filePath = filePath;
    }

    toJSON()
    {
        return JSON.stringify(this);
    }

    testOutput()
    {
        alert("Loading LabelList correctly! Yay!");
    }
    
    /**
     * Compares to another array and removes duplicates from the current array.
     * @param {array} decider 
     */
    stripArray(decider)
    {
        if (this.labels)
        {
            for (var i = 0; i < this.labels.length; i++)
            {
                if (searchInArray(decider, this.labels[i]))
                {
                    this.labels.splice(i--,1);
                }
            }
        }
    }
    
    /**
     * Deletes all objects in the array that have a lower ocnfidence than a given threshold.
     * @param {float} confidence Threshold to decide if a entry is deleted or not
     */
    deleteByConfidence(confidence)
    {
        if (this.labels)
        {
            var newLabelArray = [];
            for (var i = 0; i < this.labels.length; i++)
            {
                if (this.labels[i].confidence >= confidence)
                {
                    newLabelArray.push(this.labels[i]);
                }
            }
        }
    }

    /**
        check if array contains value
        because indexOf doesn't work
        */
    searchInArray(value) 
    {
        if (this.labels)
        {
        for (var i = 0; i < this.labels.length; i++) 
        {
            if (this.labels[i].value === value) 
            {
                return true;
            }
        }
        }
        return false;
    }

    /**
     * Checks if the value is contained in the name in the array
     * @return int position in the array
     * @param {string} value 
     */
    searchInName(value) 
    {
        if (this.labels)
        {
            for (var i = 0; i < this.labels.length; i++) 
            {
                if (this.labels[i].name === value) 
                {
                    return i;
                }
            }
        }
        return -1;
    }

    /**
     * Sanitizes the description & parents of the array, and removes items from the array that aren't a String.
     */
    sanitizeArray()
    {
        if (this.labels)
        {
            var parentIndex = 0;
            //iterate for description
            for (var i = 0; i < this.labels.length; i++)
            {
                if (typeof this.labels[i].name === 'string' || this.labels[i].name instanceof String)
                {
                    this.labels[i].name = sanitizeString(this.labels[i].name);
                    
                    //iterate for parent description

                    for (parentIndex = 0; parentIndex < this.labels[i].parents.length; parentIndex++)
                    {
                        if (typeof this.labels[i].parents[parentIndex].name === 'string' || this.labels[i].parents[parentIndex].name instanceof String)
                        {
                            this.labels[i].parents[parentIndex].name = sanitizeString(this.labels[i].parents[parentIndex].name);
                        }
                        else 
                        {
                            this.labels.parents.splice(parentIndex--, 1);
                        }
                    }
                }
                else 
                {
                    this.labels.splice(i--, 1);
                }
            }
        }
    }

    /**
     * Sanitation method for a single string
     * @param {string} text 
     */
    sanitizeString(text)
    {
        return text.replace("/[/\\<>|,.;:%{}()\[\]#\'\"&?~*+\-_!@`´^]/gi", "").replace("\(^[\s\n\r\t\x0B]+)|([\s\n\r\t\x0B]+$)/g", "");
    }
}



