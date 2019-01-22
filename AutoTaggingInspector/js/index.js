"use strict";

// Get a reference to a CSInterface object
let csInterface = new CSInterface();
loadJSX("js/libs/json2.js");
let callResponse = {};

/**
 * Setups context menu and its item listeners.
 */
setupContextMenu();

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

    let ctxMenuTarget = document.getElementsByClassName('html')[0];
    //general context menu listener
    $('html').contextmenu(function(event) {
        if (event.target.parentNode !== document && event.target.parentNode.classList.contains('itemSingle'))
        {
            let contextMenuOpen = new Event('contextMenuOpen', {
                bubble: true,
                details: event
            });
            ctxMenuTarget = event.target.parentNode;
            event.target.parentNode.dispatchEvent(contextMenuOpen);
        }
        else
        {
            ctxMenuTarget = event.target;
            disableContextMenuItems();
        }

    });
    /**
     * handles add method from context menu
     * might be a better template to handle contextmenu events
     */
    $(document).on('add', function (event) {
        if (ctxMenuTarget.classList.contains('itemSingle')) {
            let addItemEvent = new Event('addNewItem', {
                bubble: true,
                details: event
            });
            ctxMenuTarget.dispatchEvent(addItemEvent);
        } else {
            addNewItem(document.getElementById('tags'));
        }
    });
}

/**
 * Disables content menu items (called if context menu is opened on not inside of .itemSingle)
 */
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

/**
 * Rebuilds html incase it was wiped.
 */
function rebuildHtml() {
    let contentDOMTarget = document.getElementById('tags');
    if (contentDOMTarget === undefined && contentDOMTarget == null)
    {
        let disableMessage = document.createElement('p');
        disableMessage.textContent = "No image selected / no tags are available for this image!";
        disableMessage.id = 'help';

        contentDOMTarget = document.createElement('main');
        contentDOMTarget.classList.add('tags');
        let body = document.createElement('body');
        body.appendChild(disableMessage);
        body.appendChild(contentDOMTarget);

        (document.getElementsByName('html'))[0].appendChild(body);
    }
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
    //let content = JSON.parse(answer);
    //Enable for SendMetaDataHandler events
    if (event.data && event.data.type)
    {
        //Handles AutoTaggingCustomBridgeEvents
        loadXMPContent();
    }
    else if (event.data)
    {
        //Handles for SendMetaDataHandler events
        callResponse = event.data;
        displayContent(event.data.content);
    }

    return 0;
}

/**
 * Listener if 'updateGUI' occures and calls display method.
 */
function guiUpdateListener()
{
    $('body').on('updateGUI', function (event) {
        displayContent(callResponse.content);
    });
}

/**
 * Reset content.
 * @param tag {HTMLElement}
 */
function resetContent(tag)
{
    tag.innerHTML = "";
}

/**
 * Toggles help text.
 * Calls create items. Adds them to .tags
 *
 * @param response {Object}
 */
function displayContent(response)
{
    //let fullResponse = loadContentListener();
    //let content = fullResponse.content;

    toggleHelpText((!response));

    let newContent = createItems(response);

    let body = $('body');
    body.children('#tags').remove();
    body.append(newContent);

    setupEventListeners();
}

/**
 * Toggles visibility of help text and tags.
 * @param show {boolean}
 */
function toggleHelpText(show)
{
    let text = $('#help');
    let tags = $('#tags');
    if (show)
    {
        text.removeClass('hidden');
        tags.addClass('hidden');
    }
    else
    {
        text.addClass('hidden');
        tags.removeClass('hidden');
    }
}

/**
 * Creates all items for a given response.
 * @param response from callResponse.response
 * @returns {HTMLElement}
 */
function createItems(response)
{
    let contentDOMTarget = document.createElement('main');
    contentDOMTarget.id = 'tags';

    if (response !== undefined && response != null && response.length) {
        let parentStack = [];
        let responseArrayStack = [];

        parentStack.push(contentDOMTarget);
        responseArrayStack.push(response);

        while (parentStack.length !== 0) {
            let itemNode = parentStack.pop();
            let itemArray = responseArrayStack.pop();

            for (let i = 0; i < itemArray.length; i++) {
                let group = document.createElement('section');
                group.classList.add('itemParent');
                group.appendChild(createItem(itemArray[i]));

                if (itemArray[i].children.length > 0) {
                    let parent = document.createElement('div');
                    parent.classList.add('items');

                    group.appendChild(parent);

                    responseArrayStack.push(itemArray[i].children);
                    parentStack.push(parent);
                }
                itemNode.appendChild(group);
            }
        }
    }
    return contentDOMTarget;
}

/**
 * Create new empty item and append it to the parent children.
 * @param parent .tags / .items
 */
