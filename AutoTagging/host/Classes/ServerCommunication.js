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
    var ServerUrl = "http://localhost:3200/testConnections";

    statusMessageHandler.add("Testing the connection to the web services");

    if (typeof $ === 'undefined' || $ === null || $ === 'undefined')
    {
        statusMessageHandler.add("Initial load of plugin failed! Attempting to reload.");

        location.reload(true);
    }

    /* Use ajax to communicate with your server */
    $.ajax({
        type: "GET",
        url: ServerUrl,
        success: function (ServerResponse)
        {
            var output = "Amazon Rekognition: " + (ServerResponse.awsConnection ? "connected" : "connection failed") +
                "<br>Google Vision: " + (ServerResponse.visionConnection ? "connected" : "connection failed");
            statusMessageHandler.add(output);

            //responseEvent.data = ServerResponse;
            //responseEvent.dispatchEvent(responseEvent);
            //responseEvent.dispatch();

        },
        error: function(jqXHR, textStatus, errorThrown)
        {
            //responseEvent.data = { Response: "Something went wrong on the server side\r\n" + jqXHR + "\r\n" + errorThrown };
            //responseEvent.dispatch();
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
    var awsObject = serverResponse.dataAWS;
    var visionObject = serverResponse.dataVision;
    var output = "";

    if (awsObject !== 'undefined' && awsObject !== -1)
    {
        var labelsAWS = serverResponse.dataAWS["Labels"];

        output += "Amazons labels:<br>========================<br>";
        labelsAWS.forEach(function (element) {
            output += "<br>" + element["Name"] + ", " + element["Confidence"];
        });
    }
    else
    {
        output += "Communication with Amazon failed!";

        awsObject = {};
    }

    if (visionObject !== 'undefined' && visionObject !== -1)
    {
        var labelsVision = serverResponse.dataVision[0].labelAnnotations;

        output += "<br>========================<br>Google's labels:<br>========================<br>";
        if (typeof labelsVision !== 'undefined')
        {
            labelsVision.forEach(function (element) {
                output += "<br>" + element.description + ", " + element.score;
            });
        }
    }
    else
    {
        output += "<br><br><br>Communication with Google failed!";

        visionObject = {};
    }


    statusMessageHandler.add("Result: " + output);



    var combineScript = new CombineScript();
    var labelList = combineScript.getSingleList(visionObject, awsObject);

    var labelListString = JSON.stringify(labelList);

    csInterface.evalScript("writeTags(" + JSON.stringify(selectedImagePath) + ", " + JSON.stringify(labelList) + ")", function (koe) {
        statusMessageHandler.add(koe);
    });
};