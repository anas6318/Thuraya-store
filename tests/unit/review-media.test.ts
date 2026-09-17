import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reviewPhotoAllowed,deliveryWidth} from '../../shared/review-media.ts';
test('review uploads allow supported raster files only',()=>{assert.ok(reviewPhotoAllowed('image/jpeg',100,'photo.jpg'));for(const [mime,name] of [['image/svg+xml','x.svg'],['video/mp4','x.mp4'],['application/pdf','x.pdf'],['image/jpeg','x.html']])assert.equal(reviewPhotoAllowed(mime,100,name),false)});
test('review upload byte limits reject zero, fractional and oversized files',()=>{for(const bytes of [0,1.2,5242881,Infinity])assert.equal(reviewPhotoAllowed('image/png',bytes,'x.png'),false)});
test('media delivery allows bounded derivative widths only',()=>{assert.equal(deliveryWidth(null),1080);for(const width of ['320','640','1080'])assert.equal(deliveryWidth(width),Number(width));for(const width of ['10000','-1','abc'])assert.equal(deliveryWidth(width),null)});
