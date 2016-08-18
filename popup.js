document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('button')) {
    document.getElementById('button').addEventListener('click', click);
  }
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
  fillRemainingHolesAndMinimizeStyles(messages, rootIndex);
  return messages[rootIndex].html.join('');
}

/**
 * Fills all of the gaps in |messages[i].html|.
 *
 * @param {Array<Object>} messages The response from all of the injected content
 *     scripts.
 * @param {number} i The index of messages to use.
 */
function fillRemainingHolesAndMinimizeStyles(messages, i) {
  var html = messages[i].html;
  var frameHoles = messages[i].frameHoles;
  for (var index in frameHoles) {
    if (frameHoles.hasOwnProperty(index)) {
      var frameIndex = frameHoles[index];
      for (var j = 0; j < messages.length; j++) {
        if (messages[j].frameIndex == frameIndex) {
          fillRemainingHolesAndMinimizeStyles(messages, j);
          html[index] = messages[j].html.join('');
        }
      }
    }
  }
  minimizeStyles(messages[i]);
}

/**
 * Removes all style attribute properties that are unneeded.
 *
 * @param {Object} message The message Object whose style attributes should be
 *     minimized.
 */
function minimizeStyles(message) {
  var nestingDepth = message.frameIndex.split('.').length - 1;
  var iframe = document.createElement('iframe');
  document.body.appendChild(iframe);
  iframe.setAttribute(
    'style',
    `height: ${message.windowHeight}px;` + 
    `width: ${message.windowWidth}px;`
  );
  var html = message.html.join('');
  html = unescapeHTML(html, nestingDepth);
  iframe.contentDocument.documentElement.innerHTML = html;
  var doc = iframe.contentDocument;

  if (message.rootStyleIndex) {
    minimizeStyle(message, doc, doc.documentElement, message.rootStyleIndex);
  }

  for (var id in message.idToStyleIndex) {
    var index = message.idToStyleIndex[id];
    var element = doc.getElementById(id);
    if (element) {
      minimizeStyle(message, doc, element, index);
    }
  }
  iframe.remove();
}

/**
 * Removes all style attribute properties that are unneeded for a single
 *     element.
 *
 * @param {Object} message The message Object that contains the element whose
 *     whose style attributes should be minimized.
 * @param {Document} doc The Document that contains the rendered HTML.
 * @param {Element} element The Element whose style attributes should be
 *     minimized.
 * @param {number} index The index in |message.html| where the Element's style
 *     attribute is specified.
 */
function minimizeStyle(message, doc, element, index) {
  var originalStyle = element.getAttribute('style');
  element.removeAttribute('style');
  var unstyledStyle = doc.defaultView.getComputedStyle(element, null);

  var fullStyleDeclaration = message.html[index];
  var stylePrefix;
  var styleSuffix;
  // Remove style declaration from style attribute.
  var style = fullStyleDeclaration.replace(
    /^style=("|&(amp;)*?quot;)(.*)("|&(amp;)*?quot;) ?$/,
    function(match, quote, p2, content) {
      stylePrefix = 'style=' + quote;
      styleSuffix = quote + ' ';
      return content;
    }
  );
  // Remove property value pair if unstyledStyle has the same property
  // value.
  style = style.replace(
    /([\S]*?): ("|&(amp;)*?quot;)?(.*?)("|&(amp;)*?quot;)?; ?/g,
    function(match, property, p2, p3, value) {
      unstyledValue = unstyledStyle[property].replace(/"/g, '');
      if (unstyledValue == value) {
        return '';
      } else {
        return match;
      }
    }
  );
  message.html[index] = stylePrefix + style + styleSuffix;
  element.setAttribute('style', originalStyle);
}

/**
 * Take a string that represents valid HTML and unescape it so that it can be
 * rendered.
 *
 * @param {string} html The HTML to unescape.
 * @param {number} nestingDepth The number of times the HTML must be unescaped.
 * @return {string} The unescaped HTML.
 */
function unescapeHTML(html, nestingDepth) {
  var div = document.createElement('div');
  for (var i = 0; i < nestingDepth; i++) {
    div.innerHTML = `<iframe srcdoc="${html}"></iframe>`;
    html = div.childNodes[0].attributes.srcdoc.value;
  }
  return html;
}
