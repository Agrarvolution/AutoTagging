"use strict";

// Get a reference to a CSInterface object
let csInterface = new CSInterface();
loadJSX("js/libs/json2.js");

setupContextMenu();

let callResponse = {};

// Add an event listener to update the background colour of Extension to match the Bridge Theme.
csInterface.addEventListener("com.adobe.csxs.events.ThemeColorChanged", themeChangedEventListener);
csInterface.addEventListener("updateAutoTagInspector", loadContentListener);


function setupContextMenu() {
    let contextMenu = {};
    contextMenu.menu = [];

    let addItem = {};
    addItem.id = 'add';
    addItem.label = 'Add';
    addItem.enabled = true;

    contextMenu.menu.push(addItem);

    let clickAllItem = {};
    clickAllItem.id = 'clickAll';
    clickAllItem.label = 'Click all';
    clickAllItem.enabled = false;

    contextMenu.menu.push(clickAllItem);

    let renameItem = {};
    renameItem.id = 'rename';
    renameItem.label = 'Rename';
    renameItem.enabled = false;

    contextMenu.menu.push(renameItem);

    let removeItem = {};
    removeItem.id = 'remove';
    removeItem.label = 'Remove';
    removeItem.enabled = false;

    contextMenu.menu.push(removeItem);

    csInterface.setContextMenuByJSON(JSON.stringify(contextMenu), function (callback) {
        let contextMenuEvent = new Event(callback, {
        });
        //alert(contextMenuEvent);
        document.dispatchEvent(contextMenuEvent);
        //alert(e);
    });
}
function disableContextMenuItems() {
    csInterface.updateContextMenuItem('clickAll', false);
    csInterface.updateContextMenuItem('rename', false);
    csInterface.updateContextMenuItem('remove', false);
}

//Listener for ThemeColorChanged event.
function themeChangedEventListener(event)
{
    changeThemeColor();
}

//Gets Bridge Theme information and updates the body colour
function changeThemeColor()
{
    var hostEnv = csInterface.getHostEnvironment();
    var UIColorObj = new UIColor();
    UIColorObj = hostEnv.appSkinInfo.appBarBackgroundColor;
    var red = Math.round(UIColorObj.color.red);
    var green = Math.round(UIColorObj.color.green);
    var blue = Math.round(UIColorObj.color.blue);
    var alpha = Math.round(UIColorObj.color.alpha);
    var colorRGB = "#" + red.toString(16) + green.toString(16) + blue.toString(16);

    if ("#535353" !== colorRGB) /* "#535353" is the original color */
    {
        document.body.style.backgroundImage = "none";
    }
    document.body.style.backgroundColor = colorRGB;
    document.body.style.opacity = alpha / 255;
}




/*
@Todo Load items from JSX [JSON]
response: actual response object
content: complete JSON array with items that contain children, ticked flag and confidencee

Eventlistener   to JSX?
return parsed object
 */
function loadContentListener(event)
{
    // placeholder -> replace by call to jsx & XMP parser
    /*let answer = '{"response":[{"description":"dog","confidence":0.8858542056,"parents":[\n' +
        '\n' +
        ']},{"description":"vertebrate","confidence":0.73445880411272,"parents":[\n' +
        '\n' +
        ']},{"description":"clumber spaniel","confidence":0.72049342313895,"parents":[\n' +
        '\n' +
        ']},{"description":"mammal","confidence":0.718383380625,"parents":[\n' +
        '\n' +
        ']},{"description":"english cocker spaniel","confidence":0.57500941128906,"parents":[\n' +
        '\n' +
        ']},{"description":"Laubwald","confidence":0.9604,"parents":[{"name":"Landschaft"}]},{"description":"Brücke","confidence":0.81,"parents":[{"name":"Bauwerke"}]}],"content":[{"name":"Bauwerke","confidence":1,"children":[{"name":"Brücke","confidence":1,"children":[\n' +
        '\n' +
        '],"ticked":true},{"name":"Haus","confidence":1,"children":[\n' +
        '\n' +
        '],"ticked":true},{"name":"Ufermauer","confidence":1,"children":[\n' +
        '\n' +
        '],"ticked":true},{"name":"Ötzi","confidence":1,"children":[\n' +
        '\n' +
        '],"ticked":true}],"ticked":true},{"name":"Landschaft","confidence":1,"children":[{"name":"Laubwald","confidence":0.9604,"children":[\n' +
        '\n' +
        '],"ticked":false}],"ticked":false},{"name":"Landschaft","confidence":1,"children":[{"name":"Laubwald","confidence":1,"children":[\n' +
        '\n' +
        '],"ticked":true}],"ticked":false},{"name":"dog","confidence":0.8858542056,"children":[\n' +
        '\n' +
        '],"ticked":true},{"name":"vertebrate","confidence":0.73445880411272,"children":[\n' +
        '\n' +
        '],"ticked":false},{"name":"clumber spaniel","confidence":0.72049342313895,"children":[\n' +
        '\n' +
        '],"ticked":false},{"name":"mammal","confidence":0.718383380625,"children":[\n' +
        '\n' +
        '],"ticked":false},{"name":"english cocker spaniel","confidence":0.57500941128906,"children":[\n' +
        '\n' +
        '],"ticked":false}],"history":""}';
    */

    //let content = JSON.parse(answer);
    //Enable for SendMetaDataHandler events
    if (event.data.type)
    {
        //Handles AutoTaggingCustomBridgeEvents
        callResponse = loadXMPContent(csInterface);
    }
    else
    {
        //Handles for SendMetaDataHandler events
        callResponse = event.data;
    }


    displayContent(event.data.content);
    return 0;
}

