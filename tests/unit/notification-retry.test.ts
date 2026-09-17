import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canRetry} from '../../shared/logic.ts';
import type {Notification} from '../../shared/domain.ts';
const failure={status:'failed',attempts:1} as Notification;
test('Admin cannot retry an ambiguous provider outcome',()=>assert.equal(canRetry({...failure,uncertain:true}),false));
test('Admin cannot retry an expired provider idempotency window',()=>assert.equal(canRetry({...failure,firstAttemptAt:new Date(Date.now()-24*3600000).toISOString()}),false));
test('Admin can retry a recent known failure within attempt limit',()=>assert.equal(canRetry({...failure,firstAttemptAt:new Date().toISOString(),uncertain:false}),true));
