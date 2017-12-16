import QUnit from 'qunit'
import Client from '../client'

QUnit.test( "hello test", function( assert ) {
  assert.ok( 1 == "1", "Passed!" );
});

QUnit.start();