function resetContent(tag)
{
    tag.innerHTML = "";
}
/*
@Todo Display JSON items
call parenting and create single item
 */
function displayContent(response)
{
    /**
     * Should be an event listener
     * @type {any}
     */
    //let fullResponse = loadContentListener();
    //let content = fullResponse.content;

    toggleHelpText((!response));

    let contentDOMTarget = document.getElementById('tags');
    if (contentDOMTarget !== undefined && contentDOMTarget != null)
    {
        resetContent(contentDOMTarget);
    }
    else
    {
        let disableMessage = document.createElement('p');
        disableMessage.textContent = "No image selected / no tags are available for this image!";
        disableMessage.id = 'help';

        contentDOMTarget = document.createElement('main');
        contentDOMTarget.classList.add(tags);
        let body = document.createElement('body');
        body.appendChild(disableMessage);
        body.appendChild(contentDOMTarget);

        (document.getElementsByName('html'))[0].appendChild(body);
    }

    if (response)
    {
        for(let i = 0; i < response.length; i++)
        {
            contentDOMTarget.appendChild(createParentItem(response[i]));
        }
    }
    setupEventListeners();
}

function toggleHelpText(show)
{
    let text = $('#help');
    if (show)
    {
        text.removeClass('hidden');
    }
    else
    {
        text.addClass('hidden');
    }
}

/*
@ToDo Make parenting for items -> put parented items in container
either
<p>Parent Item <br> <- maybe limit to inline / use ul?
    <p>item</p>
    <p>item</p>
</p>
or
<div>
    <p>parent</p>
    <p>item</p>
</div>
 */
function createParentItem(parentGroup)
{
    let mainParent = document.createElement('section');
    mainParent.classList.add('itemParent');

    let parent;

    let stack = [];
    let nodeStack = [];

    stack.push(parentGroup);
    nodeStack.push(mainParent);

    while (stack.length !== 0)
    {
        let itemArray = stack.pop();
        let itemNode = nodeStack.pop();
        itemNode.appendChild(createItem(itemArray));

        if (itemArray.children.length > 0)
        {
            parent = document.createElement('div');
            parent.classList.add('items');
            itemNode.appendChild(parent);
        }

        for (let i = 0; i < itemArray.children.length; i++)
        {
            nodeStack.push(parent);
            stack.push(itemArray.children[i]);
        }
    }
    return mainParent;
}
/*
@Todo Create Single Item
setup checkup checkbox -> ticked if already written
unticked if only in source array
launch event listeners
 */
/**
 *
 * @param item -> contains name, confidence, children, ticked
 */
function createItem(item)
{
    let tag = document.createElement('div');
    tag.classList.add('itemSingle');

    let checkbox = document.createElement('input');
    checkbox.classList.add('centerItems', 'centerItemCheckbox', 'itemCheckbox');
    checkbox.type = 'checkbox';
    checkbox.value = JSON.stringify({name: item.name, confidence: item.confidence});
    checkbox.checked = item.ticked;

    let label = document.createElement('label');
    label.classList.add('centerItems', 'itemLabel');
    label.appendChild(document.createTextNode(item.name)); // + " | " + Math.round(item.confidence*100)));

    let labelChange = document.createElement('input');
    labelChange.classList.add('hidden', 'change', 'itemChange');
    labelChange.type = "text";
    labelChange.value = item.name;

    tag.appendChild(checkbox);
    tag.appendChild(label);
    tag.appendChild(labelChange);

    return tag;
}

