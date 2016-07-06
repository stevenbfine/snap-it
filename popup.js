document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('button').addEventListener('click', click);
});

function click() {
  chrome.tabs.executeScript(null, {file: 'content_script.js', allFrames: true});
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      var a = document.getElementById('download');
      a.href = request;
      a.download = 'webpage.html';
      a.innerHTML = 'Download';
});