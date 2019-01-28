function Label(name, confidence, parents)
{
    this.name = name;
    this.confidence = confidence;
    this.parents = parents;

    this.clamp();
    this.sanitize();
}

Label.prototype.square = function()
{
    //noinspection JSUnresolvedFunction
    this.confidence *= this.confidence;

    this.clamp();
};

Label.prototype.clamp = function()
{
    this.confidence = Math.min(Math.max(parseFloat(this.confidence), 0), 1);
};

Label.prototype.sanitize = function()
{
    
};
