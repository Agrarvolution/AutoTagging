"use strict";

function loadXMPContent (csInterface) {
        let jsxResponse = {};
        csInterface.evalScript('loadMetaData()', function (event) {
            if (event.metadata) {
                jsxResponse = event;
            }
        });

        var response = [];
        //reverse child to parents relationship to parent to children
        for (var i = 0; i < tagList.length; i++) {
            var parentIndices = [];

            //insert parents
            for (var pi = 0; pi < tagList[i].parents.length; pi++) {
                var index = -1;
                var name = tagList[i].parents[pi].description;
                if (name === undefined) {
                    name = tagList[i].parents[pi].name;
                }

                index = findInHierarchy(response, name);
                var histIndex = findInHistory(history, name);
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

            histIndex = findInHistory(history, tagList[i].description);
            //terminate child
            if (histIndex < 0 || (histIndex >= 0 && history[histIndex].property !== "terminate"))
            {
                //setup child
                var child = {
                    name: tagList[i].description,
                    confidence: tagList[i].confidence,
                    children: [],
                    ticked: false
                };
                for (pi = 0; pi < parentIndices.length; pi++) {
                    if (parentIndices >= 0 && findInHierarchy(response[parentIndices[pi]], tagList[i].description) < 0) {
                        //set parent reference
                        response[parentIndices[pi]].children.push(child);
                    }
                }
                if (parentIndices.length === 0) {
                    response.push(child);
                }
            }
        }
    }
    $.writeln("Done response");

    var subjects = [];
    var hierarchy = [];
    for (i = 1; i <= xmp.countArrayItems(XMPConst.NS_DC, "subject"); i++)
    {
        subjects.push(xmp.getArrayItem(XMPConst.NS_DC, "subject", i));
    }
    XMPMeta.registerNamespace("http://ns.adobe.com/lightroom/1.0/", "lr:");
    for (i = 1; i <= xmp.countArrayItems("http://ns.adobe.com/lightroom/1.0/", "hierarchicalSubject"); i++)
    {
        hierarchy.push(xmp.getArrayItem("http://ns.adobe.com/lightroom/1.0/", "hierarchicalSubject", i));
    }

    //$.writeln("Retrieved tags");
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

    $.writeln("Init xLib");
    var xLib;
    try {
        xLib = new ExternalObject("lib:\PlugPlugExternalObject");
    } catch(e) { alert("Missing ExternalObject: "+e); }
    //throw update event
    $.writeln("About to throw event");
    if (xLib) {
        var eventObj = new CSXSEvent();
        eventObj.type = "updateAutoTagInspector";
        eventObj.data = JSON.stringify({response: tagList, content: nodeHierarchy, history: "", thumb: true});
        eventObj.dispatch();
    }
}