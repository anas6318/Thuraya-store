import test from 'node:test';
import assert from 'node:assert/strict';
import {splitLatinRuns} from '../../src/components/bidi.ts';
test('Latin model names inside Arabic are isolated as whole runs',()=>{const runs=splitLatinRuns('تجريبي · قلادة Polaris');assert.deepEqual(runs.filter((_,i)=>i%2),['Polaris']);assert.equal(runs.join(''),'تجريبي · قلادة Polaris')});
test('Multi-word Latin names and grades stay in one isolated run',()=>{assert.deepEqual(splitLatinRuns('خاتم Royal Asscher بحجر VVS1').filter((_,i)=>i%2),['Royal Asscher','VVS1'])});
test('Hebrew copy without Latin is returned untouched',()=>{assert.deepEqual(splitLatinRuns('צמיד טניס'),['צמיד טניס'])});
