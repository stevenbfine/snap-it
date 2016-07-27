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

QUnit.test('escapedQuote: zero depth', function(assert) {
  var serializer = new HTMLSerializer();
  assert.equal(serializer.escapedQuote(0), '"');
});

QUnit.test('escapedQuote: nonzero depth', function(assert) {
  var serializer = new HTMLSerializer();
  assert.equal(serializer.escapedQuote(1), '&quot;');
  assert.equal(serializer.escapedQuote(2), '&amp;quot;');
  assert.equal(serializer.escapedQuote(3), '&amp;amp;quot;');
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

QUnit.test('fullyQualifiedURL', function(assert) {
  var serializer = new HTMLSerializer();
  var iframe = document.createElement('iframe');
  iframe.setAttribute('src', 'tests.html');
  var url = serializer.fullyQualifiedURL(iframe);
  assert.equal(window.location.href, url.href);
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
  serializer.processTree(node, 0);
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
  assert.equal(serializer.html[2], '>');
  assert.equal(serializer.html.length, 3);
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
  assert.equal(serializer.html[2], '>');
  assert.equal(serializer.html[3], '</p>');
  assert.equal(serializer.html.length, 4);
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
    serializer.processAttributes(img);
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
    serializer.processAttributes(img);
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
    serializer.processAttributes(img);
    var styleText = serializer.html[0];
    assert.ok(styleText.includes(' height: 10px;'));
    assert.ok(styleText.includes(' width: 10px;'));
    assert.notOk(styleText.includes(' height: 5px;'));
    assert.notOk(styleText.includes(' width: 5px;'));
  }
);
