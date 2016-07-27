/**
 * Send the neccessary HTMLSerializer properties back to the extension.
 *
 * @param {HTMLSerializer} htmlSerializer The HTMLSerializer.
 */
function sendHTMLSerializerToExtension(htmlSerializer) {
  var result = {
    'html': htmlSerializer.html,
    'frameHoles': htmlSerializer.frameHoles,
    'frameIndex': htmlSerializer.iframeFullyQualifiedName(window)
  };
  chrome.runtime.sendMessage(result);
}

var htmlSerializer = new HTMLSerializer();
htmlSerializer.processDocument(document);
htmlSerializer.fillSrcHoles(sendHTMLSerializerToExtension);
