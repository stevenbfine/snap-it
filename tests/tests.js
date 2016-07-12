QUnit.test("serializeTree with a single node", function(assert) {
  var fixture = document.getElementById('qunit-fixture');
  var node = document.createElement('div');
  node.appendChild(document.createTextNode('test'));
  fixture.appendChild(node);
  var html = new HTMLSerializer();
  html.serializeTree(node, 0);
  assert.equal(0, Object.keys(html.srcHoles).length);
  assert.equal(0, Object.keys(html.frameHoles).length);
  assert.equal(1, html.styleIndices.length);
});
