﻿"use strict"
#include "js/libs/json2.js"

var previousThumb, previousThumbInterest;

function AutoTaggingCustomBridgeEvents()
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
AutoTaggingCustomBridgeEvents.prototype.run = function ()
{
    if (!this.canRun())
    {
        return false;
    }


    $.writeln("About to add AutoTaggingCustomBridgeEvents");

    // Get the selected file
    for (var i = 0; i < app.eventHandlers.length; i++)
    {
        if (app.eventHandlers[i].handler.name === 'autoTaggingCustomEventHandler')
        {
            $.writeln('Event already exists.');
        }
    }
    app.eventHandlers.push({handler: autoTaggingCustomEventHandler});
    return true;
};

function labelAll()
{
    var metaDatas = [];

    app.document.selectAll();

    for (var i = 0; i < app.document.selectionLength; i++)
    {
        metaDatas.push(app.document.selections[i].synchronousMetadata);
    }

    app.document.deselectAll();

    //TODO: send all the collected meta data to CEP
}

function autoTaggingCustomEventHandler(event)
{
    if (event.object instanceof Document && event.type === 'selectionsChanged')
    {
        $.writeln("Init xLib");
        var xLib;
        try
        {
            xLib = new ExternalObject("lib:\PlugPlugExternalObject");
        }
        catch (e)
        {
            alert("Missing ExternalObject: " + e);
        }

        //throw update event
        $.writeln("About to throw selection change event");
        if (xLib)
        {
            var imagePath = "C:/AutoTagging/tempImage.jpg";
            
            if (app.document.selectionLength < 1)
            {
                $.writeln("No selection!");

                var eventObj = new CSXSEvent();
                eventObj.type = "updateAutoTagInspector";
                eventObj.data = JSON.stringify({
                    type: 'selectionsChangedButNoSelection',
                    "selectedImage": "",
                });
                eventObj.dispatch();
            } else {
                $.writeln(app.document.selectionLength + " documents selected");
                $.writeln("document type: " + app.document.selections[0].type);
                $.writeln("document type: " + app.document.selections[0].mimeType);
                var currentPreviewFile = app.document.selections[0].core.preview.preview;
                currentPreviewFile.exportTo(imagePath, 100);
                
                /*
                var thumb = app.document.selections[0];
                var md = thumb.synchronousMetadata;
                md.serialize();
                */

                var eventObj = new CSXSEvent();
                eventObj.type = "updateAutoTagInspector";
                eventObj.data = JSON.stringify({
                    type: 'selectionsChanged',
                    "selectedImage": app.document.selections[0].path,
                    "selectionType" : app.document.selections[0].type,
                    "fileType" : app.document.selections[0].mimeType
                });
                eventObj.dispatch();

                var eventObjSelection = new CSXSEvent();
                eventObjSelection.type = "AutoTaggingSelectionChanged";
                eventObjSelection.data = JSON.stringify({
                    "selectedImage": app.document.selections[0].path,
                    "selectionType": app.document.selections[0].type,
                    "fileType": app.document.selections[0].mimeType
                });
                eventObjSelection.dispatch();
            }
        }
    
        if (app.document.selectionLength > 0)
        {
            if (app.document.selections[0] && app.document.selections[0].hasMetadata && app.document.selections[0] !== previousThumb)
            {
                if (previousThumbInterest !== undefined && previousThumbInterest != null && previousThumb !== undefined && previousThumb != null)
                {
                    previousThumb.unregisterInterest(previousThumbInterest);
                }

                previousThumb = app.document.selections[0];
                previousThumbInterest = function (thumb, message)
                {
                    $.writeln('Thumb interest ' + message);
                    if (xLib && message === 'metadata')
                    {
                        var eventObj = new CSXSEvent();
                        eventObj.type = "updateAutoTagInspector";
                        eventObj.data = JSON.stringify({type: 'metadataChanged'});
                        eventObj.dispatch();
                    }
                };
                $.writeln("Register thumb message");
                app.document.selections[0].registerInterest(previousThumbInterest);
            }
        }
    }
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
AutoTaggingCustomBridgeEvents.prototype.canRun = function ()
{
    // Must be running in Bridge & have a selection
    $.writeln(BridgeTalk.appName);

    if ((BridgeTalk.appName === "bridge"))
    {
        return true;
    }

    // Fail if these preconditions are not met.
    // Bridge must be running,
    // There must be a selection.
    $.writeln("ERROR:: Cannot run AutoTaggingCustomBridgeEvents");
    $.writeln(this.requiredContext);
    return false;
};

/**
 "main program": construct an anonymous instance and run it
 as long as we are not unit-testing this snippet.
 */
if (typeof(SaveMetaData_unitTest ) == "undefined")
{
    new AutoTaggingCustomBridgeEvents().run();
}