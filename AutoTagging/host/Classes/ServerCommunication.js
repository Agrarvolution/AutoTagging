/**
 *
 *
 *
 *      Server communication
 *
 *  This class grants the interface to the in the background running Node.js server and catches its response.
 *
 */

function ServerCommunication()
{
    this.latestMetaData = "";
}

ServerCommunication.prototype.startLabeling = function(metaData)
{
    this.latestMetaData = metaData;
    var ServerUrl = "http://localhost:3200/tagImage";
    statusMessageHandler.add("Sending a request to the server");
    statusMessageHandler.add("Waiting for the servers response");
    /* Use ajax to communicate with your server */
    $.ajax({
        type: "GET",
        url: ServerUrl,
        success: function (ServerResponse)
        {
            statusMessageHandler.add("Labels found!");

            new ServerCommunication().handleLabels(ServerResponse);
        },
        error: function(jqXHR, textStatus, errorThrown)
        {
            //responseEvent.data = { Response: "Something went wrong on the server side\r\n" + jqXHR + "\r\n" + errorThrown };
            //responseEvent.dispatch();
        }
    })
};

ServerCommunication.prototype.testServerConnection = function()
{
    var ServerUrl = "http://localhost:3200/test";
    var responseEvent = new Event('AWSResponse');
    statusMessageHandler.add("Sending a request to the server");
    /* Use ajax to communicate with your server */
    $.ajax({
        type: "GET",
        url: ServerUrl,
        success: function (ServerResponse)
        {
            responseEvent.data = ServerResponse;
            responseEvent.dispatchEvent(responseEvent);
            //responseEvent.dispatch();

            //statusMessageHandler.add(ServerResponse);
        },
        error: function(jqXHR, textStatus, errorThrown)
        {
            responseEvent.data = { Response: "Something went wrong on the server side\r\n" + jqXHR + "\r\n" + errorThrown };
            responseEvent.dispatch();
        }
    })
};

/**
 *
 * @param {Object} serverResponse
 * @param {Object} serverResponse.dataAWS
 * @param {Object} serverResponse.dataVision
 * @param {Array} serverResponse.dataVision.labelAnnotations
 */
ServerCommunication.prototype.handleLabels = function(serverResponse)
{
    var labelsAWS = serverResponse.dataAWS["Labels"];
    var labelsVision = serverResponse.dataVision.labelAnnotations;
    var output = "";

    output += "Amazons labels:<br>========================<br>";
    labelsAWS.forEach(function (element) {
        output += "<br>" + element["Name"] + ", " + element["Confidence"];
    });

    output += "<br>========================<br>Google's labels:<br>========================<br>";
    if (typeof labelsVision !== 'undefined')
    {
        labelsVision.forEach(function (element) {
            output += "<br>" + element["Name"] + ", " + element["Confidence"];
        });
    }

    statusMessageHandler.add("Found labels: " + output);



    var combineScript = new CombineScript();
    var labelList = combineScript.getSingleList(serverResponse.dataVision, serverResponse.dataAWS);

    csInterface.evalScript("writeTags(" + JSON.stringify(this.latestMetaData) + ", " + labelList + ")");

};