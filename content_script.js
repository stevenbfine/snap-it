/**
 * HTML serializer that takes a document and synchronously stores it as an array
 * of strings and stores enough state to later asynchronously convert it into an
 * html text file.
 */
var HTMLSerializer = class {
  constructor() {

    /**
     * @private {Set<string>} Contains the tag names that should be
     *     ignored while serializing a document.
     * @const
     */
    this.FILTERED_TAGS = new Set(['SCRIPT', 'NOSCRIPT', 'STYLE', 'LINK']);

    /**
     * @private {Set<string>} Contains the tag names for elements
     *     that have no closing tags.  List of tags taken from:
     *     https://html.spec.whatwg.org/multipage/syntax.html#void-elements.
     * @const
     */
    this.NO_CLOSING_TAGS = new Set([
      'AREA',
      'BASE',
      'BR',
      'COL',
      'EMBED',
      'HR',
      'IMG',
      'INPUT',
      'KEYGEN',
      'LINK',
      'META',
      'PARAM',
      'SOURCE',
      'TRACK',
      'WBR'
    ]);

    /**
     * @public {Array<string>} This array represents the serialized html that
     *     makes up an element or document. 
     */
    this.html = [];

    /**
     * @public {Object<number, string>} The keys represent an index in
     *     |this.html|. The value is a url at which the resource that belongs at
     *     that index can be retrieved. The resource will eventually be
     *     converted to a data url.
     */
    this.srcHoles = {};

    /**
     * @public {Object<number, string>} The keys represent an index in
     *     |this.html|. The value is a string that uniquely identifies an
     *     iframe, the serialized contents of which should be placed at that
     *     index of |this.html|.
     */
    this.frameHoles = {};
  }

  /**
   * Takes an html element, and populates this object's fields such that it can
   * eventually be converted into an html text file.
   *
   * @param {Element} element The Element to serialize.
   * @param {number} depth The number of parents this element has in the current
   *     frame.
   * @private
   */ 
  processTree(element, depth) {
    var tagName = element.tagName;
    if (!tagName && element.nodeType != Node.TEXT_NODE) {
      // Ignore elements that don't have tags and are not text.
    } else if (tagName && this.FILTERED_TAGS.has(tagName)) {
      // Filter out elements that are in filteredTags.
    } else if (element.nodeType == Node.TEXT_NODE) {
      this.html.push(element.textContent);
    } else {
      this.html.push(`<${tagName.toLowerCase()} `);
      this.processAttributes(element);
      this.html.push('>');

      var children = element.childNodes;
      if (children) {
        for (var i = 0, child; child = children[i]; i++) {
          this.processTree(child, depth+1);
        }
      }

      if (!this.NO_CLOSING_TAGS.has(tagName)) {
        this.html.push(`</${tagName.toLowerCase()}>`);
      }
    }
  }

  /**
   * Takes an html document, and populates this objects fields such that it can
   * eventually be converted into an html file.
   *
   * @param {Document} doc The Document to serialize.
   */ 
  processDocument(doc) {
    this.html.push('<!DOCTYPE html>\n');
    var nodes = doc.childNodes;
    for (var i = 0, node; node = nodes[i]; i++) {
      if (node.nodeType != Node.DOCUMENT_TYPE_NODE) {
        this.processTree(node, 0);
      }
    }
  }

  /**
   * Takes an html element, and populates this object's fields with the
   * appropriate attribute names and values.
   *
   * @param {Element} element The Element to serialize.
   * @private
   */ 
  processAttributes(element) {
    var win = element.ownerDocument.defaultView;
    var style = win.getComputedStyle(element, null).cssText;

    // TODO(sfine): Ensure that getComputedStyle returns absolute urls.
    //              https://www.w3.org/TR/css3-values/ 3.4.1

    var windowDepth = this.windowDepth(window);
    style = style.replace(/"/g, this.escapedQuote(windowDepth+1));
    var quote = this.escapedQuote(windowDepth);
    this.html.push(`style=${quote}${style}${quote} `);

    var attributes = element.attributes;
    if (attributes) {
      for (var i = 0, attribute; attribute = attributes[i]; i++) {
        switch (attribute.name.toLowerCase())  {
          case 'src':
            this.processSrcAttribute(element);
          case 'style':
            break;
          default:
            var name = attribute.name;
            var value = attribute.value;
            this.processSimpleAttribute(name, value);
        }
      }
      // TODO(sfine): Ensure this is working by making sure that an iframe
      //              will always have attributes.
      if (element.tagName == 'IFRAME') {
        this.html.push('srcdoc=');
        var name = this.iframeFullyQualifiedName(element.contentWindow);
        this.frameHoles[this.html.length] = name;
        this.html.push(''); // Entry where the iframe contents will go.
      }
    }
  }

  /**
   * Process the src attribute of a given element
.   *
   * @param {Element} element The element being processed, which has the src
   *     attribute.
   * @private
   */
  processSrcAttribute(element) {
    var tag = element.tagName;
    switch (tag) {
      case 'IFRAME':
        break; // Do nothing.
      case 'SOURCE':
        if (!element.parent || element.parent.tagName != 'IMG') {
          var url = this.fullyQualifiedURL(element).href;
          this.processSimpleAttribute('src', url);
          break;
        } // else process as img.
      case 'INPUT':
        var type = element.attributes.type;
        if (tag == 'INPUT' && (!type || type.value.toLowerCase() != 'image')) {
          break;
        } // else process as img.
      case 'IMG':
        if (window.location.host == this.fullyQualifiedURL(element).host) {
          this.processSrcHole(element);
          break;
        }
      default:
        var url = this.fullyQualifiedURL(element).href;
        this.processSimpleAttribute('src', url);
    }
  }

  /**
   * Get a URL object for the value of the |element|'s src attribute.
   *
   * @param {Element} element The element for which to retrieve the URL.
   * @return {URL} The URL object.
   */
  fullyQualifiedURL(element) {
    var url = element.attributes.src.value;
    var a = document.createElement('a');
    a.href = url;
    url = a.href; // Retrieve fully qualified URL.
    return new URL(url);
  }

  /**
   * Add an entry to |this.srcHoles| so it can be processed asynchronously.
   *
   * @param {Element} element The element being processed, which has the src
   *     attribute.
   * @private
   */
  processSrcHole(element) {
    var src = element.attributes.src;
    this.html.push(`${src.name}=`);
    this.srcHoles[this.html.length] = this.fullyQualifiedURL(element).href;
    this.html.push(''); // Entry where data url will go.
    this.html.push(' '); // Add a space before the next attribute.
  }

  /**
   * Add a name and value pair to the list of attributes in |this.html|.
   *
   * @param {string} name The name of the attribute.
   * @param {string} value The value of the attribute.
   */
  processSimpleAttribute(name, value) {
    var quote = this.escapedQuote(this.windowDepth(window));
    this.html.push(`${name}=${quote}${value}${quote} `);
  }

  /**
   * Computes the index of the window in its parent's array of frames.
   *
   * @param {Window} childWindow The window to use in the calculation.
   * @return {number} the frames index.
   */
  iframeIndex(childWindow) {
    if (childWindow.parent != childWindow) {
      for (var i = 0; i < childWindow.parent.frames.length; i++) {
        if (childWindow.parent.frames[i] == childWindow) {
          return i;
        }
      }
    } else {
      return -1;
    }
  }

  /**
   * Computes the full path of the frame in the root document. Nested layers
   * are seperated by '.'.
   *
   * @param {Window} win The window to use in the calculation.
   * @return {string} The full path.
   */
  iframeFullyQualifiedName(win) {
    if (this.iframeIndex(win) < 0) {
      return '0';
    } else {
      var fullyQualifiedName = this.iframeFullyQualifiedName(win.parent);
      var index = this.iframeIndex(win);
      return fullyQualifiedName + '.' + index; 
    }
  }

  /**
   * Calculate the correct quotes that should be used given the nesting depth of
   * the window in the frame tree.
   *
   * @param {number} depth The nesting depth of this window in the frame tree.
   * @return {string} The correctly escaped quotation marks.
   */
  escapedQuote(depth) {
    if (depth == 0) {
      return '"';
    } else {
      return '&' + new Array(depth).join('amp;') + 'quot;';
    }
  }

  /**
   * Calculate the nesting depth of a window in the frame tree.
   *
   * @param {Window} win The window to use in the calculation.
   * @return {number} The nesting depth of the window in the frame trees.
   */
  windowDepth(win) {
    return this.iframeFullyQualifiedName(win).split('.').length - 1;
  }
}
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
/**
 * Takes all of the srcHoles in the HTMLSerializer, and creates data urls for
 * the resources, and places them in |this.html|. Calls the callback when
 * complete.
 *
 * @param {HTMLSerializer} htmlSerializer The HTMLSerializer.
 * @param {Function} callback The callback function.
 */
function fillSrcHoles(htmlSerializer, callback) {
  if (Object.keys(htmlSerializer.srcHoles).length == 0) {
    callback(htmlSerializer);
  } else {
    var index = Object.keys(htmlSerializer.srcHoles)[0];
    var src = htmlSerializer.srcHoles[index];
    delete htmlSerializer.srcHoles[index];
    fetch(src).then(function(response) {
      return response.blob();
    }).then(function(blob) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var windowDepth = htmlSerializer.windowDepth(window);
        var quote = htmlSerializer.escapedQuote(windowDepth);
        htmlSerializer.html[index] = quote + e.target.result + quote;
        fillSrcHoles(htmlSerializer, callback);
      }
      reader.readAsDataURL(blob);
    }).catch(function(error) {
      console.log(error);
      fillSrcHoles(htmlSerializer, callback);
    });
  }
}

// TODO(sfine): Perhaps handle images seperately. At least store height and
//              width.
/**
 * Send the neccessary HTMLSerializer properties back to the extension.
 *
 * @param {HTMLSerializer} htmlSerializer The HTMLSerializer.
 */
function sendHTMLSerializerToExtension(htmlSerializer) {
  var result = {
    'html': htmlSerializer.html,
    'frameHoles': htmlSerializer.frameHoles,
    'frameIndex': htmlSerializer.iframeFullyQualifiedName(window)
  };
  chrome.runtime.sendMessage(result);
}


// TODO(sfine): check for testing in better way.
if (typeof IS_TEST === typeof undefined || !IS_TEST) {
  var htmlSerializer = new HTMLSerializer();
  htmlSerializer.processDocument(document);
  fillSrcHoles(htmlSerializer, sendHTMLSerializerToExtension);
}