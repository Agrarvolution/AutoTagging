/**
 * Create Instances of all commonly used classes
 *
 */
//var csInterface = new CSInterface();
var statusMessageHandler = new StatusMessage();
var serverCommunication = new ServerCommunication();
var dataManagement = new DataManagement();

var lastSelectedImage = "";

// ----------------------------------------------------------
// internet connection is required to access the AWS and Google Vision services
document.onload = init();

/**
 * @description Hides the 'no internet connection' error message overlay and displays the content
 */
function removeOfflineOverlay()
{
    // hide the error message
    var offline_message = document.getElementById('offline_message');
    offline_message.classList.add('hidden');
    // and show the content
    var content = document.getElementById('content');
    content.classList.remove('hidden');
}

/**
 * @description Sets up the environment. Checks whether AWS and Google are logged in or not, and updates the UI accordingly
 */
function init()
{
    statusMessageHandler.set("loading plugin");

    AWS_selected = false;
    Vision_selected = false;

    registerEventHandler();

    setTimeout(function reloadJS()
    {
        if (typeof $ === 'undefined' || $ === null || $ === 'undefined')
        {
            statusMessageHandler.add("Initial load of plugin failed! Attempting to reload.");

            location.reload(true);
        }
        else
        {
            statusMessageHandler.set("Successfully loaded plugin!");
        }
    }, 500);
}

function registerEventHandler()
{
    csInterface.addEventListener("updateAutoTagInspector", catchSelectionEvent);

    csInterface.evalScript("registerEventHandler()", function (e) {
        statusMessageHandler.add(e);
    });
}

function catchSelectionEvent(event)
{
    statusMessageHandler.add("registering a click event");
    var imagePath = event.data.selectedImage;
    var type = event.data.selectionType;
    var fileType = event.data.fileType;

    if (type !== 'folder' && lastSelectedImage !== imagePath && imagePath !== "")
    {
        lastSelectedImage = imagePath;
        serverCommunication.startLabeling(imagePath);
    }
    //serverCommunication.testServerConnection();
}

/**
 * Sanitation method for a single string
 * @param {string} text
 */
function sanitizeString(text)
{
    return text.replace("/[/\\<>|,.;:%{}()\[\]#\'\"&?~*+\-_!@`´^]/gi", "").replace("\(^[\s\n\r\t\x0B]+)|([\s\n\r\t\x0B]+$)/g", "");
}