QUnit.test('windowDepth: no parent window', function(assert) {
  var serializer = new HTMLSerializer();
  assert.equal(serializer.windowDepth(window), 0);
});

QUnit.test('windowDepth: multiple parent windows', function(assert) {
  var serializer = new HTMLSerializer();
  var fixture = document.getElementById('qunit-fixture');
  var childFrame = document.createElement('iframe');
  fixture.appendChild(childFrame);
  var childFrameBody = childFrame.contentDocument.body;
  var grandChildFrame = document.createElement('iframe');
  childFrameBody.appendChild(grandChildFrame);
  assert.equal(serializer.windowDepth(childFrame.contentWindow), 1);
  assert.equal(serializer.windowDepth(grandChildFrame.contentWindow), 2);
});

QUnit.test('escapedCharacter: zero depth', function(assert) {
  var serializer = new HTMLSerializer();
  assert.equal(serializer.escapedCharacter('"', 0), '"');
  assert.equal(serializer.escapedCharacter("'", 0), "'");
  assert.equal(serializer.escapedCharacter('<', 0), '<');
  assert.equal(serializer.escapedCharacter('>', 0), '>');
  assert.equal(serializer.escapedCharacter('&', 0), '&');
});

QUnit.test('escapedCharacter: nonzero depth', function(assert) {
  var serializer = new HTMLSerializer();
  assert.equal(serializer.escapedCharacter('"', 1), '&quot;');
  assert.equal(serializer.escapedCharacter('"', 2), '&amp;quot;');
  assert.equal(serializer.escapedCharacter("'", 1), '&#39;');
  assert.equal(serializer.escapedCharacter("'", 2), '&amp;#39;');
  assert.equal(serializer.escapedCharacter('<', 1), '&lt;');
  assert.equal(serializer.escapedCharacter('<', 2), '&amp;lt;');
  assert.equal(serializer.escapedCharacter('>', 1), '&gt;');
  assert.equal(serializer.escapedCharacter('>', 2), '&amp;gt;');
  assert.equal(serializer.escapedCharacter('&', 1), '&amp;');
  assert.equal(serializer.escapedCharacter('&', 2), '&amp;amp;');
});

QUnit.test('iframeIndex: single layer', function(assert) {
  var serializer = new HTMLSerializer();
  var fixture = document.getElementById('qunit-fixture');
  var childFrame1 = document.createElement('iframe');
  var childFrame2 = document.createElement('iframe');
  fixture.appendChild(childFrame1);
  fixture.appendChild(childFrame2);
  assert.equal(serializer.iframeIndex(window), -1);
  assert.equal(serializer.iframeIndex(childFrame1.contentWindow), 0);
  assert.equal(serializer.iframeIndex(childFrame2.contentWindow), 1);
});

QUnit.test('iframeIndex: multiple layers', function(assert) {
  var serializer = new HTMLSerializer();
  var fixture = document.getElementById('qunit-fixture');
  var childFrame = document.createElement('iframe');
  var grandChildFrame1 = document.createElement('iframe');
  var grandChildFrame2 = document.createElement('iframe');
  fixture.appendChild(childFrame);
  var childFrameBody = childFrame.contentDocument.body;
  childFrameBody.appendChild(grandChildFrame1);
  childFrameBody.appendChild(grandChildFrame2);
  assert.equal(serializer.iframeIndex(grandChildFrame1.contentWindow), 0);
  assert.equal(serializer.iframeIndex(grandChildFrame2.contentWindow), 1);
});

QUnit.test('iframeFullyQualifiedName: single layer', function(assert) {
  var serializer = new HTMLSerializer();
  var fixture = document.getElementById('qunit-fixture');
  var childFrame1 = document.createElement('iframe');
  var childFrame2 = document.createElement('iframe');
  fixture.appendChild(childFrame1);
  fixture.appendChild(childFrame2);
  assert.equal(serializer.iframeFullyQualifiedName(window), '0');
  assert.equal(
    serializer.iframeFullyQualifiedName(childFrame1.contentWindow),
    '0.0'
  );
  assert.equal(
    serializer.iframeFullyQualifiedName(childFrame2.contentWindow),
    '0.1'
  );
});

