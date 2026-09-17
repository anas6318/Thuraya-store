import test from 'node:test';
import assert from 'node:assert/strict';
import {rememberHistory} from '../../shared/local-history.ts';
test('malformed history never throws in storefront flows',()=>{
 for(const value of ['broken','{}','null','42'])assert.deepEqual(rememberHistory('key','Polaris',6,{getItem:()=>value,setItem:()=>{}}),['Polaris']);
});
test('history is bounded deduplicated and excludes non-string values',()=>{
 assert.deepEqual(rememberHistory('key','b',3,{getItem:()=>'["a",1,"b","a","c"]',setItem:()=>{}}),['b','a','c']);
});
test('blocked and quota-exhausted storage do not break history operations',()=>{
 assert.deepEqual(rememberHistory('key','a',6,{getItem:()=>{throw Error('blocked')},setItem:()=>{}}),['a']);
 assert.deepEqual(rememberHistory('key','a',6,{getItem:()=>'["b"]',setItem:()=>{throw Error('quota')}}),['a','b']);
});
