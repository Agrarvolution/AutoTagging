/**
 * Loads metadata for a given image. This includes all subject and hierarchy strings of the start of a selection and response and history arrays.
 * @returns {{response: Array, subjects: Array, hierarchy: Array, history: Array, metadata: Boolean}} <- if image has no thumb this is empty
 */
function loadMetaData()
{
    var subjects = [], hierarchy = [], response = [], history = [];

    if(app.document.selections[0].hasMetadata) {
        // Get the metadata object - wait for  valid values
        var md = thumb.synchronousMetadata;

        // Get the XMP packet as a string and create the XMPMeta object
        var xmp = new XMPMeta(md.serialize());

        // Change the date modified
        var d = new XMPDateTime(new Date());
        d.convertToLocalTime();
        xmp.setProperty(XMPConst.NS_XMP, "ModifyDate", d, XMPConst.XMPDATE);

        XMPMeta.registerNamespace("http://ns.adobe.autotaggingJSON/", "atdata:");

        response = xmp.getProperty("http://ns.adobe.autotaggingJSON/", "labelListJSON", XMPConst.STRING);
        history = xmp.getProperty("http://ns.adobe.autotaggingJSON/", "historyListJSON", XMPConst.STRING);

        /*if (history !== undefined && history != null && history != "")
        {
            history = JSON.parse(history);
        }
        else
        {
            history = [];
        }

        if (response !== undefined && response != null && response != "")
        {
            response = JSON.parse(response);
        }
        else
        {
            response = [];
        }*/

        subjects = loadSubjects(xmp);
        hierarchy = loadHierarchy(xmp);
    }

    return {subjects: subjects, hierarchy: hierarchy, response: response, history: history, metadata: app.document.selections[0].hasMetadata};
}

/**
 * Renames given XMP Keywords or strings in response list by supressing the response objects or replacing the xmp values.
 * Always ads hierarchy strings for response keywords.
 * @param previousNode - previous node that was saved in xmp files {subject: [], hierarchy: []}
 * @param newNode - new node that replaces the old values {subject: [], hierarchy: []}
 * @param historyChange - Object that is pushed onto the history array
 * @returns {string} returns 'failure' or 'success'
 */
function renameLabel(previousNode, newNode, historyChange)
{
    var thumb = app.document.selections[0];

    if(thumb.hasMetadata) {
        // Get the metadata object - wait for  valid values
        var md = thumb.synchronousMetadata;

        // Get the XMP packet as a string and create the XMPMeta object
        var xmp = new XMPMeta(md.serialize());

        // Change the creator tool
        xmp.setProperty(XMPConst.NS_XMP, "CreatorTool", "Changed by AutoTaggingGUI - UpdateElement");

        // Change the date modified
        var d = new XMPDateTime(new Date());
        d.convertToLocalTime();
        xmp.setProperty(XMPConst.NS_XMP, "ModifyDate", d, XMPConst.XMPDATE);

        var subjects = loadSubjects(xmp);
        var indexInSubjects = searchInXMPArray(subjects, previousNode.name)+1;

        if (indexInSubjects)
        {
            xmp.deleteArrayItem(XMPConst.NS_DC, "subject", indexInSubjects);
            xmp.appendArrayItem(XMPConst.NS_DC, "subject", newNode.name, 0, XMPConst.ARRAY_IS_ORDERED);
        }


        var hierarchy = loadHierarchy(xmp);
        for (var i = 0; i < previousNode.parent.length; i++)
        {
            var hierarchyIndex = searchInXMPArray(hierarchy, previousNode.parent[i])+1;
            if (hierarchyIndex)
            {
                xmp.deleteArrayItem("http://ns.adobe.com/lightroom/1.0/", "hierarchicalSubject", hierarchyIndex);
            }
            xmp.appendArrayItem("http://ns.adobe.com/lightroom/1.0/", "hierarchicalSubject", newNode.parent[i], 0, XMPConst.ARRAY_IS_ORDERED);
        }
        if (historyChange.name)
        {
            XMPMeta.registerNamespace("http://ns.adobe.autotaggingJSON/", "atdata:");
            var history = xmp.getProperty("http://ns.adobe.autotaggingJSON/", "historyListJSON", XMPConst.STRING);

            if (history !== undefined && history != null && history != '')
            {
                history = JSON.parse(history);
                if (searchInArray(history, historyChange.name) < 0)
                {
                    history.push(historyChange);
                }
            }
            else
            {
                history = [];
                history.push(historyChange);
            }
            xmp.setProperty("http://ns.adobe.autotaggingJSON/", "historyListJSON", JSON.stringify(history));
        }
        // Write the packet back to the selected file
        var updatedPacket = xmp.serialize(XMPConst.SERIALIZE_OMIT_PACKET_WRAPPER | XMPConst.SERIALIZE_USE_COMPACT_FORMAT);

        // Uncomment to see the XMP packet in XML form
        // $.writeln(updatedPacket);
        thumb.metadata = new Metadata(updatedPacket);

        return "success";
    }
    return "failure";
}

