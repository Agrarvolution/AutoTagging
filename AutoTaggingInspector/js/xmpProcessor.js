"use strict";

//don't call before csInterface is declared
function loadXMPContent () {
        csInterface.evalScript('loadMetaData()', function (event) {
            try {
                event = JSON.parse(event);
            }
            catch (e) {
                alert(e);
            }
            if (event.metadata) {
                processXMPContent(event);
            }
        });
}

function processXMPContent(xmpContent) {
    let response = [];

    //reverse child to parents relationship to parent to children
    for (let i = 0; i < xmpContent.response.length; i++) {
        var parentIndices = [];

        //insert parents
        for (let parentIndex = 0; parentIndex < xmpContent.response[i].parents.length; parentIndex++) {
            let name = xmpContent.response[i].parents[parentIndex].description;

            if (name === undefined) {
                name = xmpContent.response[i].parents[parentIndex].name;
            }

            let index = findInHierarchy(response, name);
            let histIndex = findInHistory(xmpContent.history, name);
            //check if parent terminated
            if ((index < 0 && histIndex < 0) || (histIndex >= 0 && history[histIndex].property !== "terminate")) {
                response.push({
                    name: name,
                    confidence: 1.0,
                    children: [],
                    ticked: false
                });
                parentIndices.push(response.length - 1);
            } else {
                parentIndices.push(index);
            }
        }

        let histIndex = findInHistory(history, xmpContent.response[i].description);
        //terminate child
        if (histIndex < 0 || (histIndex >= 0 && xmpContent.history[histIndex].property !== "terminate")) {
            //setup child
            let child = {
                name: tagList[i].description,
                confidence: tagList[i].confidence,
                children: [],
                ticked: false
            };
            for (let parentIndex = 0; parentIndex < parentIndices.length; parentIndex++) {
                if (parentIndices >= 0 && findInHierarchy(response[parentIndices[parentIndex]], tagList[i].description) < 0) {
                    //set parent reference
                    response[parentIndices[parentIndex]].children.push(child);
                }
            }
            if (parentIndices.length === 0) {
                response.push(child);
            }
        }
    }

    //get hierarchical object
    var nodeHierarchy = [];
    for (i = 0; i < hierarchy.length; i++) {
        var writtenTags = [];
        var indices = [];

        var hierarchyText = hierarchy[i].toString();

        //delete empty strings (in case of wrong insertion into XMP -> |value| instead of value|value|value)
        hierarchyText = hierarchyText.replace("/^\\s+|\\s+$/g", "").replace("[ ]{2,}", " ").replace("/^\||\|$/", "");
        //find division
        for (var charPosition = 0; charPosition < hierarchyText.length; charPosition++) {
            if (hierarchyText.charAt(charPosition) === "|") {
                indices.push(charPosition);
            }
        }
        //extract text
        var currentIndex = 0, lastIndex = 0;
        for (charPosition = 0; charPosition <= indices.length; charPosition++) {
            if (charPosition < indices.length) {
                currentIndex = indices[charPosition];
            } else {
                currentIndex = hierarchyText.length;
            }
            writtenTags.push(hierarchyText.substr(lastIndex, currentIndex - lastIndex));

            lastIndex = currentIndex + 1;
        }

        //insert into node tree
        var tempHierarchy = nodeHierarchy;
        for (var tagIndex = 0; tagIndex < writtenTags.length; tagIndex++) {
            //handle parent -> exclude from loop cause always there?
            index = findInHierarchy(tempHierarchy, writtenTags[tagIndex]);
            if (index < 0) {
                tempHierarchy.push({
                    name: writtenTags[tagIndex],
                    confidence: 1.0,
                    children: [],
                    ticked: false
                });
                tempHierarchy = tempHierarchy[tempHierarchy.length - 1].children;
            } else {
                tempHierarchy = tempHierarchy[index].children;
            }
        }
    }
    //check ticks
    depthSearchTick(nodeHierarchy,subjects);

    if(response !== undefined)
    {
        //combine written tags and reponse tags -> could be made into a depth/breadth traverse method
        for (i = 0; i < response.length; i++)
        {
            index = findInHierarchy(nodeHierarchy, response[i].name);
            //$.writeln(index + " " + response[i].name);
            if (index >= 0)
            {
                nodeHierarchy[index].confidence = response[i].confidence;
                for (var ci = 0; ci < response[i].children; ci++)
                {
                    var cIndex = findInHierarchy(nodeHierarchy[index].children, response[i].children[ci].name);
                    if (cIndex > 0)
                    {
                        nodeHierarchy[index].children[cIndex].confidence = response[i].children[ci].confidence;
                    }
                    else
                    {
                        //add if non existent
                        nodeHierarchy[index].children.push(response[i].children[ci]);
                    }
                }
            }
            else
            {
                //add if non existent

                nodeHierarchy.push(response[i]);

            }
        }
    }

    //$.writeln("Combined tags & response");
    sortArrayOutput(nodeHierarchy);

    let updateGUIEvent = new Event('updateGUI', {data: {response: xmpContent.response, content: nodeHierarchy, history: xmpContent.history}
    });
    document.dispatchEvent(updateGUIEvent);
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
function findInHistory (history, nodeString)
{
    for (var i = 0; i < history.length; i++)
    {
        if (history[i].name.toLowerCase() === nodeString.toLowerCase())
        {
            return i;
        }
    }
    return -1;
}