/*
@ToDo Setup Event Listeners for Items
Checkbox:
    checked - schedule write function - add item to list
    unchecked - schedule write function - remove item from list
 Text:
    double click - open input dialog - default value is item text
    blur - save changes, schedule write function - add item to list, remove old item, add changes to user defined tags
    single click - check or uncheck
Group:
    single click - drag event
    blur - drop element where it hovered over last (highlight to which object it will be attached)
        - enable attaching either to item (parenting - make new subgroup & dropdown) or in between items
        - schedule write event - change tags & parenting

 */
/**
 * Helper method to setup all the event listeners inside the dom tree.
 */
function setupEventListeners() {
    $('.itemCheckbox').click(checkboxClickProcessing).dblclick(checkboxDblClickProcessing);

    $('.itemLabel').click( function() {
        $(this).parent().children('.itemCheckbox').trigger('click');
    }).dblclick(function (e) {
        e.target.nextSibling.classList.remove('hidden');
        e.target.classList.add('hidden');
        e.target.nextSibling.focus();
    });

    $('.itemChange').blur(changeLabel).keydown(function (e) {
        if (e.which === 13) {
            $(this).blur();
        }
    });

    //contextmenu event handling
    $('.itemSingle').contextmenu(function (e) {
        $('body').trigger('mousedown');
        csInterface.updateContextMenuItem('clickAll', true);
        csInterface.updateContextMenuItem('rename', true);
        csInterface.updateContextMenuItem('remove', true);

        let ctxRemove = function removeLabelEvent() {
            $('body').trigger('mousedown');
            removeLabel(e);
        };
        document.addEventListener('remove', ctxRemove);

        let ctxRename = function () {
            $(e.target).parent().children('.itemLabel').trigger('dblclick');
            $('body').trigger('mousedown');
        };
        document.addEventListener('rename', ctxRename);

        let ctxClickAll = function () {
            $(e.target).parent().children('.itemCheckbox').trigger('dblclick');
            $('body').trigger('mousedown');
        };
        document.addEventListener('clickAll', ctxClickAll);

        let resetContextMenu = function (event) {
            disableContextMenuItems();
            document.removeEventListener('remove', ctxRemove);
            document.removeEventListener('rename', ctxRename);
            document.removeEventListener('clickAll', ctxClickAll);
            $('body').off('mousedown', resetContextMenu);
        };

        $('body').mousedown(resetContextMenu);
    });
}

/*
@Todo check if checkbox
@Todo check Checkbox state
@Todo get all parent names
@Todo process into item name array and parent group
@Todo Add single and double click action
    -> single click handles one item
    -> double click handles clicked item + children
@Todo send to jsx processing (index.jsx)
    -> receives state, all node names, parent name
    -> loads nodes + parents (like in initial read) -> load into external code? not possible cause of different save locations
    -> checks identical strings
        -> on remove identical strings
        -> on add non identical strings
    -> write or delete changes

@Todo Future: scheduler -> only check per second and image (and on closing) -> less ressource intensive
 */
/**
 * Saves one checked checkbox into the XMP file of the image.
 * @param event
 * @returns {boolean} true on success
 */
function checkboxClickProcessing(event) {
    if (event.target.value) {
        var value = JSON.parse(event.target.value);
        if (value.name) {
            // HISTORY!!!
            csInterface.evalScript("writeSelectionChange(" + JSON.stringify([value.name]) + "," +
                JSON.stringify([discoverParentString(event.target)]) + "," + JSON.stringify(event.target.checked) + ")", function (e) {
                if (e === 'failure')
                {
                    event.target.checked = !event.target.checked;
                }
            });
        }
    }
    return true;
}

/**
 * Checks all children checkboxes on double click event.
 * @param event
 * @returns {boolean} true on success
 */
function checkboxDblClickProcessing(event) {
    if (event.target.value) {
        csInterface.evalScript("writeSelectionChange(" + JSON.stringify(findChildren(event.target)) + "," +
            JSON.stringify(generateHierarchy(event.target)) + "," + JSON.stringify(!event.target.checked) + ")", function (e) {
            if (e === 'success')
            {
                checkChildCheckboxes(event.target, !event.target.checked);
                return true;
            }
        });
    }
    return false;
}

