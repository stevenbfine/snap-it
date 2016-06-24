// var duplicatePage = function() {
// 	document.body.style.backgroundColor="red";
// }

// document.getElementById("button").addEventListener("click", function() {
// 	// document.body.style.backgroundColor="red";
// 	chrome.tabs.executeScript(null, 
// 		{code: "document.body.style.backgroundColor='red'"}
// 		);
// 	window.close();
// });

// USER RESULT TO GET THE DOM.  HOPEFULLY THAT WORKS
// ALTERNATIVELY, THERE IS THE OTHER OPTION OF COMMUNICATING WITH THE TAB -> LOOK INTO

function click() {
	// chrome.tabs.getCurrent(function(tab) {
	// 	chrome.tabs.connect(tab.id, )
	// });

	// chrome.tabs.executeScript(null,
 //      	{code:"var x = document.all[0].outerHTML; x"}, 
 //      	function(results) {
 //      		console.log(results);
 //      	});
 
  	chrome.tabs.executeScript(null, {file: "content_script.js"});
  	// window.close();
}


document.addEventListener('DOMContentLoaded', function() {
	document.getElementById('button').addEventListener('click', click);
});
