"use strict";
#include "js/libs/json2.js"

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
AutoTaggingCustomBridgeEvents.prototype.run = function()
{
    if(!this.canRun())
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

function autoTaggingCustomEventHandler(event)
{
    if ( event.object instanceof Document && event.type === 'selectionsChanged') {
        $.writeln("Init xLib");
        var xLib;
        try {
            xLib = new ExternalObject("lib:\PlugPlugExternalObject");
        } catch(e) { alert("Missing ExternalObject: "+e); }

        //throw update event
        $.writeln("About to throw selection change event");
        if (xLib) {
            var eventObj = new CSXSEvent();
            eventObj.type = "updateAutoTagInspector";
            eventObj.data = JSON.stringify({type: 'selectionsChanged'});
            eventObj.dispatch();
        }

        if (app.document.selections[0] && app.document.selections[0].hasMetadata)
        {
            $.writeln("Register thumb message");
            app.document.selections[0].registerInterest(function (thumb, message) {
                $.writeln("About to throw metadata update event");
                if (xLib && message === 'metadata') {
                    var eventObj = new CSXSEvent();
                    eventObj.type = "updateAutoTagInspector";
                    eventObj.data = JSON.stringify({type: 'metadataChanged'});
                    eventObj.dispatch();
            }});
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
AutoTaggingCustomBridgeEvents.prototype.canRun = function()
{
    // Must be running in Bridge & have a selection
    $.writeln(BridgeTalk.appName);

    if( (BridgeTalk.appName === "bridge")) {
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
if(typeof(SaveMetaData_unitTest ) == "undefined") {
    new AutoTaggingCustomBridgeEvents().run();
}