function addNewItem(parent) {
    let group = document.createElement('section');
    group.classList.add('itemParent');
    group.appendChild(createItem({name: "", confidence: 1, ticked: false})); //create empty item template
    parent.appendChild(group);

    $(group).children('.itemSingle').children('.itemLabel').addClass('hidden').parent()
        .children('.itemChange').removeClass('hidden').focus().blur(function (event)
    {
        event.target.value = removeSpecialChars(event.target.value);
        if (event.target.value === "")
        {
            $(this).parent().parent().remove();
        }
        else
        {
            let value = JSON.parse(event.target.previousSibling.previousSibling.value);
            value.name = event.target.value;
            event.target.previousSibling.previousSibling.value = JSON.stringify(value);

            let newNode = {
                name: "", //empty because it is not ticked by default -> //name: event.target.value (then ticked by default)
                parent: generateHierarchy(event.target.previousSibling.previousSibling)
            };
            csInterface.evalScript("renameLabel(" + JSON.stringify(
                {name: "", parent: []}) + "," +
                JSON.stringify(newNode) + "," + JSON.stringify([]) + ")",
                function (e) {
                alert(e);
                if (e === 'success') {
                    $(this).addClass('hidden').prev().removeClass('hidden').html(event.target.value);
                    sortDomItem(event.target.previousSibling);
                    setupEventListeners();
                }
                else
                {
                   event.target.focus();
                }
            });
        }
    }).keydown(function (e) {
        if (e.which === 13) {
            $(this).blur();
        }
    });

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

    $('.itemLabel').dblclick(function (e) {
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
    $('.itemSingle').click(toggleChildrenProcessing).on('contextMenuOpen', function (e) {
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
            $(e.target).children('.itemCheckbox').trigger('dblclick');
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
    }).on('addNewItem', function (event) {
        let parent;
        if (event.target.parentNode.childNodes[1] && event.target.parentNode.childNodes[1].classList.contains('items'))
        {
            parent = event.target.childNodes[1];
        }
        else
        {
            parent = document.createElement('div');
            parent.classList.add('items');
            event.target.parentNode.appendChild(parent);
        }
        addNewItem(parent);
    });
}

/**
 * Toggles visibility of .items
 * @param event .itemSingle
 * @returns {boolean}
 */
function toggleChildrenProcessing (event) {
    //disbale checkbox from hiding content
    if (!event.target.classList.contains('itemCheckbox'))
    {
        $(event.target).parent().parent().children('.items').toggleClass('hidden');
        return true;
    }
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
    return true;
}

/**
 * Removes selected item from DOM and XMP metadata.
 * @param event target = .itemSingle
 */
function removeLabel(event) {
    let targetCheckbox = $(event.target).children('.itemCheckbox');

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
        event.target.value = removeSpecialChars(event.target.value);
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

/**
 * Sorts one .itemParent node in parenting node ascending.
 * @param label { Object } - childNode[1] of .itemSingle}
 */
function sortDomItem (label){
    let parent = label.parentNode.parentNode.parentNode;
    let nameStack = [];

    for (let i = 0; i < parent.childNodes.length; i++)
    {
        nameStack.push(parent.childNodes[i].childNodes[0].childNodes[1].textContent);
    }

    let sortIndex = 0;
    while (label.textContent >= nameStack[sortIndex] && sortIndex < nameStack.length)
    {
        sortIndex++;
    }
    sortIndex = sortIndex <= 0 ? 0: sortIndex--;

    parent.insertBefore(label.parentNode, parent.childNodes[sortIndex]);
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

            if (target.parentNode.parentNode.parentNode.parentNode && target.parentNode.parentNode.parentNode.parentNode.firstChild.firstChild)
            {
                target = target.parentNode.parentNode.parentNode.parentNode.firstChild.firstChild;
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
                parentStack.push(currentParent.parentNode.nextSibling.childNodes[i].firstChild.firstChild);
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
                parentStack.push(currentParent.parentNode.nextSibling.childNodes[i].firstChild.firstChild);
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
                parentStack.push(currentParent.parentNode.nextSibling.childNodes[i].firstChild.firstChild);
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

/**
 * Loads additional jsx ressources from jsx folder in the extension root.
 * fileName is a String (with the .jsx extension included)
 * @param fileName {string}
 */
function loadJSX(fileName) {
    var extensionRoot = csInterface.getSystemPath(SystemPath.EXTENSION) + "/jsx/";
    csInterface.evalScript('$.evalFile("' + extensionRoot + fileName + '")');
}

/**
 * Removes html special chars
 * @param str
 * @returns {string}
 */
function removeSpecialChars(str)
{
    return String(str).replace(/[&\/\\#,().'":?<>{}]/g, '')
}

/**
 * Replaces html special chars
 * @param str
 * @returns {string}
 */
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}


window.onload = function(event) {
    displayContent();
};

$(document).ready(function (e) {
    rebuildHtml();
    guiUpdateListener();
    loadXMPContent(); // first call after refresh / crash
});