function removeLabel(event) {
    let targetCheckbox = $(event.target).parent().children('.itemCheckbox');

    let hierarchy = generateHierarchy(targetCheckbox[0]);
    let subjects = findChildren(targetCheckbox[0]);
    let history = [];

    for (let i = 0; i < subjects.length; i++)
    {
        let historyTemp = searchInResponse(subjects[i], 0);
        if (historyTemp.name)
        {
            history.push(historyTemp);
        }
    }

    csInterface.evalScript("removeLabels(" + JSON.stringify(subjects) + "," + JSON.stringify(hierarchy) + "," + JSON.stringify(history) + ")", function (e) {
        if (e === 'success') {
            let parent = $(event.target).parent().parent();
            if (!parent.hasClass('itemParent'))
            {
                parent = $(event.target).parent();
            }
            parent.remove();
            return true;
        }
    });
}

//@ToDo replace parenting strings of children -> wrong order
/**
 * Label name change event function
 * Gets value from input field
 * Generates the hierarchy strings for previous and new name
 * Generates a history object that terminates a possible response object
 * Sends previous and new name including their hierarchy & the history object to a save method
 * Changes values on success & orders the parent again
 * @param event
 * @returns {boolean} true on success
 */
function changeLabel(event) {
    event.target.previousSibling.classList.remove('hidden');
    event.target.classList.add('hidden');

    let tempValue = JSON.parse(event.target.previousSibling.previousSibling.value);
    if (tempValue.name !== event.target.value) {
        let hierarchy = generateHierarchy(event.target.previousSibling.previousSibling);
        let prevNode = {
            name: tempValue.name,
            parent: hierarchy
        };

        let history = searchInResponse(tempValue.name, 0);
        hierarchy = replaceStringInArray(hierarchy, tempValue.name, event.target.value);

        let newNode = {
            name: event.target.value,
            parent: hierarchy
        };

        csInterface.evalScript("renameLabel(" + JSON.stringify(prevNode) + "," + JSON.stringify(newNode) + "," + JSON.stringify(history) + ")", function (e) {
            if (e === 'success') {
                tempValue.name = event.target.value;
                event.target.previousSibling.previousSibling.value = JSON.stringify(tempValue);
                event.target.previousSibling.textContent = event.target.value;

                sortDomItem(event.target.previousSibling);
                return true;
            }
        });
    }
    return false;
}

function sortDomItem (label){
    let parent = label.parentNode.parentNode;
    let nameStack = [];

    if (parent.classList.contains('itemParent'))
    {
        parent = parent.parentNode;
        for (let i = 0; i < parent.childNodes.length; i++)
        {
            nameStack.push(parent.childNodes[i].childNodes[0].childNodes[1].textContent);
        }
    }
    else
    {
        for (let i = 0; i < parent.childNodes.length; i++)
        {
            nameStack.push(parent.childNodes[i].childNodes[1].textContent);
        }
    }

    let sortIndex = 0;
    while (label.textContent >= nameStack[sortIndex] && sortIndex < nameStack.length)
    {
        sortIndex++;
    }
    sortIndex = sortIndex <= 0 ? 0: sortIndex--;

    if (parent.classList.contains('itemParent'))
    {
        parent.insertBefore(label.parentNode, parent.childNodes[sortIndex]);
    }
    else
    {
        parent.insertBefore(label.parentNode.parentNode, parent.childNodes[sortIndex]);
    }
}
/**
 * Creates hierarchy string of a given DOM Checkbox element
 * @param target - DOM Checkbox
 * @returns {string} << parent|child|child|target >>
 */
function discoverParentString(target) {
    let chain = [];
    while (target)
    {
        if (target.value)
        {
            let valueTemp = JSON.parse(target.value);
            if (valueTemp.name) {
                chain.push(valueTemp.name);
            }

            if (target.parentNode.parentNode.parentNode.firstChild.firstChild)
            {
                target = target.parentNode.parentNode.parentNode.firstChild.firstChild;
            }
            else
            {
                target = undefined;
            }
        }
        else
        {
            target = undefined;
        }
    }
    if (chain[0])
    {
        let outputString = "";
        for (let i = chain.length-1; i >= 0; i--)
        {
            outputString += chain[i] + ((i !== 0) ? "|":"");
        }
        return outputString;
    }
    return "";
}

/**
 * Generates an array of all hierarchy strings for parent and its children
 * @param parent - DOM Checkbox
 * @returns {Array} containing hierarchy strings -> [parent, parent|children]
 */