QUnit.test('iframeFullyQualifiedName: multiple layers', function(assert) {
  var serializer = new HTMLSerializer();
  var fixture = document.getElementById('qunit-fixture');
  var childFrame = document.createElement('iframe');
  var grandChildFrame1 = document.createElement('iframe');
  var grandChildFrame2 = document.createElement('iframe');
  fixture.appendChild(childFrame);
  var childFrameBody = childFrame.contentDocument.body;
  childFrameBody.appendChild(grandChildFrame1);
  childFrameBody.appendChild(grandChildFrame2);
  assert.equal(
    serializer.iframeFullyQualifiedName(grandChildFrame1.contentWindow),
    '0.0.0'
  );
  assert.equal(
    serializer.iframeFullyQualifiedName(grandChildFrame2.contentWindow),
    '0.0.1'
  );
});

QUnit.test('processSimpleAttribute: top window', function(assert) {
  var serializer = new HTMLSerializer();
  var fixture = document.getElementById('qunit-fixture');
  var win = fixture.ownerDocument.defaultView;
  serializer.processSimpleAttribute(win, 'height', '5');
  assert.equal(serializer.html[0], 'height="5" ');
});

QUnit.test('processSimpleAttribute: nested window', function(assert) {
  var serializer = new HTMLSerializer();
  var fixture = document.getElementById('qunit-fixture');
  var childFrame = document.createElement('iframe');
  var grandChildFrame = document.createElement('iframe');
  fixture.appendChild(childFrame);
  var childFrameBody = childFrame.contentDocument.body;
  childFrameBody.appendChild(grandChildFrame);
  var childFrameWindow = childFrame.contentDocument.defaultView;
  var grandChildFrameWindow = grandChildFrame.contentDocument.defaultView;
  serializer.processSimpleAttribute(childFrameWindow, 'height', '5');
  serializer.processSimpleAttribute(grandChildFrameWindow, 'width', '2');
  assert.equal(serializer.html[0], 'height=&quot;5&quot; ');
  assert.equal(serializer.html[1], 'width=&amp;quot;2&amp;quot; ');
});

QUnit.test('processHoleAttribute: top window', function(assert) {
  var serializer = new HTMLSerializer();
  var fixture = document.getElementById('qunit-fixture');
  var win = fixture.ownerDocument.defaultView;
  var valueIndex = serializer.processHoleAttribute(win, 'height');
  assert.equal(valueIndex, 1);
  assert.equal(serializer.html[0], 'height="');
  assert.equal(serializer.html[2], '" ');
});

QUnit.test('processHoleAttribute: nested window', function(assert) {
  var serializer = new HTMLSerializer();
  var fixture = document.getElementById('qunit-fixture');
  var childFrame = document.createElement('iframe');
  var grandChildFrame = document.createElement('iframe');
  fixture.appendChild(childFrame);
  var childFrameBody = childFrame.contentDocument.body;
  childFrameBody.appendChild(grandChildFrame);
  var childFrameWindow = childFrame.contentDocument.defaultView;
  var grandChildFrameWindow = grandChildFrame.contentDocument.defaultView;
  var childValueIndex = serializer.processHoleAttribute(
    childFrameWindow,
    'height'
  );
  var grandChildValueIndex = serializer.processHoleAttribute(
    grandChildFrameWindow,
    'width'
  );
  assert.equal(childValueIndex, 1);
  assert.equal(serializer.html[0], 'height=&quot;');
  assert.equal(serializer.html[2], '&quot; ');
  assert.equal(grandChildValueIndex, 4);
  assert.equal(serializer.html[3], 'width=&amp;quot;');
  assert.equal(serializer.html[5], '&amp;quot; ');
});

