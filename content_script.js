var filteredTags = ["script", "noscript", "style"];//, "link"];

function serializeTree(html, holes, element, depth) {
  if (!element.tagName && element.nodeType != 3) {
    // ignore elements that don't have tags and are not text
  }
  else if (element.tagName && filteredTags.indexOf(element.tagName.toLowerCase()) != -1) {
    // filter out elements that are in filteredTags
  }
  else if (element.nodeType == 3) {
    html.push(element.textContent);
  }
  else {
    html.push(new Array(depth+1).join("  "));
    html.push("<" + element.tagName + " ");

    var style = element.ownerDocument.defaultView.getComputedStyle(element, null).cssText;
    style = style.replace(/"/g, "'");
    html.push('style="' + style + '" ');

    var attributes = element.attributes;
    if (attributes) {
      for (var i = 0; i < attributes.length; i++) {
        var attribute = attributes[i];
        if (attribute.name.toLowerCase() == "src") {
          html.push(attribute.name + "=");
          holes[html.length] = attribute.value; // mark location to insert url later
          html.push(""); // create filler entry
        }
        else if (attribute.name.toLowerCase() != "style") {
          html.push(attribute.name + '="' + attribute.value + '" ');
        }
      }
      html.push(">\n");
    }
    
    var children = element.childNodes;
    if (children) {
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        html.push(serializeTree(html, holes, child, depth+1));
      }
    }

    html.push(new Array(depth+1).join("  "));
    html.push("</" + element.tagName + ">\n");
  }
}

function fillHoles(html, holes) {
  if (Object.keys(holes).length == 0) {
    var output = "<!DOCTYPE html>\n" + html.join("");
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

var holes = {};
var html = [];
serializeTree(html, holes, document.firstChild.nextSibling, 0);
fillHoles(html, holes);