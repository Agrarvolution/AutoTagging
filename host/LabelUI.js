#include "js/libs/json2.js"  

class Label
{
    constructor(name, confidence, children)
    {
        this.name = name;
        this.confidence = confidence;
        this.children = children;
    }
    
    toJSON()
    {
        return JSON.stringify(this);
    }
    
    square()
    {
        this.confidence *= this.confidence;
    
        this.clamp();
    }
    
    clamp()
    {
        this.confidence = Math.min(Math.max(parseFloat(this.confidence), 0), 1);
    }
    
    sanitize()
    {
        
    }



    get children()
    {
        return this.children;
    }

    get confidence()
    {
        return this.confidence;
    }

    set confidence(confidence)
    {
        this.confidence = confidence;
    }

    get name()
    {
        return this.name;
    }

    set name(name)
    {
        this.name = name;
    }

    addChild(child)
    {
        this.children.push(child);
    }
}