QUnit.test('fullyQualifiedURL', function(assert) {
  var serializer = new HTMLSerializer();
  var iframe = document.createElement('iframe');
  iframe.setAttribute('src', 'page.html');
  var url = serializer.fullyQualifiedURL(iframe);
  var href = window.location.href;
  var path = href.slice(0, href.lastIndexOf('/'));
  assert.equal(path + '/page.html', url.href);
});

QUnit.test('processSrcHole: top window', function(assert) {
  var serializer = new HTMLSerializer();
  var iframe = document.createElement('iframe');
  iframe.setAttribute('src', 'tests.html');
  serializer.processSrcHole(iframe);
  assert.equal(serializer.html[0], 'src="');
  assert.equal(serializer.html[1], '');
  assert.equal(serializer.html[2], '" ');
  assert.equal(serializer.srcHoles[1], window.location.href);
  assert.equal(Object.keys(serializer.srcHoles).length, 1);
});

QUnit.test('processSrcAttribute: iframe', function(assert) {
  var serializer = new HTMLSerializer();
  var iframe = document.createElement('iframe');
  iframe.setAttribute('src', 'tests.html');
  serializer.processSrcAttribute(iframe);
  assert.equal(serializer.html.length, 0);
  assert.equal(Object.keys(serializer.srcHoles).length, 0);
});

QUnit.test('processSrcAttribute: audio', function(assert) {
  var serializer = new HTMLSerializer();
  var audio = document.createElement('audio');
  audio.setAttribute('src', 'tests.html');
  serializer.processSrcAttribute(audio);
  assert.equal(serializer.html[0], `src="${window.location.href}" `);
  assert.equal(serializer.html.length, 1);
  assert.equal(Object.keys(serializer.srcHoles).length, 0);
});

QUnit.test('processSrcAttribute: img', function(assert) {
  var serializer = new HTMLSerializer();
  var img = document.createElement('img');
  img.setAttribute('src', 'tests.html');
  serializer.processSrcAttribute(img);
  assert.equal(serializer.html[0], 'src="');
  assert.equal(serializer.html[1], '');
  assert.equal(serializer.html[2], '" ');
  assert.equal(serializer.srcHoles[1], window.location.href);
  assert.equal(Object.keys(serializer.srcHoles).length, 1);
});

QUnit.test('processTree: single node', function(assert) {
  var fixture = document.getElementById('qunit-fixture');
  var node = document.createElement('div');
  node.appendChild(document.createTextNode('test'));
  fixture.appendChild(node);
  var serializer = new HTMLSerializer();
  serializer.processTree(node);
  assert.equal(Object.keys(serializer.srcHoles).length, 0);
  assert.equal(Object.keys(serializer.frameHoles).length, 0);
});

QUnit.test('HTMLSerializer class loaded twice', function(assert) {
  assert.expect(0);
  var done = assert.async();
  var fixture = document.getElementById('qunit-fixture');
  var script1 = document.createElement('script');
  var script2 = document.createElement('script');
  script1.setAttribute('src', '../HTMLSerializer.js');
  script2.setAttribute('src', '../HTMLSerializer.js');
  fixture.appendChild(script1);
  fixture.appendChild(script2);
  setTimeout(function() {
    done();
  }, 0);
});

QUnit.test('processTree: no closing tag', function(assert) {
  var serializer = new HTMLSerializer();
  var img = document.createElement('img');
  serializer.processTree(img);
  assert.equal(serializer.html[0], '<img ');
  assert.equal(
    serializer.html[1],
    `style="${window.getComputedStyle(img, null).cssText}" `
  );
  assert.equal(serializer.html[3], '>')
  assert.equal(serializer.html.length, 4);
});

QUnit.test('processTree: closing tag', function(assert) {
  var serializer = new HTMLSerializer();
  var p = document.createElement('p');
  serializer.processTree(p);
  assert.equal(serializer.html[0], '<p ');
  assert.equal(
    serializer.html[1],
    `style="${window.getComputedStyle(p, null).cssText}" `
  );
  assert.equal(serializer.html[3], '>');
  assert.equal(serializer.html[4], '</p>');
  assert.equal(serializer.html.length, 5);
});

