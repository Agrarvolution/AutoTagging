"use strict";

#include "js/libs/json2.js"  

function SendMetaDataSelection()
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
SendMetaDataSelection.prototype.run = function()
{
    var test = app;
    if(!this.canRun())
	{
		return false;
    }

    /// Load the XMP Script library
	if( xmpLib === undefined )
	{
		if( Folder.fs === "Windows" )
		{
			var pathToLib = Folder.startup.fsName + "/AdobeXMPScript.dll";
		} 
		else 
		{
			pathToLib = Folder.startup.fsName + "/AdobeXMPScript.framework";
		}
	
		var libfile = new File( pathToLib );
		var xmpLib = new ExternalObject("lib:" + pathToLib );
	}

	$.writeln("About to run AddSelectionListener");
	
	// Get the selected file
    app.eventHandlers.push( {handler: createSelectionHandler} );
    return true;
};

function createSelectionHandler(event)
{
    if ( event.object instanceof Document && event.type === 'selectionsChanged') {
        if (app.document.selectionLength > 0)
        {
            var thumb = app.document.selections[0];
            if(thumb.hasMetadata)
            {
                $.writeln("Thumb has meta data");
                // Get the metadata object - wait for  valid values
                var md = thumb.synchronousMetadata;

                // Get the XMP packet as a string and create the XMPMeta object
                var xmp = new XMPMeta(md.serialize());

                // Change the date modified
                var d = new XMPDateTime(new Date());
                d.convertToLocalTime();
                xmp.setProperty(XMPConst.NS_XMP, "ModifyDate", d, XMPConst.XMPDATE);

                XMPMeta.registerNamespace("http://ns.adobe.autotaggingJSON/", "atdata:");
                var tagList = xmp.getProperty("http://ns.adobe.autotaggingJSON/", "labelListJSON", XMPConst.STRING);
                var historyList = xmp.getProperty("http://ns.adobe.autotaggingJSON/", "historyListJSON", XMPConst.STRING);
                
                if (tagList !== undefined && tagList != null)
                {
                    //$.writeln(tagList);
                    tagList = JSON.parse(tagList);

                    var response = [];
                    //reverse child to parents relationship to parent to children
                    for (var i = 0; i < tagList.length; i++)
                    {
                        var parentIndices = [];

                        //insert parents
                        for (var pi = 0; pi < tagList[i].parents.length; pi++)
                        {
                            var index = -1;
                            var name = tagList[i].parents[pi].description;
                            if (name === undefined)
                            {
                                name = tagList[i].parents[pi].name;
                            }
                            index = findInHierarchy(response, name);
                            if (index < 0)
                            {
                                response.push({
                                    name: name,
                                    confidence: 1.0,
                                    children: [],
                                    ticked: false
                                });
                                parentIndices.push(response.length-1);
                            }
                            else
                            {
                                parentIndices.push(index);
                            }
                        }
                        //setup child
                        var child = {
                            name: tagList[i].description,
                            confidence: tagList[i].confidence,
                            children: [],
                            ticked: false
                        };
                        for (pi = 0; pi < parentIndices.length; pi++)
                        {
                            if (findInHierarchy(response[parentIndices[pi]], tagList[i].description) < 0)
                            {
                                //set parent reference
                                response[parentIndices[pi]].children.push(child);
                            }
                        }
                        if (parentIndices.length === 0)
                        {
                            response.push(child);
                        }
                    }
                }
                var subjects = [];
                var hierarchy = [];
                for (i = 1; i <= xmp.countArrayItems(XMPConst.NS_DC, "subject"); i++)
                {
                    subjects.push(xmp.getArrayItem(XMPConst.NS_DC, "subject", i));
                }
                XMPMeta.registerNamespace("http://ns.adobe.com/lightroom/1.0/", "lr:");
                for (i = 1; i <= xmp.countArrayItems("http://ns.adobe.com/lightroom/1.0/", "hierarchicalSubject"); i++)
                {
                    hierarchy.push(xmp.getArrayItem("http://ns.adobe.com/lightroom/1.0/", "hierarchicalSubject", i));
                }
                $.writeln("Retrieved tags");
                //get hierarchical object
                var nodeHierarchy = [];
                for (i = 0; i < hierarchy.length; i++) {
                    var writtenTags = [];
                    var indices = [];

                    var hierarchyText = hierarchy[i].toString();

                    //delete empty strings (in case of wrong insertion into XMP -> |value| instead of value|value|value)
                    hierarchyText = hierarchyText.replace("/^\\s+|\\s+$/g", "").replace("[ ]{2,}", " ").replace("/^\||\|$/", "");
                    //find division
                    for (var charPosition = 0; charPosition < hierarchyText.length; charPosition++) {
                        if (hierarchyText.charAt(charPosition) === "|") {
                            indices.push(charPosition);
                        }
                    }
                    //extract text
                    var currentIndex = 0, lastIndex = 0;
                    for (charPosition = 0; charPosition <= indices.length; charPosition++) {
                        if (charPosition < indices.length) {
                            currentIndex = indices[charPosition];
                        } else {
                            currentIndex = hierarchyText.length;
                        }
                        writtenTags.push(hierarchyText.substr(lastIndex, currentIndex - lastIndex));

                        lastIndex = currentIndex + 1;
                    }

                    //insert into node tree
                    var tempHierarchy = nodeHierarchy;
                    for (var tagIndex = 0; tagIndex < writtenTags.length; tagIndex++) {
                        //handle parent -> exclude from loop cause always there?
                        index = findInHierarchy(tempHierarchy, writtenTags[tagIndex]);
                        if (index < 0) {
                            tempHierarchy.push({
                                name: writtenTags[tagIndex],
                                confidence: 1.0,
                                children: [],
                                ticked: false
                            });
                            tempHierarchy = tempHierarchy[tempHierarchy.length - 1].children;
                        } else {
                            tempHierarchy = tempHierarchy[index].children;
                        }
                    }
                }
                //check ticks
                depthSearchTick(nodeHierarchy,subjects);

                if(response !== undefined && historyList !== undefined && historyList != null)
                {
                    historyList = JSON.parse(historyList);
                    //combine written tags and reponse tags -> could be made into a depth/breadth traverse method
                    for (i = 0; i < response.length; i++)
                    {
                        index = findInHierarchy(nodeHierarchy, response[i].name);
                        if (index > 0)
                        {
                            nodeHierarchy[index].confidence = response[i].confidence;
                            for (var ci = 0; ci < response[i].children; ci++)
                            {
                                var cIndex = findInHierarchy(nodeHierarchy[index].children, response[i].children[ci].name);
                                if (cIndex > 0)
                                {
                                    nodeHierarchy[index].children[cIndex].confidence = response[i].children[ci].confidence;
                                }
                                else
                                {
                                    //add if non existent
                                    var histIndex = findInHistory(historyList, response[i].children[ci]);
                                    if (histIndex < 0 || (histIndex >= 0 && historyList[histIndex].property !== "terminate"))
                                    {
                                        nodeHierarchy[index].children.push(response[i].children[ci]);
                                    }
                                }
                            }
                        }
                        else
                        {
                            //add if non existent
                            //check if terminated
                            var histIndex = findInHistory(historyList, response[i]);
                            if (histIndex < 0 || (histIndex >= 0 && historyList[histIndex].property !== "terminate"))
                            {
                                nodeHierarchy.push(response[i]);
                            }
                            //@Todo handle children
                        }
                    }
                }

                //$.writeln("Combined tags & response");
                sortArrayOutput(nodeHierarchy);

                $.writeln("Init xLib");
                var xLib;
                try {
                    xLib = new ExternalObject("lib:\PlugPlugExternalObject");
                } catch(e) { alert("Missing ExternalObject: "+e); }
                //throw update event
                $.writeln("About to throw event");
                if (xLib) {
                    var eventObj = new CSXSEvent();
                    eventObj.type = "updateAutoTagInspector";
                    eventObj.data = JSON.stringify({response: tagList, content: nodeHierarchy, history: "", thumb: true});
                    eventObj.dispatch();
                }
            }
            else
            {
                var xLib;
                try {
                    xLib = new ExternalObject("lib:\PlugPlugExternalObject");
                } catch(e) { alert("Missing ExternalObject: "+e); }
                //throw update event
                $.writeln("About to throw event");
                if (xLib) {
                    var eventObj = new CSXSEvent();
                    eventObj.type = "updateAutoTagInspector";
                    eventObj.data = JSON.stringify({response: "", content: "", history: "", thumb: false});
                    eventObj.dispatch();
                }
            }
        }

    }
}

