/* 1) Create an instance of CSInterface. */
var csInterface = new CSInterface();
var statusMessageHandler = new StatusMessage();
var serverCommunication = new ServerCommunication();

csInterface.requestOpenExtension("com.AutoTagging.localServer");

// ==========================================================
// ----------------------------------------------------------

/* YOUR CLIENT-SIDE CODE HERE */
/* anything that doesn't involve the host application’s functionalities, such as opening a document, editing it, exporting it, and almost anything
 else the host application can do */

var AWS_loggedIn; // global variable on whether AWS is logged in or not
var AWS_selected; // global variable on whether AWS is selected (checked) or not

var Vision_loggedIn; // global variable on whether Google Vision is logged in or not
var Vision_selected; // global variable on whether Google Vision is selected (checked) or not

var imagePath = "C:/AutoTagging/tempImage.jpg";

// ----------------------------------------------------------
// internet connection is required to access the AWS and Google Vision services
if (navigator.onLine === true) {
    // setup global variables and update the UI
    init();
    
    // as a last step - system is online; thus, do not display the error message
    removeOfflineOverlay();
    
    var start_button = document.getElementById('button_start');
    start_button.onclick = CEP_startLabeling;
}

/**
 * @description Hides the 'no internet connection' error message overlay and displays the content
 */
function removeOfflineOverlay() {
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
    AWS_selected = false;
    Vision_selected = false;

    registerEventHandler();

    //CEP_checkIfAWSLoggedIn();
    //TODO: check if Vision logged in
    
    updateUI();
}

function registerEventHandler()
{
    csInterface.addEventListener("updateAutoTagInspector", catchSelectionEvent);
    csInterface.addEventListener("AWSResponse", catchResponseEvent);
}

function catchSelectionEvent(event)
{
    statusMessageHandler.add("registering a click event");
    serverCommunication.startLabeling();
}

function catchResponseEvent(event)
{
    statusMessageHandler.add(event.data);
}

function updateUI() {
    setAWSCheckboxListener();
    if (!AWS_loggedIn) {
        //TODO: do stuff
    } else {
    
    }
    
    if (!Vision_loggedIn) {
        //TODO: do stuff
    }
}

function setAWSCheckboxListener() {
    // get img#AWS_checkbox element
    var AWS_checkbox = document.getElementById('AWS_checkbox');
    
    AWS_checkbox.onclick = function () {
        // if checkbox is not disabled
        if (!AWS_checkbox.classList.contains('disabled')) {
            if (AWS_checkbox.classList.contains('enabled')) {
                AWS_checkbox.classList.remove('enabled');
                AWS_checkbox.classList.add('checked');
                AWS_checkbox.setAttribute('src', 'img/checkbox_checked.png');

                AWS_selected = true;
            }
            if (AWS_checkbox.classList.contains('checked')) {
                AWS_checkbox.classList.remove('checked');
                AWS_checkbox.classList.add('enabled');
                AWS_checkbox.setAttribute('src', 'img/checkbox.png');
                
                AWS_selected = false;
            }
        }
    };
}

// ----------------------------------------------------------
// ==========================================================
// ----------------------------------------------------------

/* 3) Write a helper function to pass instructions to the ExtendScript side. */

/**
 * @description Updates the boolean value for AWS_loggedIn depending on whether the user is logged in with valid credentials, or not
 */
function CEP_checkIfAWSLoggedIn()
{
    var aws_access_key_id;
    var aws_secret_access_key;
    csInterface.evalScript("checkAWSCredentials(" + aws_access_key_id + ", " + aws_secret_access_key + ")", function (result) {
        AWS_loggedIn = result;
    });
}

function CEP_startLabeling() {
    csInterface.evalScript("startLabelDetection()");
}

/**
 * Sanitation method for a single string
 * @param {string} text
 */
function sanitizeString(text)
{
    return text.replace("/[/\\<>|,.;:%{}()\[\]#\'\"&?~*+\-_!@`´^]/gi", "").replace("\(^[\s\n\r\t\x0B]+)|([\s\n\r\t\x0B]+$)/g", "");
}



/**
 *
 *
 *      Status message
 *
 *  This class can set and manage a various amount of status messages to display information to the user.
 */

function StatusMessage()
{
    messages = [];
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
    var offlineMessage = document.getElementById('offline_message');
    offlineMessage.innerHTML = this.messages.join("<br>");
};


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
    /* Make sure to include the full URL */
    ServerUrl = "http://localhost:3200/tagImage";
}

ServerCommunication.prototype.startLabeling = function()
{
    //var responseEvent = new Event('AWSResponse');
    statusMessageHandler.add("Sending a request to the server");
    /* Use ajax to communicate with your server */
    $.ajax({
        type: "GET",
        url: this.ServerUrl,
        success: function (ServerResponse)
        {
            //responseEvent.data = ServerResponse;
            //responseEvent.dispatch();

            statusMessageHandler.add(JSON.stringify(ServerResponse));
        },
        error: function(jqXHR, textStatus, errorThrown)
        {
            //responseEvent.data = { Response: "Something went wrong on the server side\r\n" + jqXHR + "\r\n" + errorThrown };
            //responseEvent.dispatch();
        }
    })
};