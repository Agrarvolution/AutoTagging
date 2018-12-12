/*
@Todo Load items from JSX [JSON]
written tags -> flat & parented
discovered tags -> as json object [must be sorted by confidence] check again?

return JSON string / parsed object
 */
function loadContent()
{
    /*
    response part, written part (=user defined), version history
    {
        response: "",
        saved: "",
        history: "",
    }
    reverse order compared to data management -> parent: [children] instead of child: [parents]
     */


    // placeholder -> replace by call to jsx & XMP parser
    var answer = '{"response":[{"description":"dog","confidence":0.8858542056,"parents":[\n' +
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
        '],"ticked":false}],"version":""}';


    var content = JSON.parse(answer);
    return content;
}

/*
@Todo Display JSON items
call parenting and create single item
 */

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

/*
@Todo Create Single Item
setup checkup checkbox -> ticked if already written
unticked if only in source array
 */

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
Group:
    single click - drag event
    blur - drop element where it hovered over last (highlight to which object it will be attached)
        - enable attaching either to item (parenting - make new subgroup & dropdown) or in between items
        - schedule write event - change tags & parenting

 */

/*
@ToDo Update if data was changed external
 */