function generateHierarchy(parent) {
    let hierarchy = [], parentStack = [], parentPrefixStack = [];

    parentStack.push(parent);

    while (parentStack.length !== 0)
    {
        let currentParent = parentStack.pop();

        let hierarchyString = "";
        if (parent === currentParent)
        {
            hierarchyString = discoverParentString(currentParent);
        }
        else
        {
            let parentName = parentPrefixStack.pop();
            let tempValue = JSON.parse(currentParent.value);
            hierarchyString = (parentName === "" ? parentName : parentName + "|") + tempValue.name;
        }

        if (hierarchy.indexOf(hierarchyString) < 0)
        {
            hierarchy.push(hierarchyString);
        }

        if (currentParent.parentNode.nextSibling && currentParent.parentNode.nextSibling.childNodes)
        {
            for (let i = 0; i < currentParent.parentNode.nextSibling.childNodes.length; i++)
            {
                parentStack.push(currentParent.parentNode.nextSibling.childNodes[i].firstChild);
                parentPrefixStack.push(hierarchyString);
            }
        }
    }
    return hierarchy;
}

/**
 * Find all children names for a parent
 * @param parent - DOM Checkbox
 * @returns {Array} containing subject strings -> [parent, children]
 */
function findChildren(parent) {
    let subjects = [], parentStack = [];

    parentStack.push(parent);

    while (parentStack.length !== 0)
    {
        let currentParent = parentStack.pop();

        let subject = "";

        if (currentParent.value) {
            subject = (JSON.parse(currentParent.value)).name;
        }

        if (subjects.indexOf(subject) < 0)
        {
            subjects.push(subject);
        }

        if (currentParent.parentNode.nextSibling && currentParent.parentNode.nextSibling.childNodes)
        {
            for (let i = 0; i < currentParent.parentNode.nextSibling.childNodes.length; i++)
            {
                parentStack.push(currentParent.parentNode.nextSibling.childNodes[i].firstChild);
            }
        }
    }
    return subjects;
}

/**
 * Check parent checkbox and all its children checkboxes with the same value.
 * @param parent - DOM Checkbox
 * @param checked - value that is replaced within the checkboxes
 */
function checkChildCheckboxes(parent, checked) {
    let parentStack = [];

    parentStack.push(parent);

    while (parentStack.length !== 0)
    {
        let currentParent = parentStack.pop();

        if ('checked' in currentParent)
        {
            currentParent.checked = checked;
        }

        if (currentParent.parentNode.nextSibling && currentParent.parentNode.nextSibling.childNodes)
        {
            for (let i = 0; i < currentParent.parentNode.nextSibling.childNodes.length; i++)
            {
                parentStack.push(currentParent.parentNode.nextSibling.childNodes[i].firstChild);
            }
        }
    }
}

/**
 * Replaces strings insides of string array
 * @param arrayOfStrings - array containing only strings
 * @param previousStr - previous string
 * @param newStr - new string
 * @returns {Array} - new array of changed strings
 */
function replaceStringInArray(arrayOfStrings, previousStr, newStr) {
    let output = [];
    if (arrayOfStrings.length)
    {
        for (let i = 0; i < arrayOfStrings.length; i++)
        {
            output.push(arrayOfStrings[i].replace(previousStr, newStr));
        }
    }
    return output;
}

/**
 * Searches in response part of initialization object. Returns history object.
 * @param name (string)
 * @param property (int between 0,1)
 * @returns {*} history object {name: string, parent: boolean, property: string}
 */
function searchInResponse(name, property) {
    switch (property)
    {
        case 0: property = "terminate"; break;
        case 1: property = "suppress"; break;
        default: return {};
    }

    if (callResponse.response.length)
    {
        for (let i = 0; i < callResponse.response.length; i++)
        {
            if (callResponse.response[i].description === name)
            {
                return {name: name, parent: false, property: property};
            }
            if (callResponse.response[i].parents.length)
            {
                for (let j = 0; j < callResponse.response[i].parents.length; j++)
                {
                    if (callResponse.response[i].parents[j].name === name)
                    {
                        return {name: name, property: property};
                    }
                }
            }
        }
    }
    return {};
}




/*
@ToDo Update if data was changed external
 */


// fileName is a String (with the .jsx extension included)
function loadJSX(fileName) {
    var extensionRoot = csInterface.getSystemPath(SystemPath.EXTENSION) + "/jsx/";
    csInterface.evalScript('$.evalFile("' + extensionRoot + fileName + '")');
}



window.onload = function(event) {

    displayContent();
};