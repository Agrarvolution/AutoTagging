function VisionScript()
{

}


// Imports the Google Cloud client library
const vision = require('@google-cloud/vision');

VisionScript.prototype.getLabels = function(imagePath)
{
    /*
    var credentials = new vision.ServiceAccountCredentials.fromStream(
        new FileInputStream("G:/Programmordner/OneDrive/OneDrive - students.fh-hagenberg.at/FH/5. Semester/Pro5/Vision API/autotagging-99aed200323b.json"));
    var imageAnnotatorSettings = new vision.ImageAnnotatorSettings.newBuilder()
        .setCredentialsProvider(FixedCredentialsProvider.create(credentials))
        .build();
    //ImageAnnotatorClient imageAnnotatorClient = ImageAnnotatorClient.create(imageAnnotatorSettings);
    */

    // Creates a client
    const client = new vision.ImageAnnotatorClient(keyFilename="G:/Programmordner/OneDrive/OneDrive - students.fh-hagenberg.at/FH/5. Semester/Pro5/Vision API/autotagging-99aed200323b.json");

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

var visionScript = new VisionScript();
visionScript.getLabels();

//autotagging-99aed200323b.json