QUnit.test('getDepth: no parent window', function(assert) {
  var serializer = new HTMLSerializer();
  assert.equal(serializer.getDepth(window), 0);
});

QUnit.test('getDepth: multiple parent windows', function(assert) {
  var serializer = new HTMLSerializer();
  var fixture = document.getElementById('qunit-fixture');
  var childFrame = document.createElement('iframe');
  fixture.appendChild(childFrame);
  var childFrameBody = childFrame.contentDocument.body;
  var grandChildFrame = document.createElement('iframe');
  childFrameBody.appendChild(grandChildFrame);
  assert.equal(serializer.getDepth(childFrame.contentWindow), 1);
  assert.equal(serializer.getDepth(grandChildFrame.contentWindow), 2);
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
  assert.equal(serializer.iframeFullyQualifiedName(childFrame1.contentWindow), '0.0');
  assert.equal(serializer.iframeFullyQualifiedName(childFrame2.contentWindow), '0.1');
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
  assert.equal(serializer.iframeFullyQualifiedName(grandChildFrame1.contentWindow), '0.0.0');
  assert.equal(serializer.iframeFullyQualifiedName(grandChildFrame1.contentWindow), '0.0.0');
  assert.equal(serializer.iframeFullyQualifiedName(grandChildFrame2.contentWindow), '0.0.1');
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