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
  console.log(childFrameBody);
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


// TODO(sfine): How to test fullyQualifiedURL, if the resource doesn't exist?
// QUnit.test('fullyQualifiedURL', function(assert) {
// });

// QUnit.test('processSrcHole: top window', function(assert) {
//   var serializer = new HTMLSerializer();
//   var img = document.createElement('img');
//   img.setAttribute('src', 'url');
//   serializer.processSrcHole(img);
//   assert.equal()
// });

QUnit.test('processSrcAttribute: iframe', function(assert) {
  var serializer = new HTMLSerializer();
  var iframe = document.createElement('iframe');
  iframe.setAttribute('src', 'url');
  serializer.processSrcAttribute(iframe);
  assert.equal(serializer.html.length, 0);
  assert.equal(Object.keys(serializer.srcHoles).length, 0);
  assert.equal(Object.keys(serializer.frameHoles).length, 0);
});

// TODO(sfine): Test the src attribute, if it will turn it into a full url?
// QUnit.test('processSrcAttribute: audio', function(assert) {
//   var serializer = new HTMLSerializer();
//   var audio = document.createElement('audio');
//   audio.setAttribute('src', 'url');
//   serializer.processSrcAttribute(audio);
//   assert.equal(serializer.html[0], 'src="url" ');
// });

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
  script1.setAttribute('src', '../content_script.js');
  script2.setAttribute('src', '../content_script.js');
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