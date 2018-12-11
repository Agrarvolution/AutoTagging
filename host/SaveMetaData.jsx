"use strict"

#include "js/libs/json2.js"  

function SaveMetaData() 
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
SaveMetaData.prototype.run = function() 
{
    if(!this.canRun())
	{
		return false;
    }

    /// Load the XMP Script library
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

	$.writeln("About to run SaveMetaData");
	
	// Get the selected file
    var thumb = app.document.selections[0];
    if(thumb.hasMetadata)
    {
        // Get the metadata object - wait for  valid values
        var md = thumb.synchronousMetadata;
        
        // Get the XMP packet as a string and create the XMPMeta object
        var xmp = new XMPMeta(md.serialize());
        
        // Change the creator tool
        xmp.setProperty(XMPConst.NS_XMP, "CreatorTool", "Changed by TagUI");
        
        // Change the date modified
        var d = new XMPDateTime(new Date());
        //d.convertToLocalTime();
        xmp.setProperty(XMPConst.NS_XMP, "ModifyDate", d, XMPConst.XMPDATE);

        //XMPMeta.registerNamespace("http://ns.adobe.autotaggingJSON/", "atdata:");
        var tagList = xmp.getProperty("http://ns.adobe.autotaggingJSON/", "labelListJSON", XMPConst.STRING);

        if (tagList)
        {
            //$.writeln(tagList);
            tagList = JSON.parse(tagList);

            var response = [];
            //reverse child to parents relationship to parent to children
            for (var i = 0; i < tagList.length; i++)
            {
                var parentIndices = [];
                for (var pi = 0; pi < tagList[i].parents.length; pi++)
                {
                    var index = -1;
                    var name = tagList[i].parents[pi].description;
                    if (name == undefined)
                    {
                        name = tagList[i].parents[pi].name;
                    }
                    var index = findInHierarchy(response, name);
                    if (index < 0) 
                    {
                        response.push({
                            name: name,
                            confidence: 1.0,
                            children: []
                        });
                        parentIndices.push(response.length-1);
                    }
                    else  
                    {
                        parentIndices.push(index);
                    }
                }
                var child = {
                    name: tagList[i].description,
                    confidence: tagList[i].confidence,
                    children: []
                };
                for (pi = 0; pi < parentIndices.length; pi++)
                {
                    if (findInHierarchy(response[parentIndices[pi]], tagList[i].description) < 0)
                    {
                        response[parentIndices[pi]].children.push(child);
                    }
                }
                if (parentIndices.length === 0)
                {
                    response.push(child);
                }
            }
        }

        //var subjects = [];
        var hierarchy = [];
        /*for (var i = 1; i <= xmp.countArrayItems(XMPConst.NS_DC, "subject"); i++) 
        {
            subjects.push(xmp.getArrayItem(XMPConst.NS_DC, "subject", i));
        }*/
        for (var i = 1; i <= xmp.countArrayItems("http://ns.adobe.com/lightroom/1.0/", "hierarchicalSubject"); i++) 
        {
            hierarchy.push(xmp.getArrayItem("http://ns.adobe.com/lightroom/1.0/", "hierarchicalSubject", i));
        }


        //get hierarchical object
        var nodeHierarchy = [];
        for (i = 0; i < hierarchy.length; i++) 
        {
            var writtenTags = [];
            var indices = [];
            
            var hierarchyText = hierarchy[i].toString();

            //delete empty strings (in case of wrong insertion into XMP -> |value| instead of value|value|value)
            hierarchyText = hierarchyText.replace(" ", "").replace("/^\||\|$/", "");
            //find division
            for (var charPosition = 0; charPosition < hierarchyText.length; charPosition++)
            {
                if (hierarchyText.charAt(charPosition) === "|")
                {
                    indices.push(charPosition);
                }			
            }
            //extract text
            var currentIndex = 0, lastIndex = 0;
            for (var charPosition = 0; charPosition <= indices.length; charPosition++) 
            {
                if (charPosition < indices.length)
                {
                    currentIndex = indices[charPosition];
                }
                else 
                {
                    currentIndex = hierarchyText.length;
                }
                
                $.writeln(hierarchyText.substr(lastIndex, currentIndex-lastIndex));
                    

                writtenTags.push(hierarchyText.substr(lastIndex, currentIndex-lastIndex));
                
                lastIndex = currentIndex+1;
            }

            //insert into node tree
            var tempHierarchy = nodeHierarchy;
            for (var tagIndex = 0; tagIndex < writtenTags.length; tagIndex++)
            {
                    //handle parent -> exclude from loop cause always there?
                $.writeln(writtenTags[tagIndex]);
                var index = findInHierarchy(tempHierarchy, writtenTags[tagIndex]);
                if (index < 0)
                {
                    tempHierarchy.push({
                        name: writtenTags[tagIndex],
                        confidence: 1.0,
                        children: []
                    });
                    tempHierarchy = tempHierarchy[tempHierarchy.length - 1].children;
                }
                else 
                {
                    tempHierarchy = tempHierarchy[index].children;
                }
            }

        }

        sortArrayOutput(response);
        sortArrayOutput(nodeHierarchy);
        var finalOutput = {response: response, saved: nodeHierarchy};

        var folderPath = encodeURI("/jsonTemp");
        var outputFile = new File(folderPath + encodeURI("/output.json")); 

        writeFile(outputFile, JSON.stringify(finalOutput));
            
        $.write("Output JSON created! @" + outputFile);
        
        return true;
    }
}

function sortArrayOutput (outPutArray)
{
    traverseStack = [];
    traverseStack.push(outPutArray);
    while (traverseStack.length != 0)
    {
        var array = traverseStack.pop();
        sortOutput(array);
        for (var i = 0; i < array.length; i++)
        {
            traverseStack.push(array[i].children);
        }
    }
}

function sortOutput (outputObj)
{
    outputObj.sort(function(a, b) {
        return a.confidence == b.confidence ?
            (a.name.toLowerCase() == b.name.toLowerCase() ? 0 : (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1))
            : (a.confidence < b.confidence ? 1: -1);
    });
}

function findInHierarchy (array, targetString)
{
    if (array[0])
    {
        for (var i = 0; i < array.length; i++) 
        {
            if (array[i].name === targetString) 
            {
                return i;
            }
        }
    }
	return -1;
}

function writeFile(fileObj, fileContent, encoding) {  
    encoding = encoding || "utf-8";  
    fileObj = (fileObj instanceof File) ? fileObj : new File(fileObj);  
  
  
    var parentFolder = fileObj.parent;  
    if (!parentFolder.exists && !parentFolder.create())  
        throw new Error("Cannot create file in path " + fileObj.fsName);  
  
  
    fileObj.encoding = encoding;  
    fileObj.open("w");  
    fileObj.write(fileContent);  
    fileObj.close();  
  
  
    return fileObj;  
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
SaveMetaData.prototype.canRun = function()
 {
    // Must be running in Bridge & have a selection
	$.writeln(BridgeTalk.appName);
    
	if( (BridgeTalk.appName == "bridge") && (app.document.selectionLength == 1)) {
		return true;
	}

	// Fail if these preconditions are not met.  
	// Bridge must be running,
	// There must be a selection.
	$.writeln("ERROR:: Cannot run SaveMetaData");
	$.writeln(this.requiredContext);
	return false;
}

/**
 "main program": construct an anonymous instance and run it
  as long as we are not unit-testing this snippet.
*/
if(typeof(SaveMetaData_unitTest ) == "undefined") {
	new SaveMetaData().run();
}