/**
 * Checks or unchecks given subjects. It always stores their hierarchy strings.
 * @param nodes - array of subjects strings
 * @param parents - array of hierarchy strings
 * @param add - false [remove checked] <-> true [check keywords]
 * @returns {string} returns 'failure' or 'success'
 */
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
    return "failure";
}

/**
 * Removes all traces of a given keyword elements including its children.
 * @param subjectsDel - subject string to be removed
 * @param parentsDel - hierarchy strings needed for removing
 * @param historyUpdates - Object that is pushed onto the history array
 * @returns {string} returns 'failure' or 'success'
 */
function removeLabels(subjectsDel, parentsDel, historyUpdates)
{
    var thumb = app.document.selections[0];

    if(thumb.hasMetadata && subjectsDel.length && parentsDel.length) {
        // Get the metadata object - wait for  valid values
        var md = thumb.synchronousMetadata;

        // Get the XMP packet as a string and create the XMPMeta object
        var xmp = new XMPMeta(md.serialize());

        // Change the creator tool
        xmp.setProperty(XMPConst.NS_XMP, "CreatorTool", "Changed by AutoTaggingGUI - RemoveElements");

        // Change the date modified
        var d = new XMPDateTime(new Date());
        d.convertToLocalTime();
        xmp.setProperty(XMPConst.NS_XMP, "ModifyDate", d, XMPConst.XMPDATE);

        var subjects = loadSubjects(xmp);
        var hierarchy = loadHierarchy(xmp);


        for (var i = 0; i < subjectsDel.length; i++)
        {
            var indexInSubjects = searchInXMPArray(subjects, subjectsDel[i])+1;
            if (indexInSubjects)
            {
                xmp.deleteArrayItem(XMPConst.NS_DC, "subject", indexInSubjects);
            }
        }

        for (i = 0; i < parentsDel.length; i++)
        {
            var hierarchyIndex = searchInXMPArray(hierarchy, parentsDel[i])+1;
            if (hierarchyIndex)
            {
                xmp.deleteArrayItem("http://ns.adobe.com/lightroom/1.0/", "hierarchicalSubject", hierarchyIndex);
            }
        }

        if (historyUpdates.length)
        {
            XMPMeta.registerNamespace("http://ns.adobe.autotaggingJSON/", "atdata:");
            var history = xmp.getProperty("http://ns.adobe.autotaggingJSON/", "historyListJSON", XMPConst.STRING);

            if (history !== undefined && history != null && history != '')
            {
                history = JSON.parse(history);
                for (i = 0; i < historyUpdates.length; i++)
                {
                    if (searchInArray(history, historyUpdates[i].name) < 0)
                    {
                        history.push(historyUpdates[i]);
                    }
                }
            }
            else
            {
                history = historyUpdates;
            }
            xmp.setProperty("http://ns.adobe.autotaggingJSON/", "historyListJSON", JSON.stringify(history));
        }

        // Write the packet back to the selected file
        var updatedPacket = xmp.serialize(XMPConst.SERIALIZE_OMIT_PACKET_WRAPPER | XMPConst.SERIALIZE_USE_COMPACT_FORMAT);

        // Uncomment to see the XMP packet in XML form
        // $.writeln(updatedPacket);
        thumb.metadata = new Metadata(updatedPacket);

        return "success";
    }
    return "failure";
}
/**
 * Compares if value is in the target array, and removes it if it exists.
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

/**
 * Compares if value is in target array and stores intersections in an array including the index of its occurance
 * @param target
 * @param decider
 * @returns {Array}
 */
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

/**
 * Loads all subjects of a given thumb object (ticked/checked keywords)
 * @param xmp
 * @returns {Array} oof strings containing subjects
 */
function loadSubjects(xmp) {
    var subjects = [];
    for (i = 1; i <= xmp.countArrayItems(XMPConst.NS_DC, "subject"); i++)
    {
        subjects.push(xmp.getArrayItem(XMPConst.NS_DC, "subject", i));
    }
    return subjects;
}

/**
 * Loads all hierarchical objects of a given thumb object
 * @param xmp
 * @returns {Array} of strings containing hierarchy strings
 */
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

function searchInArray(array, value)
{
    for (var i = 0; i < array.length; i++)
    {
        if (array[i].name.toLowerCase() === value.toLowerCase())
        {
            return i;
        }
    }
    return -1;
}
