suite('Dummy test', function(){
  setup(function(){
    console.log('This is setup');
  });

  suite('#indexOf()', function(){
    test('should return -1 when not present', function(){
      chai.assert.equal(-1, [1,2,3].indexOf(4));
    });
  });

  teardown(function() {
      console.log('This is teardown');
  });
});
