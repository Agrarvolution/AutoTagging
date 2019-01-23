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

}

ServerCommunication.prototype.startLabeling = function(imagePath)
{
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

            new ServerCommunication().handleLabels(ServerResponse, imagePath);
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
 * @param {String} selectedImagePath
 * @param {Object} serverResponse.dataAWS
 * @param {Object} serverResponse.dataVision
 * @param {Array} serverResponse.dataVision.labelAnnotations
 */
ServerCommunication.prototype.handleLabels = function(serverResponse, selectedImagePath)
{
    var labelsAWS = serverResponse.dataAWS["Labels"];
    var labelsVision = serverResponse.dataVision[0].labelAnnotations;
    var output = "";

    output += "Amazons labels:<br>========================<br>";
    labelsAWS.forEach(function (element) {
        output += "<br>" + element["Name"] + ", " + element["Confidence"];
    });

    output += "<br>========================<br>Google's labels:<br>========================<br>";
    if (typeof labelsVision !== 'undefined')
    {
        labelsVision.forEach(function (element) {
            output += "<br>" + element.description + ", " + element.score;
        });
    }

    statusMessageHandler.add("Found labels: " + output);



    var combineScript = new CombineScript();
    var labelList = combineScript.getSingleList(serverResponse.dataVision, serverResponse.dataAWS);

    var labelListString = JSON.stringify(labelList);

    csInterface.evalScript("writeTags(" + JSON.stringify(selectedImagePath) + ", " + JSON.stringify(labelList) + ")", function (koe) {
        statusMessageHandler.add(koe);
    });
};