QUnit.test(
  'processAttributes: img with height and width attributes',
  function(assert) {
    var serializer = new HTMLSerializer();
    var fixture = document.getElementById('qunit-fixture');
    var img = document.createElement('img');
    img.setAttribute('height', 5);
    img.setAttribute('width', 5);
    fixture.appendChild(img);
    serializer.processAttributes(img, 'id');
    var styleText = serializer.html[0];
    assert.ok(styleText.includes(' height: 5px;'));
    assert.ok(styleText.includes(' width: 5px;'));
  }
);

QUnit.test(
  'processAttributes: img without height and width attributes',
  function(assert) {
    var serializer = new HTMLSerializer();
    var fixture = document.getElementById('qunit-fixture');
    var img = document.createElement('img');
    fixture.appendChild(img);
    var style = window.getComputedStyle(img, null);
    serializer.processAttributes(img, 'id');
    var styleText = serializer.html[0];
    assert.ok(styleText.includes(` height: ${style.height};`));
    assert.ok(styleText.includes(` width: ${style.width};`));
  }
);

QUnit.test(
  'processAttributes: img with height and width attributes and inline style',
  function(assert) {
    var serializer = new HTMLSerializer();
    var fixture = document.getElementById('qunit-fixture');
    var img = document.createElement('img');
    img.setAttribute('height', 5);
    img.setAttribute('width', 5);
    img.setAttribute('style', 'height: 10px; width: 10px;');
    fixture.appendChild(img);
    serializer.processAttributes(img, 'id');
    var styleText = serializer.html[0];
    assert.ok(styleText.includes(' height: 10px;'));
    assert.ok(styleText.includes(' width: 10px;'));
    assert.notOk(styleText.includes(' height: 5px;'));
    assert.notOk(styleText.includes(' width: 5px;'));
  }
);

QUnit.test('processText: simple text node', function(assert) {
  var serializer = new HTMLSerializer();
  var fixture = document.getElementById('qunit-fixture');
  var node = document.createTextNode('Simple text');
  fixture.appendChild(node);
  serializer.processText(node);
  assert.equal(serializer.html[0], 'Simple text');
});

QUnit.test('processText: escaped characters', function(assert) {
  var serializer = new HTMLSerializer();
  var fixture = document.getElementById('qunit-fixture');
  var node = document.createTextNode(`<div> with '&"`);
  fixture.appendChild(node);
  serializer.processText(node);
  assert.equal(
    serializer.html[0],
    '&lt;div&gt; with &#39;&amp;&quot;'
  );
});

QUnit.test('processText: nested escaped characters', function(assert) {
  var serializer = new HTMLSerializer();
  var fixture = document.getElementById('qunit-fixture');
  var childFrame = document.createElement('iframe');
  var grandChildFrame = document.createElement('iframe');
  fixture.appendChild(childFrame);
  var childFrameBody = childFrame.contentDocument.body;
  childFrameBody.appendChild(grandChildFrame);
  var grandChildFrameBody = grandChildFrame.contentDocument.body;
  var node1 = document.createTextNode(`<div> with '&"`);
  var node2 = document.createTextNode(`<div> with '&"`);
  childFrameBody.appendChild(node1);
  grandChildFrameBody.appendChild(node2);
  serializer.processText(node1);
  serializer.processText(node2);
  assert.equal(
    serializer.html[0],
    '&amp;lt;div&amp;gt; with &amp;#39;&amp;amp;&amp;quot;'
  );
  assert.equal(
    serializer.html[1],
    '&amp;amp;lt;div&amp;amp;gt; with &amp;amp;#39;&amp;amp;amp;&amp;amp;quot;'
  );
});

