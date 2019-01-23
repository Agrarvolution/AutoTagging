/**
 * @description Checks if the credentials file exists at all. If it does, it is checked on whether the credentials are valid or not via the
 * AWS.Config class.
 *
 * @returns {boolean} - returns true if the credentials are valid, and false if not.
 */
function checkAWSCredentials() {
    // check if the credentials file exists
    var path = "~/.aws/credentials";
    var credentials = window.cep.fs.readFile(path);
    
    if (credentials.err === 0) {
        // credentials file exists
        
        console.log(credentials.data); // credentials.data is file content
        
        // "The only way to check if credentials are valid is to attempt to send a request to one of our web services."
        var s3 = new AWS.S3();
        console.log(s3.config.credentials);
        
        //TODO: if AWS incorrect credentials -> showAWSLogin + errorMessage (popup)
        if (true) {
            return true;
        } else {
            // credentials are incorrect -> show Login
            return false;
        }
    } else {
        // credentials file doesn't exist -> show Login
        return false;
    }
}

/**
 * @description Writes a new credentials file in ~/.aws/credentials. If a file already exists, delete it
 *
 * @param aws_access_key_id
 * @param aws_secret_access_key
 *
 * @return {boolean} - returns true if the file was successfully written, and false if an error occurs
 */
function writeCredentials(aws_access_key_id, aws_secret_access_key) {
    var path = "~/.aws/credentials";
    var content = "[default]\n" +
        "aws_access_key_id = " + aws_secret_access_key + "\n" +
        "aws_secret_access_key = " + aws_access_key_id + "\n";
    
    // write a new credentials file in the correct location
    // if an old file exists, it will be overwritten
    var fileCreated = window.cep.fs.writeFile(path, content);
    
    return fileCreated;
}

function writeTags(latestImagePath, response)
{
    /**
     * Include XMP Lib
     */
    if (ExternalObject.AdobeXMPScript === undefined)
    {
        ExternalObject.AdobeXMPScript = new ExternalObject('lib:AdobeXMPScript');
    }


    if( xmpLib == undefined )
    {
        if( Folder.fs == "Windows" )
        {
            var pathToLib = Folder.startup.fsName + "/AdobeXMPScript.dll";
        }
        else
        {
            var pathToLib = Folder.startup.fsName + "/AdobeXMPScript.framework";
        }

        var libfile = new File( pathToLib );
        var xmpLib = new ExternalObject("lib:" + pathToLib );
    }

    if (app.document.selections[0].path !== latestImagePath)
    {
        return "Selection has changed: Old path: " + latestImagePath + ", new image path: " + app.document.selections[0].path;
    }
    else
    {
        var eventObj = new CSXSEvent();
        eventObj.type = "updateAutoTagInspector";
        eventObj.data = JSON.stringify({
            type: 'labelsFound',
            'serverResponse': response
        });
        eventObj.dispatch();


        /**
         * old code
         */

        /*
        var thumb = app.document.selections[0];

        if (thumb.hasMetadata)
        {
            /**
             * Get the metadata object - wait for  valid values
             /
            var md = thumb.synchronousMetadata;

            /**
             * open up current xmp
             /
            var xmp = new XMPMeta(md.serialize());

            var xmpFile = new XMPFile(latestImagePath.fsName, XMPConst.UNKNOWN, XMPConst.OPEN_FOR_UPDATE);

            /**
             * Set some needed properties for the xmp actions
             /
            // Change the creator tool
            xmp.setProperty(XMPConst.NS_XMP, "CreatorTool", "Changed by ModifyTags");

            // Change the date modified
            var d = new XMPDateTime(new Date());
            xmp.setProperty(XMPConst.NS_XMP, "ModifyDate", d, XMPConst.XMPDATE);

            // Create some custom data.  Register a new namespace and prefix
            XMPMeta.registerNamespace("http://ns.adobe.com/lightroom/1.0/", "lr:");

            // Stores the label list items into the XMP-File with atdata: property.
            var tagNamespace = "http://ns.adobe.autotaggingJSON/";
            var tagPrefix = "atdata:";
            XMPMeta.registerNamespace(tagNamespace, tagPrefix);
            //xmp.deleteProperty(tagNamespace, "labelListJSON"); // not necessary
            xmp.setProperty(tagNamespace, "labelListJSON", response);



            var writeParents = true;

            var existingTags = readTags(xmp);
            var respondTags = responseTags(response, writeParents);

            respondTags.subjects = stripArray(respondTags.subjects, existingTags.subjects);
            respondTags.hierarchy = stripArray(respondTags.hierarchy, existingTags.hierarchy);

            if (!respondTags.subjects)
            {
                respondTags.subjects = [];
            }
            if (!respondTags.hierarchy)
            {
                respondTags.hierarchy = [];
            }

            for (var i = 0; i < respondTags.subjects.length; i++)
            {
                xmp.appendArrayItem(XMPConst.NS_DC, "subject", respondTags.subjects[i], 0, XMPConst.ARRAY_IS_ORDERED);
            }
            for (var i = 0; i < respondTags.hierarchy.length; i++)
            {
                xmp.appendArrayItem("http://ns.adobe.com/lightroom/1.0/", "hierarchicalSubject", respondTags.hierarchy[i], 0, XMPConst.ARRAY_IS_ORDERED);
            }

            // Write the packet back to the selected file
            alert(xmp.dumpObject());
            var updatedPacket = xmp.serialize(XMPConst.SERIALIZE_OMIT_PACKET_WRAPPER | XMPConst.SERIALIZE_USE_COMPACT_FORMAT);

            // Uncomment to see the XMP packet in XML form
            // $.writeln(updatedPacket);
            thumb.metaData = new Metadata(updatedPacket);

            if (xmpFile.canPutXMP(xmp))
            {
                xmpFile.putXMP(xmp);
                return "successfully wrote xmp";
            }

            return "could not write to file";
        }
        */
    }
}

