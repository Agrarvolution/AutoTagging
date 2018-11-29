var getLabels = require('./RekognitionLabels.jsx')

url = 'D:/Carolin/Art/My Art/_Zoids/__Mai Zoids/pins.png';

getLabels(url).then((response) => console.log(response));