QUnit.test('processPseudoElements', function(assert) {
  var serializer = new HTMLSerializer();
  var fixture = document.getElementById('qunit-fixture');
  var element = document.createElement('div');
  var style = document.createElement('style');
  style.appendChild(document.createTextNode('div::before{content:"test";}'));
  fixture.appendChild(style);
  fixture.appendChild(element);
  serializer.processPseudoElements(element, 'myId');
  var styleText = window.getComputedStyle(element, ':before').cssText;
  assert.equal(serializer.pseudoElementCSS.length, 1);
  assert.equal(serializer.pseudoElementCSS[0], `#myId::before{${styleText}} `);
});

QUnit.test('processTree: element without id', function(assert) {
  var serializer = new HTMLSerializer();
  var fixture = document.getElementById('qunit-fixture');
  var element = document.createElement('div');
  fixture.appendChild(element);
  serializer.processTree(element);
  assert.equal(serializer.html[0], '<div ');
  assert.equal(serializer.html[2], 'id="snap-it0" ');
  assert.equal(serializer.html[3], '>');
});

QUnit.test('processTree: element with id', function(assert) {
  var serializer = new HTMLSerializer();
  var fixture = document.getElementById('qunit-fixture');
  var element = document.createElement('div');
  element.setAttribute('id', 'myId');
  fixture.appendChild(element);
  serializer.processTree(element);
  assert.equal(serializer.html[0], '<div ');
  assert.equal(serializer.html[2], 'id="myId" ');
  assert.equal(serializer.html[3], '>');
});

QUnit.test('processTree: generated id exists', function(assert) {
  var serializer = new HTMLSerializer();
  var fixture = document.getElementById('qunit-fixture');
  var span = document.createElement('span');
  span.setAttribute('id', 'snap-it0');
  fixture.appendChild(span);
  var element = document.createElement('div');
  fixture.appendChild(element);
  serializer.processTree(element);
  assert.equal(serializer.html[0], '<div ');
  assert.equal(serializer.html[2], 'id="snap-it1" ');
  assert.equal(serializer.html[3], '>');
});

QUnit.test('generateIdGenerator', function(assert) {
  var serializer = new HTMLSerializer();
  var fixture = document.getElementById('qunit-fixture');
  var div = document.createElement('div');
  fixture.appendChild(div);
  var generateId = serializer.generateIdGenerator();
  assert.equal(generateId(document), 'snap-it0');
  assert.equal(generateId(document), 'snap-it1');
  div.setAttribute('id', 'snap-it2');
  assert.equal(generateId(document), 'snap-it3');
});

QUnit.test('escapedUnicodeString: html', function(assert) {
  var serializer = new HTMLSerializer();
  var fixture = document.getElementById('qunit-fixture');
  var div = document.createElement('div');
  div.appendChild(document.createTextNode('i \u2665 \u0073f'));
  var string = div.childNodes[0].textContent;
  assert.equal(
    serializer.escapedUnicodeString(string, serializer.INPUT_TEXT_TYPE.HTML),
    'i &#9829; sf'
  );
});

QUnit.test('escapedUnicodeString: css', function(assert) {
  var serializer = new HTMLSerializer();
  var fixture = document.getElementById('qunit-fixture');
  var div = document.createElement('div');
  div.appendChild(document.createTextNode('i \u2665 \u0073f'));
  var string = div.childNodes[0].textContent;
  assert.equal(
    serializer.escapedUnicodeString(string, serializer.INPUT_TEXT_TYPE.CSS),
    'i \\2665 sf'
  );
});