/**
 * Reads the existing tags in the XMP Metadata
 * @return Object containing a subject and hierarchy array
 * @param {Object} xmp
 */
function readTags(xmp)
{
    var subjects = [];
    var hierarchy = [];

    for (var i = 1; i <= xmp.countArrayItems(XMPConst.NS_DC, "subject"); i++)
    {
        subjects.push(xmp.getArrayItem(XMPConst.NS_DC, "subject", i));
    }
    for (i = 1; i <= xmp.countArrayItems("http://ns.adobe.com/lightroom/1.0/", "hierarchicalSubject"); i++)
    {
        hierarchy.push(xmp.getArrayItem("http://ns.adobe.com/lightroom/1.0/", "hierarchicalSubject", i));
    }
    return {subjects: subjects, hierarchy: hierarchy};
}


/**
 * Creates the same structure for the tag response as is written in XMP
 * @return Object containing a subject and hierarchy array
 * @param {Array} responseObject
 * @param {boolean} writeParents -> decides whether parents are ticked or not
 */
function responseTags(responseObject, writeParents)
{
    var subjects = [];
    var hierarchy = [];

    if (!responseObject)
    {
        responseObject = [];
    }

    for (var i = 0; i < responseObject.length; i++)
    {
        subjects.push(responseObject[i].description);
        if (responseObject[i].parents.length > 0)
        {
            for (var pIndex = 0; pIndex < responseObject[i].parents.length; pIndex++)
            {
                hierarchy.push(responseObject[i].parents[pIndex].name + "|" + responseObject[i].description);
                if (!searchInArray(subjects, responseObject[i].parents[pIndex].name) && writeParents)
                {
                    subjects.push(responseObject[i].parents[pIndex].name);
                }
            }
        }
        else
        {
            hierarchy.push(responseObject[i].description);
        }
    }
    return {subjects: subjects, hierarchy: hierarchy};
}

/**
 check if array contains value
 because indexOf doesn't work
 */
function searchInXMPArray(array, value)
{
    for (var i = 0; i < array.length; i++)
    {
        if (array[i].toString().toLowerCase() === value.toLowerCase())
        {
            return true;
        }
    }
    return false;
}

/**
 check if array contains value
 because indexOf doesn't work
 */
function searchInArray(array, value)
{
    for (var i = 0; i < array.length; i++)
    {
        if (array[i].toLowerCase() === value.toLowerCase())
        {
            return true;
        }
    }
    return false;
}

/**
 * Compares two array and removes duplicates from the target array.
 * @return {Array} array with strings
 * @param {Array} target
 * @param {Array} decider
 */
function stripArray(target, decider)
{
    for (var i = 0; i < target.length; i++)
    {
        if (searchInXMPArray(decider, target[i]))
        {
            target.splice(i--,1);
        }
    }
    return target;
}