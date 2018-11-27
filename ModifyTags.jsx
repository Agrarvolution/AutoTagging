"use strict"

#include "js/libs/json2.js"  

function ModifyTags() 
{

	/**
	 The context in which this snippet can run.
	 @type String
	*/
	this.requiredContext = "Needs to run in Bridge, \nwith a selection of a file, \nideally with some metadata";	
}

/**
 Functional part of this snippet.  Get the selected Thumbnail and creates an XMPFile object which
 is used to get access to the XMP data.
 
 @return True if the snippet ran as expected, false otherwise
 @type boolean
*/
ModifyTags.prototype.run = function() 
{
	if(!this.canRun())
	{
		return false;
	}

	// Load the XMP Script library
	if( xmpLib == undefined ) 
	{
		if( Folder.fs == "Windows" )
		{
			var pathToLib = Folder.startup.fsName + "/AdobeXMPScript.dll";
		} 
		else 
		{
			var pathToLib = Folder.startup.fsName + "/AdobeXMPScript.framework";
		}
	
		var libfile = new File( pathToLib );
		var xmpLib = new ExternalObject("lib:" + pathToLib );
	}

	$.writeln("About to run SnpModifyXML");
	
	// Get the selected file
	var thumb = app.document.selections[0];
    
    

	if(thumb.hasMetadata)
	{
		// Get the metadata object - wait for  valid values
		var md = thumb.synchronousMetadata;
		
		// Get the XMP packet as a string and create the XMPMeta object
		var xmp = new XMPMeta(md.serialize());
		
		$.writeln("SnpModifyXML: About to modify XMP data for " + thumb.name);

		$.writeln("XMP packet before modifications:");
		$.writeln("-------------------------------------------------");
		$.writeln(xmp.dumpObject());
		
		// Change the creator tool
		xmp.setProperty(XMPConst.NS_XMP, "CreatorTool", "Changed by ModifyTags");
		
		// Change the date modified
		var d = new XMPDateTime(new Date());
		//d.convertToLocalTime();
		xmp.setProperty(XMPConst.NS_XMP, "ModifyDate", d, XMPConst.XMPDATE);
            
		// Create some custom data.  Register a new namespace and prefix
		XMPMeta.registerNamespace("http://ns.adobe.com/lightroom/1.0/", "lr:");
		
        
                    
        var JSONtags = '{{"Landschaft":[{"Wald":["Laubwald"]},{"Landschaftsobjekte":["Brücke","Bach","Schild"]}],"Personen":["Kind","Lukas"]}';
    
    //string eingabe geht nicht über mehrere Zeilen
        var rekognitionResponse = '{"LabelModelVersion":"V1","Labels":[{"Confidence":"0.98","Instances":[{"BoundingBox":{"Height":"0","Left":"0","Top":"0","Width":"0"},"Confidence":"0.95"}],"Name":"Laubwald","Parents":[{"Name":"Landschaft"}]},{"Confidence":"0.90","Instances":[{"BoundingBox":{"Height":"0","Left":"0","Top":"0","Width":"0"},"Confidence":"0.95"}],"Name":"Brücke","Parents":[{"Name":"Bauwerke"}]},{"Confidence":"0.91","Instances":[{"BoundingBox":{"Height":"0","Left":"0","Top":"0","Width":"0"},"Confidence":"0.95"}],"Name":"dog","Parents":[{}]}],"OrientationCorrection":"???"}';
        var visionResponse = '{"responses":[{"labelAnnotations":[{"mid":"/m/0bt9lr","description":"dog","score":0.97346616},{"mid":"/m/09686","description":"vertebrate","score":0.85700572},{"mid":"/m/01pm38","description":"clumber spaniel","score":0.84881884},{"mid":"/m/04rky","description":"mammal","score":0.847575},{"mid":"/m/02wbgd","description":"english cocker spaniel","score":0.75829375}]}]}';
        
        
        var threshold = 0.90;
        writeTags(xmp, processResponses(visionResponse, rekognitionResponse), threshold);
        
    /*
		xmp.appendArrayItem(lrNamespace, "hierarchicalSubject", "Orte|Linz", 0, XMPConst.ARRAY_IS_UNORDERED);
         xmp.appendArrayItem(lrNamespace, "hierarchicalSubject", "Orte|Budapest", 0, XMPConst.ARRAY_IS_UNORDERED);		
         
		xmp.appendArrayItem(XMPConst.NS_DC, "subject", "Linz", 0, XMPConst.ARRAY_IS_UNORDERED);
		xmp.appendArrayItem(XMPConst.NS_DC, "subject", "Budapest", 0, XMPConst.ARRAY_IS_UNORDERED);
*/
		$.writeln("XMP packet after modifications:");
		$.writeln("-------------------------------------------------");
		$.writeln(xmp.dumpObject());
	
		// Write the packet back to the selected file
		var updatedPacket = xmp.serialize(XMPConst.SERIALIZE_OMIT_PACKET_WRAPPER | XMPConst.SERIALIZE_USE_COMPACT_FORMAT);

		// Uncomment to see the XMP packet in XML form
		// $.writeln(updatedPacket);
		thumb.metadata = new Metadata(updatedPacket);
	
	}
	else
	{
		$.writeln("The selected thumbnail has no metadata.");
	}

	$.writeln("Ran ModifyTags");
	
	return true;
}

