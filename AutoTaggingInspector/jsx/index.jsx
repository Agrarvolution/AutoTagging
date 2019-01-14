function writeSelectionChange(nodes, parents, add)
{

    // Get the selected file
    var thumb = app.document.selections[0];

    if(thumb.hasMetadata && nodes.length && parents.length) {
        // Get the metadata object - wait for  valid values
        var md = thumb.synchronousMetadata;

        // Get the XMP packet as a string and create the XMPMeta object
        var xmp = new XMPMeta(md.serialize());

        // Change the creator tool
        xmp.setProperty(XMPConst.NS_XMP, "CreatorTool", "Changed by AutoTaggingGUI");

        // Change the date modified
        var d = new XMPDateTime(new Date());
        d.convertToLocalTime();
        xmp.setProperty(XMPConst.NS_XMP, "ModifyDate", d, XMPConst.XMPDATE);

        var subjects = loadSubjects(xmp);

        if (add)
        {
            nodes = stripArray(nodes, subjects);
        }
        else
        {
            nodes = intersectArray(nodes, subjects);
        }
        //return [nodes[0].value,nodes[0].index, add];
        for (var i = 0; i < nodes.length; i++)
        {
            if (add)
            {
                xmp.appendArrayItem(XMPConst.NS_DC, "subject", nodes[i], 0, XMPConst.ARRAY_IS_ORDERED);
            }
            else
            {
                xmp.deleteArrayItem(XMPConst.NS_DC, "subject", nodes[i].index);
            }
        }

        var hierarchy = loadHierarchy(xmp);
        parents = stripArray(parents, hierarchy);
        for (i = 0; i < parents.length; i++)
        {
            xmp.appendArrayItem("http://ns.adobe.com/lightroom/1.0/", "hierarchicalSubject", parents[i], 0, XMPConst.ARRAY_IS_ORDERED);
        }
        // Write the packet back to the selected file
        var updatedPacket = xmp.serialize(XMPConst.SERIALIZE_OMIT_PACKET_WRAPPER | XMPConst.SERIALIZE_USE_COMPACT_FORMAT);

        // Uncomment to see the XMP packet in XML form
        // $.writeln(updatedPacket);
        thumb.metadata = new Metadata(updatedPacket);

        return "success";
    }
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
        if (searchInXMPArray(decider, target[i]) >= 0)
        {
            target.splice(i--,1);
        }
    }
    return target;
}
function intersectArray(target, decider)
{
    var intersection = [];
    for (var i = 0; i < target.length; i++)
    {
        var index = searchInXMPArray(decider, target[i]);
        if (index >= 0)
        {
            intersection.push({value: target[i], index: index+1});
        }
    }
    return intersection;
}


function loadSubjects(xmp) {
    var subjects = [];
    for (i = 1; i <= xmp.countArrayItems(XMPConst.NS_DC, "subject"); i++)
    {
        subjects.push(xmp.getArrayItem(XMPConst.NS_DC, "subject", i));
    }
    return subjects;
}
function loadHierarchy(xmp) {
    XMPMeta.registerNamespace("http://ns.adobe.com/lightroom/1.0/", "lr:");
    var hierarchy = [];
    for (i = 1; i <= xmp.countArrayItems("http://ns.adobe.com/lightroom/1.0/", "hierarchicalSubject"); i++)
    {
        hierarchy.push(xmp.getArrayItem("http://ns.adobe.com/lightroom/1.0/", "hierarchicalSubject", i));
    }
    return hierarchy;
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
/**
 check if array contains value
 because indexOf doesn't work
 */
function searchInXMPArray(array, value)
{
    for (var i = 0; i < array.length; i++)
    {
        if (array[i].toString().toLowerCase() === value.toLowerCase())
        {
            return i;
        }
    }
    return -1;
}