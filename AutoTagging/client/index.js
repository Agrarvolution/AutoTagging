/* 1) Create an instance of CSInterface. */
var csInterface = new CSInterface();

alert("alert before import");

//import startScript from '../host/DataManagement.jsx';

// ==========================================================
// ----------------------------------------------------------

/* YOUR CLIENT-SIDE CODE HERE */
/* anything that doesn't involve the host application’s functionalities, such as opening a document, editing it, exporting it, and almost anything
 else the host application can do */

var AWS_loggedIn; // global variable on whether AWS is logged in or not
var AWS_selected; // global variable on whether AWS is selected (checked) or not

var Vision_loggedIn; // global variable on whether Google Vision is logged in or not
var Vision_selected; // global variable on whether Google Vision is selected (checked) or not

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

function catchSelectionEvent(event)
{
    var offlineMessage = document.getElementById('offline_message');
    let eventData = event.data;
    offlineMessage.textContent = eventData.description;

    var imagePath = "C:/AutoTagging/tempImage.jpg";
    var currentPreviewFile = eventData.thumbnail;
    //currentPreviewFile.exportTo (imagePath, 10);
    //alert(event.data);
    //startScript();
}

/**
 * @description Sets up the environment. Checks whether AWS and Google are logged in or not, and updates the UI accordingly
 */
function init() {
    AWS_selected = false;
    Vision_selected = false;

    registerEventHandler();

    CEP_checkIfAWSLoggedIn();
    //TODO: check if Vision logged in
    
    updateUI();
}

function registerEventHandler()
{
    csInterface.addEventListener("updateAutoTagInspector", catchSelectionEvent);
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
                AWS_checkbox.setAttribute('src', 'img/checkbox_checked.png')
                
                AWS_selected = true;
            }
            if (AWS_checkbox.classList.contains('checked')) {
                AWS_checkbox.classList.remove('checked');
                AWS_checkbox.classList.add('enabled');
                AWS_checkbox.setAttribute('src', 'img/checkbox.png')
                
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
function CEP_checkIfAWSLoggedIn() {
    var aws_access_key_id;
    var aws_secret_access_key;
    csInterface.evalScript("checkAWSCredentials(" + aws_access_key_id + ", " + aws_secret_access_key + ")", function (result) {
        AWS_loggedIn = result;
    });
}

function CEP_startLabeling() {
    csInterface.evalScript("startLabelDetection()");
}