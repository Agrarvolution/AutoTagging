/**
 *
 *
 *      Status message
 *
 *  This class can set and manage a various amount of status messages to display information to the user.
 */

function StatusMessage()
{
    this.messages = [];
}

StatusMessage.prototype.add = function(message)
{
    var nrOfMessagesDisplayed = 5;

    if (!this.messages)
    {
        this.messages = [nrOfMessagesDisplayed];
    }

    if (this.messages.length >= nrOfMessagesDisplayed)
    {
        this.messages.shift();
    }

    this.messages.push(message);

    this.write();
};

StatusMessage.prototype.write = function()
{
    /**
     * Messages going to the void in usual mode
     * those messages were for debug purpose during development
     */
    //var offlineMessage = document.getElementById('offline_message');
    //offlineMessage.innerHTML = this.messages.join("<br>");
};

StatusMessage.prototype.set = function (message)
{
    csInterface.evalScript("sendStatusMessage(\"" + message + "\")", function (e) {

    });
};