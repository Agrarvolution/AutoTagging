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
	
	var retval = true;
	if(!this.canRun())
	{
		retval = false;	
		return retval;
	}
	this.paletteRefs = new Array();
	var wrapper = this;
	// Create and add the TabbedPalette object and its contents. 
	function addScriptPalette(doc)
	{
		// Create the TabbedPalette object, of type "script"
		var scriptPalette = new TabbedPalette( doc, "SnpCreateTabbedPaletteScriptUI", "SnpSUIPalette", "script" );
		wrapper.paletteRefs.push(scriptPalette);	
		// Create a ScriptUI panel to be displayed as the tab contents.
		var tbPanel = scriptPalette.content.add('panel', [25,15,255,130], 'The Panel');

		// Add the UI components to the ScriptUI panel
		tbPanel.txtFieldLbl = tbPanel.add('statictext', [15,15,105,35], 'Times Clicked:');
		tbPanel.txtField = tbPanel.add('edittext', [115,15,215,35], '0');
		tbPanel.addBtn = tbPanel.add('button', [15,65,105,85], 'Add');
		tbPanel.subBtn = tbPanel.add('button', [120, 65, 210, 85], "Sub");

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
	}

    try
    {
        app.document.setWorkspace("keywords");
    }
    catch (e)
    {
        $writeln(e);
    }
	
	if (app.document.workspace.id === "keywords")
	{

	}
    var test = app.document;
    var palettes = app.document.palettes;
    var contentPane = app.document.palettes[1];
    var contentPanecontent = app.document.palettes[1].content;
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