/**
 * Traverses item tree to tick all items.
 * @param {*} inputTree 
 * @param {array} searchArray 
 */
function depthSearchTick(inputTree, searchArray)
{
    var traverseStack = [];
    traverseStack.push(inputTree);
    while (traverseStack.length !== 0)
    {
        var array = traverseStack.pop();
        for (var i = 0; i < array.length; i++)
        {
            array[i].ticked = isTicked(array[i], searchArray);
            traverseStack.push(array[i].children);
        }
    }
}
/**
 * Searches through searchArray if name exists
 * @param {Item} item 
 * @param {array} searchArray 
 * @return true if item exists (is ticked), false if it doesn't
 */
function isTicked(item, searchArray)
{
    for (var i = 0; i < searchArray.length; i++)
    {
        if (searchArray[i].toString().toLowerCase() === item.name.toLowerCase())
        {
            return true;
        }
    }
    return false;
}

/**
 * traverse through object tree to sort all child nodes
 * @param {array} outPutArray 
 */
function sortArrayOutput (outPutArray)
{
    var traverseStack = [];
    traverseStack.push(outPutArray);
    while (traverseStack.length !== 0)
    {
        var array = traverseStack.pop();
        sortOutput(array);
        for (var i = 0; i < array.length; i++)
        {
            traverseStack.push(array[i].children);
        }
    }
}

