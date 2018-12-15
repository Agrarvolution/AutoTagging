function VisionScript()
{

}


// Imports the Google Cloud client library
const vision = require('@google-cloud/vision');

VisionScript.prototype.getLabels = function(imagePath)
{
    // Creates a client
    const client = new vision.ImageAnnotatorClient();

    // Performs label detection on the image file
    client
    .labelDetection('./resources/IMG_20161230_103156.jpg')
    .then(results => {
        const labels = results[0].labelAnnotations;

        console.log('Labels:');
    	labels.forEach(label => console.log(label.description));

        console.log('\n\nTotal result:\n', results);
    })
    .catch(err => {
        console.error('ERROR:', err);
    });
}