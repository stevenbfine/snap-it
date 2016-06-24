function click() {
  	chrome.tabs.executeScript(null, {file: "content_script.js"});
  	// window.close();
}

document.addEventListener('DOMContentLoaded', function() {
	document.getElementById('button').addEventListener('click', click);
});
