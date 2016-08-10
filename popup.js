document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('button').addEventListener('click', click);
});

function click() {
  var messages = []
  var results;
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    messages.push(message);
    if (results && messages.length == results.length) {
      completeProcess(messages);
    }
  });

  // TODO(sfine): figure out why not all iframes are getting content scripts
  //              injected.
  var serializer = {file: 'HTMLSerializer.js', allFrames: true};
  chrome.tabs.executeScript(null, serializer, function() {
    var contentScript = {file: 'content_script.js', allFrames: true};
    chrome.tabs.executeScript(null, contentScript, function(response) {
      results = response;
      if (messages.length == results.length)
        completeProcess(messages);
    });
  });
}

/**
 * Takes all the responses from the injected content scripts and creates the
 * HTML file for download.
 * 
 * @param {Array<Object>} messages The response from all of the injected content
 *     scripts.
 */
function completeProcess(messages) {
  var html = outputHTMLString(messages);
  var file = new Blob([html], {type: 'text/html'});
  var url = URL.createObjectURL(file);

  var a = document.getElementById('download');
  a.href = url;
  a.download = "webpage.html";
  a.innerHTML = "Download";
}

/**
 * Converts the responses from the injected content scripts into a string
 * representing the HTML.
 * 
 * @param {Array<Object>} messages The response from all of the injected content
 *     scripts.
 * @return {string} The resulting HTML.
 */
function outputHTMLString(messages) {
  var rootIndex = 0;
  for (var i = 1; i < messages.length; i++) {
    rootIndex = messages[i].frameIndex === '0' ? i : rootIndex;
  }
  fillRemainingHoles(messages, rootIndex);
  return messages[rootIndex].html.join('');
}

/**
 * Fills all of the gaps in |messages[i].html|.
 *
 * @param {Array<Object>} messages The response from all of the injected content
 *     scripts.
 * @param {number} i The index of messages to use.
 */
function fillRemainingHoles(messages, i) {
  var html = messages[i].html;
  var frameHoles = messages[i].frameHoles;
  for (var index in frameHoles) {
    if (frameHoles.hasOwnProperty(index)) {
      var frameIndex = frameHoles[index];
      for (var j = 0; j < messages.length; j++) {
        if (messages[j].frameIndex == frameIndex) {
          fillRemainingHoles(messages, j);
          html[index] = messages[j].html.join('');
        }
      }
    }
  }
}
