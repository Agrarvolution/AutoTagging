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

ServerCommunication.prototype.startLabeling = function()
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

ServerCommunication.prototype.handleLabels = function(serverResponse)
{
    var labels = serverResponse["Labels"];
    var output = "";

    labels.forEach(function (element) {
        output += "<br>" + element["Name"] + ", " + element["Confidence"];
    });

    statusMessageHandler.add("Found labels: " + output);



    var tagArray = dataManagement.handleRecognitionResponse(serverResponse);


};