/**
 * Sort item array by descending confidence and by ascending name
 * @param {array} outputObj 
 */
function sortOutput (outputObj)
{
    outputObj.sort(function(a, b) {
        return a.name.toLowerCase() === b.name.toLowerCase() ?
            (a.confidence === b.confidence ? 0 : (a.confidence < b.confidence ? 1 : -1))
            : (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1);
    });
}

/**
 * @param {array} array
 * @param {string} targetString search target
 * @return index if string exists, -1 if it doesn't
 */
function findInHierarchy (array, targetString)
{
    if (array[0])
    {
        for (var i = 0; i < array.length; i++) 
        {
            if (array[i].name.toLowerCase() === targetString.toLowerCase()) 
            {
                return i;
            }
        }
    }
	return -1;
}

function findInHistory (history, nodeObject)
{
    for (var i = 0; i < history.length; i++)
    {
        if (history[i].name.toLowerCase() === nodeObject.name.toLowerCase())
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
SendMetaDataSelection.prototype.canRun = function()
 {
    // Must be running in Bridge & have a selection
	$.writeln(BridgeTalk.appName);
    
	if( (BridgeTalk.appName === "bridge")) {
		return true;
	}

	// Fail if these preconditions are not met.  
	// Bridge must be running,
	// There must be a selection.
	$.writeln("ERROR:: Cannot run AddSelectionListener");
	$.writeln(this.requiredContext);
	return false;
};

/**
 "main program": construct an anonymous instance and run it
  as long as we are not unit-testing this snippet.
*/
if(typeof(SaveMetaData_unitTest ) == "undefined") {
	new SendMetaDataSelection().run();
}