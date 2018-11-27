var getLabels = require('./RekognitionLabels')

url = 'D:\\Carolin\\Documents\\_MTD\\5_Semester\\PRO5\\AWS\\img\\noticed.jpg';

getLabels(url).then((response) => console.log(response));