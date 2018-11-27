function RecognitionLabels()
{

}

RecognitionLabels.prototype.getLabels = function(path)
{
    return new Promise(function resolve()
        {
        // Load the SDK and base64encoder
        const AWS = require('aws-sdk');
        const image2base64 = require('image-to-base64');
        
        image2base64(path) // you can also to use url
            .then(function(response)
            {
                // console.log(response); //cGF0aC90by9maWxlLmpwZw==
                var params =
                {
                    Image:
                    {
                        Bytes: Buffer.from(response, 'base64')
                    },
                    MaxLabels: 20,
                    MinConfidence: 70,
                };
                
                var rekognition = new AWS.Rekognition({ apiVersion: '2016-06-27', region: 'us-west-2' });
                rekognition.detectLabels(params, function(err, data)
                {
                    if (err)
                    {
                        console.error(err);
                        // console.error(err.stack);S
                        resolve(-1); // ERROR!
                    }
                    else
                    {
                        // console.log(data);
                        resolve(data); // return the labels
                    }
                });
            })
            .catch(function(error)
            {
                //console.log(error); //Exception error....
                resolve(-1); // ERROR!
            });
    });
};