QUnit.test('fullyQualifiedFontURL', function(assert) {
  var serializer = new HTMLSerializer();
  var href = 'http://www.example.com/path/page/';
  var url1 = '/hello/world/';
  assert.equal(
    serializer.fullyQualifiedFontURL(href, url1),
    'http://www.example.com/hello/world/'
  );
  var url2 = './hello/world/';
  assert.equal(
    serializer.fullyQualifiedFontURL(href, url2),
    'http://www.example.com/path/./hello/world/'
  );
  var url3 = '../hello/world/';
  assert.equal(
    serializer.fullyQualifiedFontURL(href, url3),
    'http://www.example.com/path/../hello/world/'
  );
  var url4 = 'http://www.google.com/';
  assert.equal(
    serializer.fullyQualifiedFontURL(href, url4),
    'http://www.google.com/'
  );
  var url5 = 'hello/world/';
  assert.equal(
    serializer.fullyQualifiedFontURL(href, url5),
    'http://www.example.com/path/hello/world/'
  );
});

QUnit.test('processCSSFonts: no line breaks in declaration', function(assert) {
  var serializer = new HTMLSerializer();
  var cssText = 'body{color:red;}' +
      '@font-face{font-family:Font;src:url("/hello/")}';
  var href = 'http://www.example.com/';
  serializer.processCSSFonts(window, href, cssText);
  assert.equal(
    serializer.fontCSS[0],
    '@font-face{font-family:Font;src:url("http://www.example.com/hello/")}'
  );
});

QUnit.test('processCSSFonts: line breaks in declaration', function(assert) {
  var serializer = new HTMLSerializer();
  var cssText = 'body{color:red;}' +
      '@font-face { font-family:Font;\nsrc:url("/goodbye/")}';
  var href = 'http://www.url.com/';
  serializer.processCSSFonts(window, href, cssText);
  assert.equal(
    serializer.fontCSS[0],
    '@font-face { font-family:Font;\nsrc:url("http://www.url.com/goodbye/")}'
  );
});

QUnit.test('loadFonts', function(assert) {
  var serializer = new HTMLSerializer();
  serializer.loadFonts(document);
  assert.equal(serializer.html[0], '');
  assert.equal(serializer.fontPlaceHolderIndex, 0);
  assert.equal(
    serializer.crossOriginStyleSheets[0],
    'https://code.jquery.com/qunit/qunit-2.0.0.css'
  );
});

QUnit.test('escapedCharacterString', function(assert) {
  var serializer =  new HTMLSerializer();
  var str = serializer.escapedCharacterString(`hello &>'<& "`, 2);
  assert.equal(
    str,
    'hello &amp;amp;&amp;gt;&amp;#39;&amp;lt;&amp;amp; &amp;quot;'
  );
});

QUnit.test('unescapeHTML', function(assert) {
  var html = '&amp;lt;div&amp;gt;&amp;lt;/div&amp;gt;';
  var unescapedHTML = unescapeHTML(html, 2);
  assert.equal(unescapedHTML, '<div></div>');
});

QUnit.test('minimizeStyles', function(assert) {
  var message = {
    'html': [
        '<div id="myId"',
        'style="animation-delay: 0s; width: 5px;" ',
        '></div>'
    ],
    'frameHoles': null,
    'idToStyleIndex': {"myId": 1},
    'idToStyleMap': {
      'myId': {
        'animation-delay': '0s',
        'width': '5px'
      }
    },
    'windowHeight': 5,
    'windowWidth': 5,
    'frameIndex': '0'
  };
  minimizeStyles(message);
  assert.equal(message.html[1], 'style="width: 5px;" ');
});

QUnit.test('minimizeStyle', function(assert) {
  var fixture = document.getElementById('qunit-fixture');
  var div = document.createElement('div');
  div.setAttribute('id', 'myId');
  div.setAttribute('style', 'animation-delay: 0s; width: 5px;');
  fixture.appendChild(div);
  var message = {
    'html': [
        '<div id="myId"',
        'style="animation-delay: 0s; width: 5px;" ',
        '></div>'
    ],
    'frameHoles': null,
    'idToStyleIndex': {"myId": 1},
    'idToStyleMap': {
      'myId': {
        'animation-delay': '0s',
        'width': '5px'
      }
    },
    'windowHeight': 5,
    'windowWidth': 5,
    'frameIndex': '0'
  };
  minimizeStyle(message, document, div, 'myId', 1);
  assert.equal(message.html[1], 'style="width: 5px;" ');
});

