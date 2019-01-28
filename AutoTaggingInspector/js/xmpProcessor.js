"use strict";


function writeXMPContent(response) {
        csInterface.evalScript('loadDate()', function (listDate) {
            let appDate = new Date();
            appDate.setHours(0, 0, 0, 0);
            if (listDate !== undefined && listDate != null && listDate !== "") {
                listDate.setHours(0, 0, 0, 0);
            }
            if (appDate !== listDate)
            {
                let subjects = [],  hierarchy = [];
                let limConfidence = 0.7;
                let checkParents = false;

                if (!response.labels)
                {
                    response.labels = [];
                }

                for (let i = 0; i < response.labels.length; i++)
                {
                    if (response.labels[i].confidence >= limConfidence)
                    {
                        subjects.push(response.labels[i].name);
                        if (response.labels[i].parents.length > 0)
                        {
                            for (let pIndex = 0; pIndex < response.labels[i].parents.length; pIndex++)
                            {
                                hierarchy.push(response.labels[i].parents[pIndex].name + "|" + response.labels[i].name);
                                if (checkParents)
                                {
                                    subjects.push(response.labels[i].parents[pIndex].name);
                                }
                            }
                        }
                        else
                        {
                            hierarchy.push(response.labels[i].name);
                        }
                    }
                }
                csInterface.evalScript('saveMetaData(' + JSON.stringify(subjects) + ',' + JSON.stringify(hierarchy) + ',' + JSON.stringify(response.labels) + ')', function (event) {
                    if (event !== 'success') {
                        alert (event);
                    }
                });
        }
    });


    //return {subjects: subjects, hierarchy: hierarchy};
}

/**
 * Loads metadata from XMP file. If there is metadata calls a process function, otherwise empties the tags.
 */
//don't call before csInterface is declared
function loadXMPContent () {
        csInterface.evalScript('loadMetaData()', function (event) {
            if (event !== "") {
                try {
                    event = JSON.parse(event);
                } catch (e) {
                    alert(event);
                    alert(e);
                }
            }
            if (event.metadata) {
                processXMPContent(event);
            } else {
                toggleHelpText(true);
                $('#tags').empty();
            }
        });
}

/**
 * Processes XMP metadata and writes the result into callResponse. On finishing throws 'updataGUI' event.
 * @param xmpContent {subjects: { Array }, hierarchy: { Array }, response: { Array }, history: { Array }, metadata: { Boolean }}
 */
