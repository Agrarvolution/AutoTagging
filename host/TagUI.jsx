#include "js/libs/json2.js"  
////////////////////////////////////////////////////////////////////////////
// ADOBE SYSTEMS INCORPORATED
// Copyright 2008-2017 Adobe Systems Incorporated
// All Rights Reserved
//
// NOTICE:  Adobe permits you to use, modify, and distribute this file in accordance with the
// terms of the Adobe license agreement accompanying it.  If you have received this file from a
// source other than Adobe, then your use, modification, or distribution of it requires the prior
// written permission of Adobe.
/////////////////////////////////////////////////////////////////////////////

/** 
 @fileoverview Shows how to create a TabbedPalette in Bridge with ScriptUI components.
 @class Shows how to create a TabbedPalette in Bridge with ScriptUI components.
 
 <h4>Usage</h4>
 
<ol>
<li>    Run the snippet in the ExtendScript Toolkit (see Readme.txt), with Bridge CC 2018 as the target.
<li>You should find that a tabbed palette has been added to the Bridge browser window.
</ol>
 
 <h4>Description</h4>
 
 <p>Adds a script-defined tabbed palette to the Bridge browser window.  

 <p>The palette is of the "script" type, and contains ScriptUI components,
 text fields and buttons. The buttons have event handlers that 
 change the values in the text fields.

 <p>The new palette appears in the default upper-left position in the browser. It can be 
  dragged to other positions. <br />
  
 @see SnpCreateWebTabbedPalette

 @constructor Constructor.
 */ 
function SnpCreateTabbedPaletteScriptUI()
{
	/**
	 The context in which this snippet can run.
	 @type String
	*/
	this.requiredContext = "\tExecute against Bridge main engine.\nBridge must not be running";
	$.level = 1; // Debugging level
	this.paletteRefs = null;
}


