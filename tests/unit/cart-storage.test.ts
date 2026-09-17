import {test} from 'node:test';
import assert from 'node:assert/strict';
import {restoreCart,restoreIds} from '../../shared/cart-storage.ts';

test('cart storage rejects malformed rows and restores bounded valid lines',()=>{
 assert.deepEqual(restoreCart({}),[]);
 assert.deepEqual(restoreCart([{productId:'p1',variantId:'v1',quantity:1},{productId:'bad value',variantId:'v2',quantity:1},{productId:'p3',variantId:'v3',quantity:11}]),[{productId:'p1',variantId:'v1',quantity:1}]);
});
test('cart storage merges duplicate variants without accepting cross-product conflicts',()=>{
 assert.deepEqual(restoreCart([{productId:'p1',variantId:'v1',quantity:6},{productId:'p1',variantId:'v1',quantity:6},{productId:'p2',variantId:'v1',quantity:1}]),[{productId:'p1',variantId:'v1',quantity:10}]);
});
test('wishlist storage keeps only bounded identifier values',()=>{
 assert.deepEqual(restoreIds(['p1','p1',' bad ','p2',1],1),['p1']);
});
