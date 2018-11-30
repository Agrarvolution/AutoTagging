"use strict"
#include "js/libs/json2.js"

var currentPreviewFile = app.document.selections[0].core.preview.preview;
currentPreviewFile.exportTo ("C:/AutoTagging/tempImage.jpg", 10);