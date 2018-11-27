#include "js/libs/json2.js"  

function Label(name, confidence, parents)
{
    this.name = name;
    this.confidence = confidence;
    this.parents = parents;
}

Label.prototype.toJSON = function()
{
    var parentsJSON = { parents : [] };

    for (var i = 0; i < this.parents.length; i++)
    {
        const currentParentJSON = this.parents[i].toJSON();
        
        parentsJSON.parents.concat(currentParentJSON);
    }

    return JSON.stringify({name : this.name, confidence : this.confidence, parents : parentsJSON});
}

Label.prototype.square = function()
{
    this.confidence *= this.confidence;

    this.clamp();
}

Label.prototype.clamp = function()
{
    this.confidence = Math.min(Math.max(parseFloat(this.confidence), 0), 1);
}

Label.prototype.sanitize = function()
{
    
}