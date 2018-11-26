/**

 File zur Verwaltung aller Daten, die bei der Ver- und Bearbeitung der Tags anfallen

 */



var jsonAWS;
var jsonVision;

function main()
{
    var path = "";
    var image = getImage(path);

    jsonAWS = sendToAWS(image);
    jsonVision = sendToVision(image);


}

function getImage(path)
{
    var reader = new FileReader();
    reader.onload = function(event)
    {
        Console.log(event.target.result);
    };

    //reader.readAsDataURL(selectedFile);

}

function sendToAWS(image)
{

}

function sendToVision(image)
{

}












main();