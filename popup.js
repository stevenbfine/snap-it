function click() {
  	chrome.tabs.executeScript(null, {file: "content_script.js"}, function(result) {
  		var a = document.getElementById('download');
  		a.href = result[0];
  		a.download = "webpage.html";
  		a.innerHTML = "Download";
  	});
  	// window.close();
}

document.addEventListener('DOMContentLoaded', function() {
	document.getElementById('button').addEventListener('click', click);
});