/**
 Functional part of this snippet.  
 
 Creates the TabbedPalette object, defining the content with 
 ScriptUI components, and adds the palette to all open Bridge browser windows.
	@return True if the snippet ran as expected, false otherwise.  
	@type Boolean
*/
SnpCreateTabbedPaletteScriptUI.prototype.run = function()
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

	

	updateKeywordHandler = function( event ) {  
		if ( event.object instanceof Document && event.type == 'selectionsChanged') {  
			if (app.document.selectionLength > 0)
            {
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
						$.writeln(tagList);
						tagList = JSON.parse(tagList);
					}

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

					var nodeHierarchy = [];
					for (i = 0; i < hierarchy; i++) 
					{
						var writtenTags = [];
						var indeces = [];
						hierarchy[i] = hierarchy[i].value.trim();

						//find division
						for (var charPosition = 0; charPosition < hierarchy[i]; charPosition++)
						{
							if (hierarchy[i].value.charAt(charPosition) === "|")
							{
								indices.push(charPosition);
							}			
						}
						//extract text
						for (charPosition = 0; index < indeces.length; charPosition++) 
						{
							if (charPosition === 0)
							{
								writtenTags.push(hierarchy[i].value.substr(0, indeces[charPosition].value-1))
							}
							else if (charPosition === indeces.length-1)
							{
								writtenTags.push(hierarchy[i].value.substr(indeces[charPosition-1].value, indeces.length-1))
							}
							else 
							{
								writtenTags.push(hierarchy[i].value.substr(indeces[charPosition-1].value, indeces[charPosition].value))
							}
						}
						//delete empty strings (in case of wrong insertion into XMP -> |value| instead of value|value|value)
						if (writtenTags[0].value === "")
						{
							writtenTags.splice(0,1);
						}
						if (writtenTags[writtenTags.length-1].value === "")
						{
							writtenTags.splice(writtenTags.length-1,1);
						}
						//insert into node tree
						for (var tagIndex = 0; tagIndex < writtenTags.length; tagIndex++)
						{
							var index = findInHierarchy(nodeHierarchy, writtenTags[i].value);
							if (index < 0)
							{
								nodeHierarchy.push({
									name = writtenTags[i].value,
									confidence = 1.0,
									children = []
								})
							}
						}
					}

				}
			}
            
            
            
            
			return { handled:true };
		} 
	}  
	app.eventHandlers.push( {handler: updateKeywordHandler} ); 


	var retval = true;
	if(!this.canRun())
	{
		retval = false;	
		return retval;
	}
	this.paletteRefs = new Array();
	var wrapper = this;
	// Create and add the TabbedPalette object and its contents. 
	/** @To-Do
	 * Update method (onResize)
	 * Layouting - multiple Colums, single Column, scrolling
	 * Rendering Method
	 * + Reordering of Items of deletion
	 * Parenting array, ordering (by user input or confidence)
	 * Enable new Userinputs (add new item) -> complete deletion of existing item
	 * Checksboxes + userinput hanlding (onClick)
	 * 
	 */

	 // TODO
	
	function addScriptPalette(doc)
	{
		// Create the TabbedPalette object, of type "script"
		var scriptPalette = new TabbedPalette( doc, "SnpCreateTabbedPaletteScriptUI", "SnpSUIPalette", "script", 2, "middle");
		//wrapper.paletteRefs.push(scriptPalette);	
		
		// Create a ScriptUI panel to be displayed as the tab contents.
		var tbPanel = scriptPalette.content.add('panel', [25,15,255,130], 'The Panel');

		// Add the UI components to the ScriptUI panel
		tbPanel.txtFieldLbl = tbPanel.add('statictext', [15,15,105,35], 'Times Clicked:');
		tbPanel.txtField = tbPanel.add('edittext', [115,15,215,35], '0');
		tbPanel.addBtn = tbPanel.add('button', [15,65,105,85], 'Add');
		tbPanel.subBtn = tbPanel.add('button', [120, 65, 210, 85], "Sub");

		tbPanel.panel = tbPanel.add('scrollbar', [25, 95, 255, 150], "Scrollbar");

		var scrollGroup = scriptPalette.content.add ('group');
		for (var i = 0; i <= 35; i++) {
			scrollGroup.add ('statictext', undefined, 'Label ' + i);
		}
		var scrollBar = scriptPalette.content.add ('scrollbar');
		// Move the whole scroll group up or down
		scrollBar.onChanging = function () {
			scrollGroup.location.y = -1 * this.value;
		}
		
		// Define event listeners that implement behavior for the UI components
		tbPanel.addBtn.onClick = function()
		{
			var txt = tbPanel.txtField;
			txt.text = parseInt(txt.text) + 1;
		}
		
		tbPanel.subBtn.onClick = function()
		{
			var txt = tbPanel.txtField;
			txt.text = parseInt(txt.text) - 1;
		}

		$.writeln("Current size: " + scriptPalette.content.size.width + " x " + scriptPalette.content.size.height);
        
        var size = scriptPalette.content.size;
		scriptPalette.content.onResize = function (event)
		{
			$.writeln("Current size: " + scriptPalette.content.size.width + " x " + scriptPalette.content.size.height);
		}
	}

	var preferences = app.preferences;
	//addScriptPalette(app.document);
	// Add the palette to all open Bridge browser windows
	/*for(var i = 0;i < app.documents.length;i++)
	{
		addScriptPalette(app.documents[i]);
	}*/


	return retval;

}

/**
  Determines whether snippet can be run given current context.  The snippet 
  fails if these preconditions are not met:
  <ul>
  <li> Must be running in Bridge
  </ul>
 
  @return True is this snippet can run, false otherwise
  @type boolean
*/
SnpCreateTabbedPaletteScriptUI.prototype.canRun = function()
{	
	
	// Must run in Bridge 
	if(BridgeTalk.appName == "bridge") 
	{
		return true;		
	}
	
	// Fail if these preconditions are not met.  
	// Bridge must be running,
	$.writeln("ERROR:: Cannot run SnpCreateTabbedPaletteScriptUI");
	$.writeln(this.requiredContext);
	return false;
	
}

/**
 "main program": construct an anonymous instance and run it
  as long as we are not unit-testing this snippet.
*/
if(typeof(SnpCreateTabbedPaletteScriptUI_unitTest) == "undefined") {
    new SnpCreateTabbedPaletteScriptUI().run();
}


function findInHierarchy (array, targetString)
{
	for (var i = 0; i < array.length; i++) 
	{
		if (array[i].name === targetString) 
		{
			return i;
		}
	}
	return -1;
}