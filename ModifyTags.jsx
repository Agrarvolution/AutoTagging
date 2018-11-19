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
		var lrNamespace = "http://ns.adobe.com/lightroom/1.0/";
		var lrPrefix = "lr:";
		XMPMeta.registerNamespace(lrNamespace, lrPrefix);
		
        var subjectCount = xmp.countArrayItems(XMPConst.NS_DC, "subject");
        var hierarchyCount = xmp.countArrayItems(lrNamespace, "hierarchicalSubject");
        var subjects = [];
        var hierarchy = [];
        
        for (var i = 1; i <= subjectCount; i++) 
        {
            subjects[i] = xmp.getArrayItem(XMPConst.NS_DC, "subject", i);
        }
        for (var i = 1; i <= hierarchyCount; i++) 
        {
            hierarchy[i] = xmp.getArrayItem(lrNamespace, "hierarchicalSubject", i);
        }
                    
        var JSONtags = '{{"Landschaft":[{"Wald":["Laubwald"]},{"Landschaftsobjekte":["Brücke","Bach","Schild"]}],"Personen":["Kind","Lukas"]}';
    
    //string eingabe geht nicht über mehrere Zeilen
        var rekognitionResponse = '{"LabelModelVersion":"V1","Labels":[{"Confidence":"0.98","Instances":[{"BoundingBox":{"Height":"0","Left":"0","Top":"0","Width":"0"},"Confidence":"0.95"}],"Name":"Laubwald","Parents":[{"Name":"Landschaft"}]},{"Confidence":"0.90","Instances":[{"BoundingBox":{"Height":"0","Left":"0","Top":"0","Width":"0"},"Confidence":"0.95"}],"Name":"Brücke","Parents":[{"Name":"Bauwerke"}]},{"Confidence":"0.91","Instances":[{"BoundingBox":{"Height":"0","Left":"0","Top":"0","Width":"0"},"Confidence":"0.95"}],"Name":"Gesicht","Parents":[{}]}],"OrientationCorrection":"???"}';
        try {
            var tags = JSON.parse(rekognitionResponse);
        } catch (e) {
            $.writeln(e);
        }
        var appendedText;
        
        if (tags.Labels) //checks if there are even any labels
        {
            for (var labelIndex = 0; labelIndex < tags.Labels.length; labelIndex++) 
            {
                if (!searchInArray(subjects,tags.Labels[labelIndex].Name)) //checks to avoid double entries
                {
                    xmp.appendArrayItem(XMPConst.NS_DC, "subject", tags.Labels[labelIndex].Name, 0, XMPConst.ARRAY_IS_ORDERED);
                }
                $.writeln(tags.Labels[labelIndex].Name);
                for (var parentIndex = 0; parentIndex < tags.Labels[labelIndex].Parents.length; parentIndex++) 
                {
                    if(tags.Labels[labelIndex].Parents[parentIndex].Name) 
                    {
                        $.writeln(tags.Labels[labelIndex].Parents[parentIndex].Name );
                        if (!searchInArray(subjects, tags.Labels[labelIndex].Parents[parentIndex].Name))
                        {                        
                            xmp.appendArrayItem(XMPConst.NS_DC, "subject", tags.Labels[labelIndex].Parents[parentIndex].Name, 0, XMPConst.ARRAY_IS_ORDERED);
                        }
                        appendedText = tags.Labels[labelIndex].Parents[parentIndex].Name + "|" +  tags.Labels[labelIndex].Name;
                        if (!searchInArray(hierarchy,appendedText))
                        {
                            xmp.appendArrayItem(lrNamespace, "hierarchicalSubject", appendedText, 0, XMPConst.ARRAY_IS_ORDERED);
                        }
                    } 
                    else 
                    {
                        if (!searchInArray(hierarchy,tags.Labels[labelIndex].Name))
                        {
                            xmp.appendArrayItem(lrNamespace, "hierarchicalSubject", tags.Labels[labelIndex].Name, 0, XMPConst.ARRAY_IS_ORDERED); 
                        }              
                    }
                }    
            }
        }
        $.writeln(tags);
        
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
    check if array contains value
    because indexOf doesn't work
    */
function searchInArray(array, value) 
{
    for (var i = 1; i < array.length; i++) 
    {
        if (array[i].value == value) 
        {
            return true;
        }
    }
    return false;
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