QUnit.test('serialize tree: end-to-end, no style', function(assert) {
  var serializer = new HTMLSerializer();
  var fixture = document.getElementById('qunit-fixture');
  var iframe = document.createElement('iframe');
  fixture.appendChild(iframe);
  var div = document.createElement('div');
  div.appendChild(document.createTextNode('hello world'));
  iframe.contentDocument.body.appendChild(div);
  serializer.processTree(div);
  var win = div.ownerDocument.defaultView;
  var message = {
    'html': serializer.html,
    'frameHoles': serializer.frameHoles,
    'idToStyleIndex': serializer.idToStyleIndex,
    'idToStyleMap': {
      'snap-it0': {
        'animation-delay': '0s'
      }
    },
    'windowHeight': serializer.windowHeight,
    'windowWidth': serializer.windowWidth,
    'frameIndex': serializer.iframeFullyQualifiedName(win)
  };
  var html = unescapeHTML(outputHTMLString([message]), 1);
  assert.equal(html, '<div id="snap-it0" >hello world</div>');
});

QUnit.test('serialize tree: end-to-end, style', function(assert) {
  var serializer = new HTMLSerializer();
  var fixture = document.getElementById('qunit-fixture');
  var iframe = document.createElement('iframe');
  fixture.appendChild(iframe);
  var div = document.createElement('div');
  div.appendChild(document.createTextNode('hello world'));
  iframe.contentDocument.body.appendChild(div);
  var style = document.createElement('style');
  style.innerHTML = 'div { border: 1px solid blue; }';
  iframe.contentDocument.body.appendChild(style);
  serializer.processTree(div);
  var win = div.ownerDocument.defaultView;
  var message = {
    'html': serializer.html,
    'frameHoles': serializer.frameHoles,
    'idToStyleIndex': serializer.idToStyleIndex,
    'idToStyleMap': {
      'snap-it0': {
        'animation-delay': '0s',
        'border-bottom-color': 'rgb(0, 0, 255)',
        'border-bottom-style': 'solid',
        'border-bottom-width': '4px',
        'border-left-color': 'rgb(0, 0, 255)',
        'border-left-style': 'solid',
        'border-left-width': '4px',
        'border-right-color': 'rgb(0, 0, 255)',
        'border-right-style': 'solid',
        'border-right-width': '4px',
        'border-top-color': 'rgb(0, 0, 255)',
        'border-top-style': 'solid',
        'border-top-width': '4px',
        'width': '276px',
        'perspective-origin': '142px 24px',
        'transform-origin': '142px 24px'
      }
    },
    'windowHeight': serializer.windowHeight,
    'windowWidth': serializer.windowWidth,
    'frameIndex': serializer.iframeFullyQualifiedName(win)
  };
  var html = unescapeHTML(outputHTMLString([message]), 1);
  assert.equal(
    html,
    '<div style="border-bottom-color: rgb(0, 0, 255); border-bottom-style: ' +
    'solid; border-bottom-width: 4px; border-left-color: rgb(0, 0, 255); ' +
    'border-left-style: solid; border-left-width: 4px; border-right-color: ' +
    'rgb(0, 0, 255); border-right-style: solid; border-right-width: 4px; ' +
    'border-top-color: rgb(0, 0, 255); border-top-style: solid; ' + 
    'border-top-width: 4px; width: 276px; perspective-origin: 142px 24px; ' +
    'transform-origin: 142px 24px;" id="snap-it0" >hello world</div>'
  );
});

QUnit.test('processTree: head tag', function(assert) {
  var serializer = new HTMLSerializer();
  var head = document.createElement('head');
  serializer.processTree(head);
  assert.equal(serializer.fontPlaceHolderIndex, 4);
  assert.equal(serializer.pseudoElementPlaceHolderIndex, 5);
});

