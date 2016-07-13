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

  chrome.tabs.executeScript(null, {file: 'content_script.js', allFrames: true},
      function(response) { // TODO: FIGURE OUT WHY NOT ALL IFRAMES ARE GETTING
                           //       CONTENT SCRIPTS INJECTED
        results = response;
        if (messages.length == results.length) {
          completeProcess(messages);
        }
      }
  );
}

/**
 * Takes all the responses from the injected content scripts and creates the
 * HTML file for download
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
 * @return {string} The resulting HTML
 */
function outputHTMLString(messages) {
  var rootIndex = 0;
  for (var i = 1; i < messages.length; i++) {
    rootIndex = messages[i].frameIndex === '0' ? i : rootIndex;
  }
  fillRemainingHoles(messages, rootIndex, 0);
  return messages[rootIndex].html.join('');
}

/**
 * Fills all of the gaps in messages[i].html
 *
 * @param {Array<Object>} messages The response from all of the injected content
 *     scripts
 * @param {number} i The index of messages to use
 * @param {number} depth How many parent iframes messages[i] has
 */
function fillRemainingHoles(messages, i, depth) {
  var html = messages[i].html;
  var quotes = getQuotes(depth);
  var frameHoles = messages[i].frameHoles;
  for (var index in frameHoles) {
    if (frameHoles.hasOwnProperty(index)) {
      var frameIndex = frameHoles[index];
      for (var j = 0; j < messages.length; j++) {
        if (messages[j].frameIndex == frameIndex) {
          fillRemainingHoles(messages, j, depth+1);
          html[index] = quotes + messages[j].html.join('') + quotes;
        }
      }
    }
  }
  var srcHoles = messages[i].srcHoles;
  for (var index in srcHoles) {
    if (srcHoles.hasOwnProperty(index)) {
      var srcIndex = srcHoles[index];
      html[srcIndex-1] = quotes;
      html[srcIndex+1] = quotes;
    }
  }
  var styleIndices = messages[i].styleIndices;
  for (var i = 0; i < styleIndices.length; i++) {
    var style = html[styleIndices[i]];
    html[styleIndices[i]] = style.replace(/"/g, quotes);
  }
}

/**
 * Calculate the correct quotes that should be used given how many parent
 * iframes a given frame has
 *
 * @param {number} depth The number of parent iframes
 * @return {string} The correctly escaped quotation marks
 */
function getQuotes(depth) {
  if (depth == 0) {
    return '"';
  } else {
    return '&' + new Array(depth).join('amp;') + 'quot;';
  }
}