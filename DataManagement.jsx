/**

 File zur Verwaltung aller Daten, die bei der Ver- und Bearbeitung der Tags anfallen

 */

#include 'EventManager.jsinc'
#include "js/libs/json2.js"  

var jsonAWS;
var jsonVision;

function main(path)
{
    var image = getImage(path);

    jsonAWS = sendToAWS(path);
    jsonVision = sendToVision(path);


}

function getImagePath()
{

}

function findLabels()
{
    
}

function sendToAWS(image)
{

}

function sendToVision(image)
{

}












main(path);