/**
 * Parses JSON and throws exception if the string is not a valid JSON
 * @param {string} jsonString 
 */
function secureParseJSON (jsonString)
{
    try {
        var tags = JSON.parse(jsonString);
    } catch (e) {
        $.writeln(e);
    }
    return tags;
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
    if (!visionObject.reponses) 
    {
        return [];
    }
    else if (!visionObject.reponses[0].labelAnnotations) 
    {
        return [];
    }


    for (var i = 0; i < visionObject.responses[0].labelAnnotations.length; i++) 
    {
        var responsePart = visionObject.responses[0].labelAnnotations[i];
        if (reponsePart.description && reponsePart.score)
        {
            tagArray.push({description: reponsePart.description, confidence: reponsePart.score, parents: []});
        }
    }
    return clampConfidence(sanitizeArray(tagArray));
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
        //parent arrays are parsed with an empty object in the array
        if (rekognitionObject.Labels[i].Name && rekognitionObject.Labels[i].Confidence && rekognitionObject.Labels[i].Parents[0].Name)
        {
            var parents = [];
            for (var pIndex = 0; pIndex < rekognitionObject.Labels[i].Parents.length; pIndex++)
            {                
                parents.push({name: rekognitionObject.Labels[i].Parents[pIndex].Name});
            }
            tagArray.push({description: rekognitionObject.Labels[i].Name, confidence: rekognitionObject.Labels[i].Confidence, parents: parents});
        }
        else if (rekognitionObject.Labels[i].Name && rekognitionObject.Labels[i].Confidence)
        {
            tagArray.push({description: rekognitionObject.Labels[i].Name, confidence: rekognitionObject.Labels[i].Confidence, parents: []});
        }
    }
    return clampConfidence(sanitizeArray(tagArray));
}

/**
 * Processes responses from Google Vision and Amazon Rekognition
 * @return array with combined values and confidences
 * @param {array} visionResponse 
 * @param {array} rekognitionResponse 
 */
