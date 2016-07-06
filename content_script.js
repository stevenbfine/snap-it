var FILTERED_TAGS = new Set(['script', 'noscript', 'style', 'link']);

function serializeDocument(html, srcHoles, frameHoles, doc, depth) {
	html.push('<!DOCTYPE html>\n');
	var node = doc.firstChild;
	while (node.nodeType == Node.DOCUMENT_TYPE_NODE) {
		node = node.nextSibling; // could this cause an infinite loop?
	}
	serializeTree(html, srcHoles, frameHoles, node, depth);
}

function serializeTree(html, srcHoles, frameHoles, element, depth) {
  if (!element.tagName && element.nodeType != Node.TEXT_NODE) {
    // ignore elements that don't have tags and are not text
  } else if (element.tagName && FILTERED_TAGS.has(element.tagName.toLowerCase())) {
    // filter out elements that are in filteredTags
  } else if (element.nodeType == Node.TEXT_NODE) {
    html.push(element.textContent);
  } else {
    html.push(new Array(depth+1).join('  '));
    html.push(`<${element.tagName.toLowerCase()} `);

    var style = element.ownerDocument.defaultView.getComputedStyle(element, null).cssText;
    style = style.replace(/"/g, "'");
    html.push(`style="${style}" `);

    var attributes = element.attributes;
    if (attributes) {
      for (var i = 0; i < attributes.length; i++) { // TODO: change this to the proper kind of loop
        var attribute = attributes[i];
        if (attribute.name.toLowerCase() == 'src') {
        	if (element.tagName.toLowerCase() != 'iframe') {
        		html.push(`${attribute.name}="`);
        		srcHoles[html.length] = attribute.value; // mark location to insert url later
        		html.push(''); // create filler entry
        		html.push('" ');
        	} else {
        		html.push('srcdoc=');
        		frameHoles[html.length] = attribute.value;
        		html.push(''); // create filler entry
        	}
        } else if (attribute.name.toLowerCase() != "style") {
          html.push(`${attribute.name}="${attribute.value}" `);
        }
      }
      html.push('>\n');
    }
    
    var children = element.childNodes;
    if (children) {
      for (var i = 0; i < children.length; i++) { // TODO: change this to the proper kind of loop
        var child = children[i];
        serializeTree(html, holes, child, depth+1);
      }
    }

    html.push(new Array(depth+1).join('  '));
    html.push(`</${element.tagName.toLowerCase()}>\n`);
  }
}

function fillHoles(html, holes) {
  if (Object.keys(holes).length == 0) {
    var output = html.join('');
    var file = new Blob([output], {type: 'text/html'});
    var url = URL.createObjectURL(file)
    // var extensionId = "nlhglfcihneopknjknodakgjfiapnnmn";
    chrome.runtime.sendMessage(url);
  }
  else {
    var index = Object.keys(holes)[0];
    var src = holes[index];
    delete holes[index];
    fetch(src).then(function(response) {
      return response.blob();
      }).then(function(blob) {
      var reader = new FileReader();
      reader.onload = function(e) {
        html[index] = '"' + e.target.result + '" ';
        fillHoles(html, holes);
      }
      reader.readAsDataURL(blob)
    }).catch(function(error) {
      console.log(error);
      // html[index] = '"" ';
      fillHoles(html, holes);
    });
  }
}

var srcHoles = {};
var frameHoles = {};
var html = [];
serializeDocument(html, srcHoles, frameHoles, document, 0);
fillHoles(html, holes);