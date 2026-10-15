import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdminSession,validAdminSession} from '../src/lib/admin-session';

const secret='local-test-admin-token-must-be-at-least-24-chars';
test('admin session signed, expiring and bound to secret',async()=>{
 const session=await createAdminSession(secret);
 assert.equal(await validAdminSession(session,secret),true);
 assert.equal(await validAdminSession(session,secret+'other'),false);
 assert.equal(await validAdminSession(session.replace(/.$/,'0'),secret),false);
 assert.equal(await validAdminSession(secret,secret),false);
 assert.equal(await validAdminSession(null,secret),false);
});
test('rejects stale and implausibly distant session tokens',async()=>{
 const session=await createAdminSession(secret);
 const pieces=session.split('.');
 pieces[1]=String(Date.now()-10_000);
 assert.equal(await validAdminSession(pieces.join('.'),secret),false);
 pieces[1]=String(Date.now()+50*60*60*1000);
 assert.equal(await validAdminSession(pieces.join('.'),secret),false);
});