QUnit.test('minimizeStyles: root html tag', function(assert) {
  var message = {
    'html': [
        '<html id="myId" ',
        'style="animation-delay: 0s; width: 5px;" ',
        '></html>'
    ],
    'frameHoles': null,
    'idToStyleIndex': {},
    'idToStyleMap': {
      'myId': {
        'animation-delay': '0s',
        'width': '5px'
      }
    },
    'windowHeight': 5,
    'windowWidth': 5,
    'rootId': 'myId',
    'rootStyleIndex': 1,
    'frameIndex': '0'
  };
  minimizeStyles(message);
  assert.equal(message.html[1], 'style="width: 5px;" ');
});

QUnit.test('processAttributes: escaping characters', function(assert) {
  var serializer = new HTMLSerializer();
  var fixture = document.getElementById('qunit-fixture');
  var div = document.createElement('div');
  div.setAttribute('name', '<">');
  fixture.appendChild(div);
  serializer.processAttributes(div, 'myId');
  assert.equal(serializer.html[2], 'name="&lt;&quot;&gt;" ');
});

QUnit.test('window size comment', function(assert) {
  var serializer = new HTMLSerializer();
  serializer.processDocument(document);
  assert.equal(
    serializer.html[1],
    `<!-- Original window height: ${window.innerHeight}. -->\n`
  );
  assert.equal(
    serializer.html[2],
    `<!-- Original window width: ${window.innerWidth}. -->\n`
  );
});

QUnit.test('processDocument: doctype tag', function(assert) {
  var serializer = new HTMLSerializer();
  serializer.processDocument(document);
  assert.equal(serializer.html[0], '<!DOCTYPE html>\n');
});

QUnit.test('processDocument: no doctype tag', function(assert) {
  var serializer = new HTMLSerializer();
  var fixture = document.getElementById('qunit-fixture');
  var iframe = document.createElement('iframe');
  fixture.appendChild(iframe);
  serializer.processDocument(iframe.contentDocument);
  assert.notEqual(serializer.html[0], '<!DOCTYPE html>\n');
});

QUnit.test('escapedQuote', function(assert) {
  assert.equal(escapedQuote(0), '"');
  assert.equal(escapedQuote(1), '&quot;');
  assert.equal(escapedQuote(3), '&amp;amp;quot;');
});

QUnit.test('buildStyleAttribute', function(assert) {
  var styleMap = {
    'color': 'blue',
    'background-color': 'red'
  }
  assert.equal(
      buildStyleAttribute(styleMap),
      'color: blue; background-color: red;');
});

QUnit.test('updateMinimizedStyleMap: no update', function(assert) {
  var fixture = document.getElementById('qunit-fixture');
  var div = document.createElement('div');
  div.setAttribute('id', 'myId');
  div.setAttribute('style', 'animation-delay: 0s; width: 5px;');
  fixture.appendChild(div);
  var originalStyleMap = {
    'animation-delay': '0s',
    'width': '5px'
  };
  var requiredStyleMap = {
    'width': '5px'
  };
  var updated = updateMinimizedStyleMap(
      document,
      div,
      originalStyleMap,
      requiredStyleMap,
      null);
  assert.notOk(updated);
  assert.equal(Object.keys(requiredStyleMap).length, 1);
  assert.equal(requiredStyleMap.width, '5px');
});

QUnit.test('updateMinimizedStyleMap: update', function(assert) {
  var fixture = document.getElementById('qunit-fixture');
  var div = document.createElement('div');
  div.setAttribute('id', 'myId');
  div.setAttribute('style', 'animation-delay: 0s; width: 5px;');
  fixture.appendChild(div);
  var originalStyleMap = {
    'animation-delay': '0s',
    'width': '5px'
  };
  var requiredStyleMap = {};
  var updated = updateMinimizedStyleMap(
      document,
      div,
      originalStyleMap,
      requiredStyleMap,
      null);
  assert.ok(updated);
  assert.equal(Object.keys(requiredStyleMap).length, 1);
  assert.equal(requiredStyleMap.width, '5px');
});
