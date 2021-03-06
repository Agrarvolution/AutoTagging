﻿"use strict";

#include "js/libs/json2.js"

function AddSelectionListener()
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
AddSelectionListener.prototype.run = function()
{
    var test = app;
    if(!this.canRun())
	{
		return false;
    }

	$.writeln("About to run AddSelectionListener");

	// Get the selected file
    app.eventHandlers.push( {handler: autoTaggingCustomEventHandler} );
    return true;
};

autoTaggingCustomEventHandler = function(event)
{
    if ( event.object instanceof Document && event.type === 'selectionsChanged') {
        if (app.document.selectionLength > 0)
        {
            //adds library
            $.writeln("Init xLib");
            var xLib;
            try {
                xLib = new ExternalObject("lib:\PlugPlugExternalObject");
            } catch(e) { alert("Missing ExternalObject: "+e); }
            //throw update event
            $.writeln("About to throw event");
            if (xLib)
            {
                throwEvent();
            }
        }

    }
};

throwEvent = function()
{
    var imagePath = "C:/AutoTagging/tempImage.jpg";
    var imagePath2 = "C:/AutoTagging/tempImage2.jpg";

    var currentPreviewFile = app.document.selections[0].core.preview.preview;
    currentPreviewFile.exportTo (imagePath, 100);

    var eventObj = new CSXSEvent();
    eventObj.type = "updateAutoTagInspector";
    
    //var jpegStream = currentPreviewFile.loadFromJpegStream(imagePath2, 10);
    
    eventObj.data = JSON.stringify({ "description": "Is it working?" });
    eventObj.dispatch();

    return true;
};

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
AddSelectionListener.prototype.canRun = function()
 {
    // Must be running in Bridge & have a selection

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
	new AddSelectionListener().run();
}