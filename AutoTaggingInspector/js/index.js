// Get a reference to a CSInterface object
var csInterface = new CSInterface();

// Add an event listener to update the background colour of Extension to match the Bridge Theme.
csInterface.addEventListener("com.adobe.csxs.events.ThemeColorChanged", themeChangedEventListener);
csInterface.addEventListener("updateAutoTagInspector", loadContentListener);

/*
try {
    csInterface.evalScript(testLet("CEP"));
} catch (e)
{
    alert(e);
}*/


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

    if ("#535353" != colorRGB) /* "#535353" is the original color */
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
    /*
    response part, written part (=user defined), version history
    {
        response: "",
        content: "",
        history: "",
    }
    reverse order compared to data management -> parent: [children] instead of child: [parents]
     */


    // placeholder -> replace by call to jsx & XMP parser
    let answer = '{"response":[{"description":"dog","confidence":0.8858542056,"parents":[\n' +
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


    //let content = JSON.parse(answer);
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

    resetContent(contentDOMTarget);
    if (response)
    {
        for(let i = 0; i < response.length; i++)
        {
            contentDOMTarget.appendChild(createParentItem(response[i]));
        }
    }

}

function toggleHelpText(show)
{
    let text = document.getElementById('help');
    if (show)
    {
        text.classList.remove('hidden');
    }
    else
    {
        text.classList.add('hidden');
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
    let tag = document.createElement('p');
    tag.classList.add('itemSingle');
    let checkbox = document.createElement('input');
    checkbox.classList.add('centerItems', 'centerItemCheckbox');
    checkbox.type = 'checkbox';
    checkbox.value = item.name;
    checkbox.checked = item.ticked;
    let label = document.createElement('label');
    label.classList.add('centerItems');
    label.appendChild(document.createTextNode(item.name + " | " + Math.round(item.confidence*100)));
    tag.appendChild(checkbox);
    tag.appendChild(label);

    return tag;
}
/*
@ToDo Process Template / Load Template
 */



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

/*
@ToDo Update if data was changed external
 */




window.onload = function(event) {
    displayContent();
};