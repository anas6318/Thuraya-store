import assert from 'node:assert/strict';
import test from 'node:test';
import {previewDemoEnabled,storefrontDemoEnabled} from '../../shared/preview-demo.ts';

test('preview demo requires explicit opt-in and the Vercel Preview context',()=>{
  assert.equal(previewDemoEnabled('true','preview'),true);
  assert.equal(previewDemoEnabled(undefined,'preview'),false);
  assert.equal(previewDemoEnabled('false','preview'),false);
  assert.equal(previewDemoEnabled('true','production'),false);
  assert.equal(previewDemoEnabled('true','development'),false);
});

test('a configured or partially configured backend never falls back to preview fixtures',()=>{
  assert.equal(storefrontDemoEnabled(false,false,true),true);
  assert.equal(storefrontDemoEnabled(true,false,true),false);
  assert.equal(storefrontDemoEnabled(true,true,true),false);
  assert.equal(storefrontDemoEnabled(false,false,false),false);
});
