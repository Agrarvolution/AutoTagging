/**

 File zur Verwaltung aller Daten, die bei der Ver- und Bearbeitung der Tags anfallen

 */

//#include "js/libs/json2.js"
//#include "js/libs/promise.js"
//#include "VisionLabels.js"

//#include "AWS/RekognitionLabels.jsx"
//#include "CombineScript.jsx"
//#include "ModifyTags.jsx"
//#include "Label.js"
//#include "LabelList.js"

/*
function main()
{
    var imagePath = getImagePath();

    var labelList = new LabelList([], imagePath);

    findLabels(labelList);
}
*/

class DataManagement
{
    constructor()
    {
        statusMessageHandler.add("Opening DataManagement");
    }

    static startByClick()
    {
        statusMessageHandler.add("Started DataManagement Script through index.js");

        new DataManagement().findLabels(new LabelList());
    }

    findLabels(labelList)
    {
        let jsonAWS = this.sendToAWS(labelList.imagePath);
        let recognitionObject = this.handleRecognitionResponse(jsonAWS);

        statusMessageHandler.add(recognitionObject);
        /*

        old

        if (labelList.imagePath !== null && labelList.imagePath !== "")
        {

            var visionObject = handleVisionResponse(jsonVision);

            labelList.labels = CombineScript.getSingleList(recognitionObject, visionObject);

            alert(labelList.labels);
        }
        */
    }

    sendToAWS(imagePath)
    {
        let recognitionLabelsObject = new RecognitionLabels();
        return recognitionLabelsObject.getLabels(imagePath);
    }

    /**
     * responseJSON gets parsed and the object is checked, whether the result is a valid Amazon Rekognition response.
     * @return empty array or array map with the description and confidence of the found tags
     * @param responseJSON
     */
    handleRecognitionResponse(responseJSON)
    {
        let recognitionObject = JSON.parse(responseJSON);
        let tagArray = [];

        // check validity
        if (!recognitionObject.Labels)
        {
            return [];
        }


        for (let i = 0; i < recognitionObject.Labels.length; i++)
        {
            let responsePart = recognitionObject.Labels[i];
            if (recognitionObject.Labels[i].Name && recognitionObject.Labels[i].Confidence && recognitionObject.Labels[i].Parents)
            {
                let parents = [];
                for (var pIndex = 0; pIndex < recognitionObject.Labels[i].Parents.length; pIndex++)
                {
                    parents.push = recognitionObject.Labels[i].Parents[pIndex];
                }

                if (responsePart.Name === 'string' || responsePart.Name instanceof String)
                {
                    let labelNew = new Label(recognitionObject.Labels[i].Name, recognitionObject.Labels[i].Confidence, parents);
                    labelNew.clamp();
                    labelNew.sanitize();
                    tagArray.push(labelNew);
                }
            }
            else if (recognitionObject.Labels[i].Name && recognitionObject.Labels[i].Confidence)
            {
                if (responsePart.Name === 'string' || responsePart.Name instanceof String)
                {
                    let labelNew = new Label(recognitionObject.Labels[i].Name, recognitionObject.Labels[i].Confidence, []);
                    labelNew.clamp();
                    labelNew.sanitize();
                    tagArray.push(labelNew);
                }
            }
        }
        return tagArray;
    }
}







/**
 * Exports the selected image(s) and returns the absolute path to the copy or creates a list of files to tag if multiple images are selected
 */
function getImagePath()
{
    var imagePath = "C:/AutoTagging/tempImage.jpg";

    /*
    Handler for multiple selected images

    var selectedFiles = app.document.selections;

    for (var i = 0; i < selectedFiles.length; i++)
    {

    }
    */

    //var currentPreviewFile = app.document.selections[0].core.preview.preview;
    //currentPreviewFile.exportTo (imagePath, 10);

    return imagePath;
}

function sendToVision(imagePath)
{
    //return visionLabelScript.getLabels(imagePath);
    return [];
}

/**
 * reponseJSON gets parsed and the object is checked, whether the result is a valid Google Vision response.
 * @return empty array or array map with the description and confidence of the found tags
 * @param {string} reponseJSON 
 */
function handleVisionResponse(responseJSON) 
{
    var visionObject = secureParseJSON(responseJSON);
    var tagArray = [];

    // check validity
    if (!visionObject.responses) 
    {
        return [];
    }
    else if (!visionObject.responses[0].labelAnnotations) 
    {
        return [];
    }


    for (var i = 0; i < visionObject.responses[0].labelAnnotations.length; i++) 
    {
        var responsePart = visionObject.responses[0].labelAnnotations[i];
        if (responsePart.description && responsePart.score)
        {
            if (responsePart.description === 'string' || responsePart.description instanceof String)
            {
                var labelNew = new Label(responsePart.description, responsePart.score, []);
                labelNew.clamp();
                labelNew.sanitize();
                tagArray.push(labelNew);
            }
        }
    }

    return tagArray;
}









// TODO: Event handler anbinden, der onSelectionChanged das script startet

//main();


//module.exports = DataManagement;