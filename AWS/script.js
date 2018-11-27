var getLabels = require('./RekognitionLabels')

url = 'D:/Carolin/Art/My Art/_Zoids/__Mai Zoids/Belial 1_1024.jpg';

getLabels(url).then((response) => console.log(response));