function processResponses(visionResponse, rekognitionResponse)
{
    var visionObject = handleVisionResponse(visionResponse);
    var rekognitionObject = handleRekognitionResponse(rekognitionResponse);
    var outputObject = [];

    if (typeof visionObject !== 'undefined' && visionObject.length > 0 && typeof rekognitionObject !== 'undefined' && rekognitionObject.length > 0) 
    {
        for (var i = 0; i < visionObject.length; i++)
        {
            var matchingIndex = searchInDescription(rekognitionObject, visionObject[i].description);
            if (matchingIndex >= 0)
            {
                var tempObject = rekognitionObject[matchingIndex];
                rekognitionObject.splice[matchingIndex,1]; //doesn't take Vision parents in account
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
        array.confidence*=array.confidence;
    }
    return array;
}
/**
 * Sanitizes the confidence in the tag array and removes values with not valid description. It clamps the confidence values between [0, 1].
 * @return array map with the description and confidence
 * @param {array} array 
 */
function clampConfidence(array) 
{
    for (var i = 0; i < array.length; i++)
    {
        if (isNaN(parseFloat(array[i].value)))
        {
            array.splice(i, 1);
        }
        else
        {
            array[i].confidence = Math.min(Math.max(parseFloat(array[i].value), 0), 1);
        }
    }
    return array;
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

/**
 * Sanitation method for a single string
 * @param {string} text 
 */
function sanitizeString(text)
{
    return text.replace("/[/\\<>|,.;:%{}()\[\]#\'\"&?~*+\-_!@`´^]/gi", "").replace("\(^[\s\n\r\t\x0B]+)|([\s\n\r\t\x0B]+$)/g", "");
}


/**
 * Has to run after XMP was initialized.
 * @param {object} xmp 
 * @param {array} responseObject 
 * @param {float} confidence 
 */
function writeTags(xmp, responseObject, confidence)
{
    var existingTags = readTags(xmp);
    responseObject = deleteByConfidence(responseObject, confidence);
    var respondTags = responseTags(responseObject);

    respondTags.subjects = stripArray(respondTags.subjects, existingTags.subjects);
    respondTags.hierarchy = stripArray(respondTags.hierarchy, existingTags.hierarchy);

    for (var i = 0; i < respondTags.subjects.length; i++)
    {
        xmp.appendArrayItem(XMPConst.NS_DC, "subject", respondTags.subjects[i], 0, XMPConst.ARRAY_IS_ORDERED);
    }
    for (i = 0; i < respondTags.hierarchy.length; i++)
    {
        xmp.appendArrayItem("http://ns.adobe.com/lightroom/1.0/", "hierarchicalSubject", respondTags.hierarchy[i], 0, XMPConst.ARRAY_IS_ORDERED); 
    }
    return true;
}

/**
 * Compares two array and removes duplicates from the target array.
 * @return array with strings
 * @param {array} target 
 * @param {array} decider 
 */
function stripArray(target, decider)
{
    for (var i = 0; i < target.length; i++)
    {
        if (searchInArray(decider, target[i]))
        {
            target.splice(i--,1);
        }
    }
    return target;
}

/**
 * Creates the same structure for the tag reponse as is written in XMP
 * @return Object containing a subject and hierarchy array
 * @param {array} responseObject 
 */
function responseTags(responseObject)
{
    var subjects = [];
    var hierarchy = [];

    for (var i = 0; i < responseObject.length; i++)
    {
        subjects.push(responseObject[i].description);
        if (responseObject[i].parents)
        {
            for (var pIndex = 0; pIndex < responseObject[i].parents.length; i++)
            {
                hierarchy.push(responseObject[i].parents[pIndex] + "|" + responseObject[i].description);
                if (!searchInArray(subjects, responseObject[i].parents[pIndex]))
                {
                    subjects.push(responseObject[i].parents[pIndex]);
                }
            }
        }
        else
        {
            hierarchy.push(responseObject[i].description);
        }
    }
    return {subjects: subjects, hierarchy: hierarchy};
}
/**
 * Deletes all objects in the array that have a lower ocnfidence then the threshold.
 * @return object containing the responses
 * @param {array} responseObject 
 * @param {float} confidence 
 */
function deleteByConfidence(responseObject, confidence)
{
    for (var i = 0; i < responseObject.length; i++)
    {
        if (responseObject[i].confidence < i)
        {
            responseObject.splice[i,1];
        }
    }
    return responseObject;
}

/**
  * Reads the existing tags in the XMP Metadata
 * @return Object containing a subject and hierarchy array
 * @param {Object} xmp 
 */
function readTags(xmp)
{
    var subjects = [];
    var hierarchy = [];
    
    for (var i = 1; i <= xmp.countArrayItems(XMPConst.NS_DC, "subject"); i++) 
    {
        subjects.push(xmp.getArrayItem(XMPConst.NS_DC, "subject", i));
    }
    for (var i = 1; i <= xmp.countArrayItems("http://ns.adobe.com/lightroom/1.0/", "hierarchicalSubject"); i++) 
    {
        hierarchy.push(xmp.getArrayItem("http://ns.adobe.com/lightroom/1.0/", "hierarchicalSubject", i));
    }
    return {subjects: subjects, hierarchy: hierarchy};
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
 * Checks if the value is contained in the description in the array
 * @return int position in the array
 * @param {array} array 
 * @param {string} value 
 */
function searchInDescription(array, value) 
{
    for (var i = 0; i < array.length; i++) 
    {
        if (array[i].description === value) 
        {
            return i;
        }
    }
    return -1;
}
/**
  Determines whether snippet can be run given current context.  The snippet 
  fails if these preconditions are not met:
  <ul>
  <li> Must be running in Bridge
  <li> A selection must be made in the Content pane of Bridge 
  </ul>

  @return True is this snippet can run, false otherwise
  @type boolean
*/
ModifyTags.prototype.canRun = function()
 {
	// Must be running in Bridge & have a selection
	if( (BridgeTalk.appName == "bridge") && (app.document.selectionLength == 1)) {
		return true;
	}

	// Fail if these preconditions are not met.  
	// Bridge must be running,
	// There must be a selection.
	$.writeln("ERROR:: Cannot run ModifyTags");
	$.writeln(this.requiredContext);
	return false;
}

/**
 "main program": construct an anonymous instance and run it
  as long as we are not unit-testing this snippet.
*/
if(typeof(ModifyTags_unitTest ) == "undefined") {
	new ModifyTags().run();
}
