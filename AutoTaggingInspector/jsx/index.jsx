/**
 * Adds XMP lib in case it is not declared yet.
 */
function addDependencies()
{
    if (ExternalObject.AdobeXMPScript === undefined) {
        ExternalObject.AdobeXMPScript = new ExternalObject('lib:AdobeXMPScript');
    }
}

/**
 * Loads metadata for a given image. This includes all subject and hierarchy strings of the start of a selection and response and history arrays.
 * @returns {{response: Array, subjects: Array, hierarchy: Array, history: Array, metadata: Boolean}} <- if image has no thumb this is empty
 */
function loadMetaData()
{
    addDependencies();

    var subjects = [], hierarchy = [], response = [], history = [];
    var thumb = app.document.selections[0];

    if(thumb !== undefined && thumb != null && thumb.hasMetadata) {
        // Get the metadata object - wait for  valid values
        var md = thumb.synchronousMetadata;

        // Get the XMP packet as a string and create the XMPMeta object
        var xmp = new XMPMeta(md.serialize());

        // Change the date modified
        var d = new XMPDateTime(new Date());
        d.convertToLocalTime();
        xmp.setProperty(XMPConst.NS_XMP, "ModifyDate", d, XMPConst.XMPDATE);

        XMPMeta.registerNamespace("http://ns.adobe.autotaggingJSON/", "atdata:");

        response = loadAutoTaggingProperties(xmp, "labelListJSON");
        history = loadAutoTaggingProperties(xmp, "historyListJSON");
        subjects = xmpObjectsToString(loadSubjects(xmp));
        hierarchy = xmpObjectsToString(loadHierarchy(xmp));
        return JSON.stringify({subjects: subjects, hierarchy: hierarchy, response: response, history: history, metadata: thumb.hasMetadata});
    }
    return JSON.stringify({metadata: false});
}

/**
 * Renames given XMP Keywords or strings in response list by supressing the response objects or replacing the xmp values.
 * Always ads hierarchy strings for response keywords.
 * @param previousNode - previous node that was saved in xmp files {subject: [], hierarchy: []}
 * @param newNode - new node that replaces the old values {subject: [], hierarchy: []}
 * @param historyUpdates - Objects that are pushed onto the history array
 * @returns {string} returns 'failure' or 'success'
 */
function renameLabel(previousNode, newNode, historyUpdates)
{
    addDependencies();

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
        }
        if (newNode.name !== "")
        {
            xmp.appendArrayItem(XMPConst.NS_DC, "subject", newNode.name, 0, XMPConst.ARRAY_IS_ORDERED);
        }

        var hierarchy = loadHierarchy(xmp);
        for (i = 0; i < previousNode.parent.length; i++)
        {
            //remove double inserts and other issues
            for (var hi = 0; hi < hierarchy.length; hi++)
            {
                if (hierarchy[hi].toString().toLowerCase() === previousNode.parent[i].toLowerCase())
                {
                    xmp.deleteArrayItem("http://ns.adobe.com/lightroom/1.0/", "hierarchicalSubject", hi+1);
                    hierarchy.splice(hi--,1);
                }
            }
        }

        for (i = 0; i < newNode.parent.length; i++) {
            if (searchInXMPArray(hierarchy, newNode.parent[i])) {
                xmp.appendArrayItem("http://ns.adobe.com/lightroom/1.0/", "hierarchicalSubject", newNode.parent[i], 0, XMPConst.ARRAY_IS_ORDERED);
            }
        }

        if (historyUpdates !== undefined && historyUpdates != null && historyUpdates.length > 0)
        {
            var history = loadAutoTaggingProperties(xmp, "historyListJSON");

            if (history.length)
            {
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
 * Checks or unchecks given subjects. It always stores their hierarchy strings.
 * @param nodes - array of subjects strings
 * @param parents - array of hierarchy strings
 * @param add - false [remove checked] <-> true [check keywords]
 * @returns {string} returns 'failure' or 'success'
 */
function writeSelectionChange(nodes, parents, add)
{
    addDependencies();
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
    addDependencies();

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
            //remove double inserts and other issues
            for (var hi = 0; hi < hierarchy.length; hi++)
            {
                if (hierarchy[hi].toString().toLowerCase() === parentsDel[i].toLowerCase())
                {
                    xmp.deleteArrayItem("http://ns.adobe.com/lightroom/1.0/", "hierarchicalSubject", hi+1);
                    hierarchy.splice(hi--,1);
                }
            }
        }

        if (historyUpdates !== undefined && historyUpdates != null && historyUpdates.length > 0)
        {

            var history = loadAutoTaggingProperties(xmp, "historyListJSON");

            if (history.length !== 0)
            {
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
            decider.splice(index, 1);
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
 * Loads AutoTagging propoerties from XMP metadata.
 * @param xmp initialized object
 * @param propertyName - name of AutoTagging property
 * @returns {Array|*} - parsed AuoTagging JSON string
 */
function loadAutoTaggingProperties(xmp, propertyName) {
    var propertyData = xmp.getProperty("http://ns.adobe.autotaggingJSON/", propertyName, XMPConst.STRING);

    if (propertyData !== undefined && propertyData != null && propertyData != "")
    {
        try {
            propertyData = JSON.parse(propertyData);
        } catch (e) {
            $.writeln('JSON property read failed.');
        }
    }
    else
    {
        propertyData = [];
    }
    return propertyData;
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

function xmpObjectsToString(xmpObjectArray)
{
    for (var i = 0; i < xmpObjectArray.length; i++)
    {
        xmpObjectArray[i] = xmpObjectArray[i].toString();
    }
    return xmpObjectArray;
}