function processXMPContent(xmpContent) {
    let responseHierarchy = [];
    //reverse child to parents relationship to parent to children
    for (let childIndex = 0; childIndex < xmpContent.response.length; childIndex++) {
        var parentIndices = [];

        //insert parents
        for (let parentIndex = 0; parentIndex < xmpContent.response[childIndex].parents.length; parentIndex++) {
            let name = xmpContent.response[childIndex].parents[parentIndex].name;
            let index = findInHierarchy(responseHierarchy, name);
            let histIndex = findInHistory(xmpContent.history, name);
            //check if parent terminated
            if ((index < 0 && histIndex < 0) || (histIndex >= 0 && xmpContent.history[histIndex].property !== "terminate")) {
                responseHierarchy.push({
                    name: name,
                    confidence: 1.0,
                    children: [],
                    ticked: false
                });
                parentIndices.push(responseHierarchy.length - 1);
            } else {
                parentIndices.push(index);
            }
        }

        let histIndex = findInHistory(xmpContent.history, xmpContent.response[childIndex].description);
        //terminate child
        if (histIndex < 0 || (histIndex >= 0 && xmpContent.history[histIndex].property !== "terminate")) {
            //setup child
            let child = {
                name: xmpContent.response[childIndex].name,
                confidence: xmpContent.response[childIndex].confidence,
                children: [],
                ticked: false
            };
            for (let parentIndex = 0; parentIndex < parentIndices.length; parentIndex++) {
                if (parentIndices >= 0 && findInHierarchy(responseHierarchy[parentIndices[parentIndex]], xmpContent.response[childIndex].description) < 0) {
                    //set parent reference
                    responseHierarchy[parentIndices[parentIndex]].children.push(child);
                }
            }
            if (parentIndices.length === 0) {
                responseHierarchy.push(child);
            }
        }
    }

    //get hierarchical object
    let nodeHierarchy = [];
    for (let i = 0; i < xmpContent.hierarchy.length; i++) {
        let writtenTags = [];
        let indices = [];


        //delete empty strings (in case of wrong insertion into XMP -> |value| or |value||value instead of value|value|value)
        xmpContent.hierarchy[i] = xmpContent.hierarchy[i].trim().replace("/^\||\|$/g", "").replace("/[\\|]{2,}/g", "|");
        //find division
        for (let charPosition = 0; charPosition < xmpContent.hierarchy[i].length; charPosition++) {
            if (xmpContent.hierarchy[i].charAt(charPosition) === "|") {
                indices.push(charPosition);
            }
        }
        //extract text
        let currentIndex = 0, lastIndex = 0;
        for (let charPosition = 0; charPosition <= indices.length; charPosition++) {
            if (charPosition < indices.length) {
                currentIndex = indices[charPosition];
            } else {
                currentIndex = xmpContent.hierarchy[i].length;
            }
            writtenTags.push(xmpContent.hierarchy[i].substr(lastIndex, currentIndex - lastIndex));

            lastIndex = currentIndex + 1;
        }

        //insert into node tree
        let tempHierarchy = nodeHierarchy;
        for (let tagIndex = 0; tagIndex < writtenTags.length; tagIndex++) {
            //handle parent -> exclude from loop cause always there?
            let index = findInHierarchy(tempHierarchy, writtenTags[tagIndex]);
            if (index < 0) {
                tempHierarchy.push({
                    name: writtenTags[tagIndex],
                    confidence: 1.0,
                    children: [],
                    ticked: isTicked(writtenTags[tagIndex], xmpContent.subjects)
                });
                tempHierarchy = tempHierarchy[tempHierarchy.length - 1].children;
            } else {
                tempHierarchy = tempHierarchy[index].children;
            }
        }
    }

    //combine written tags and reponse tags -> could be made into a depth/breadth traverse method
    for (let i = 0; i < responseHierarchy.length; i++)
    {
        let index = findInHierarchy(nodeHierarchy, responseHierarchy[i].name);
        if (index >= 0)
        {
            nodeHierarchy[index].confidence = responseHierarchy[i].confidence;
            for (var ci = 0; ci < responseHierarchy[i].children; ci++)
            {
                var cIndex = findInHierarchy(nodeHierarchy[index].children, responseHierarchy[i].children[ci].name);
                if (cIndex > 0)
                {
                    nodeHierarchy[index].children[cIndex].confidence = responseHierarchy[i].children[ci].confidence;
                }
                else
                {
                    //add if non existent
                    nodeHierarchy[index].children.push(responseHierarchy[i].children[ci]);
                }
            }
        }
        else
        {
            //add if non existent
            nodeHierarchy.push(responseHierarchy[i]);
        }
    }

    //$.writeln("Combined tags & responseHierarchy");
    sortArrayOutput(nodeHierarchy);
    callResponse = {
        response: xmpContent.response,
        content: nodeHierarchy,
        history: xmpContent.history
    };
    $('body').trigger('updateGUI');
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
        for (let i = 0; i < array.length; i++)
        {
            if (array[i].name.toLowerCase() === targetString.toLowerCase())
            {
                return i;
            }
        }
    }
    return -1;
}
function findInHistory (history, nodeString)
{
    for (var i = 0; i < history.length; i++)
    {
        if (history[i].name && history[i].name.toLowerCase() === nodeString.toLowerCase())
        {
            return i;
        }
    }
    return -1;
}

/**
 * traverse through object tree to sort all child nodes
 * @param {array} outPutArray
 */
function sortArrayOutput (outPutArray)
{
    let traverseStack = [];
    traverseStack.push(outPutArray);
    while (traverseStack.length !== 0)
    {
        let array = traverseStack.pop();
        array.sort(function(a, b) {
            return a.name.toLowerCase() === b.name.toLowerCase() ?
                (a.confidence === b.confidence ? 0 : (a.confidence < b.confidence ? 1 : -1))
                : (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1);
        });
        for (let i = 0; i < array.length; i++)
        {
            traverseStack.push(array[i].children);
        }
    }
}

/**
 * Searches through searchArray if name exists
 * @param {string} name
 * @param {array} searchArray
 * @return true if item exists (is ticked), false if it doesn't
 */
function isTicked(name, searchArray)
{
    for (let i = 0; i < searchArray.length; i++)
    {
        if (searchArray[i].toLowerCase() === name.toLowerCase())
        {
            return true;
        }
    }
    return false;
}