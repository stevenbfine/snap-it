// console.log(document);
function outputHTML(text) {
	var file = new Blob([text], {type: 'text/html'});
	return URL.createObjectURL(file);
}

var url = outputHTML(document.body.outerHTML);
url;