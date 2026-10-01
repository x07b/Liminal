import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, readdirSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createMarkStore, createMarksHandler } from './marks.js';

const input = (overrides={}) => ({name:'Visiteur test',ink:'terracotta',x:50,y:50,rotation:-10,requestId:randomUUID(),...overrides});
function database(t, beforeCleanup = async () => {}) {
  const dir=mkdtempSync(join(tmpdir(),'liminal-marks-test-'));
  const filename=join(dir,'marks.sqlite');
  t.after(async()=>{await beforeCleanup();for(const file of readdirSync(dir))unlinkSync(join(dir,file));rmdirSync(dir);});
  return filename;
}
async function fixture(t, options) {
  let store, server;
  const filename=database(t,async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));store.close();});
  store=createMarkStore(filename);
  server=createServer(createMarksHandler(store,options));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}`;
  const post=(body,headers={})=>fetch(url+'/api/marks',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
  return {url,post,store};
}

test('published marks are shared, idempotent and expose no request token',async t=>{
  const {url,post}=await fixture(t);
  const body=input({name:' عزيز '});
  const response=await post(body);assert.equal(response.status,201);
  const {mark}=await response.json();assert.equal(mark.name,'عزيز');assert.ok(mark.id);assert.equal(mark.request_id,undefined);
  const repeat=await post(body);assert.equal(repeat.status,200);assert.equal((await repeat.json()).mark.id,mark.id);
  const reader=await (await fetch(url+'/api/marks')).json();assert.equal(reader.total,1);assert.equal(reader.marks[0].id,mark.id);
});

test('a mark survives closing and reopening the database; history is paginated',t=>{
  const filename=database(t);let store=createMarkStore(filename);
  for(let i=0;i<27;i++)store.add(input({name:`Visitor ${i}`}));
  store.close();store=createMarkStore(filename);
  assert.equal(store.list().total,27);assert.equal(store.list().marks.length,24);
  assert.equal(store.list(1).marks.length,3);assert.equal(store.list(999).page,1);
  assert.equal(store.list(1).marks.at(-1).name,'Visitor 0');store.close();
});

test('invalid input, scripts, out-of-bounds coordinates and cross-origin writes are rejected',async t=>{
  const {url,post}=await fixture(t);
  for(const overrides of [{name:''},{name:'<script>alert(1)</script>'},{name:'x'.repeat(25)},{x:101},{x:'50'},{rotation:999},{ink:'red'},{website:'spam'}])assert.equal((await post(input(overrides))).status,400);
  assert.equal((await post('{')).status,400);
  assert.equal((await post('x'.repeat(2500))).status,413);
  assert.equal((await post(input(),{Origin:'https://another-site.example'})).status,403);
  assert.equal((await fetch(url+'/api/marks?page=-1')).status,400);
  assert.equal((await fetch(url+'/api/marks',{method:'DELETE'})).status,405);
  assert.equal((await (await fetch(url+'/api/marks')).json()).total,0);
});

test('rate limiting preserves already published marks and allows safe retries',async t=>{
  const {url,post}=await fixture(t,{limit:1});const body=input();
  assert.equal((await post(body)).status,201);
  const blocked=await post(input());assert.equal(blocked.status,429);assert.ok(blocked.headers.get('Retry-After'));
  assert.equal((await post(body)).status,200);
  assert.equal((await (await fetch(url+'/api/marks')).json()).total,1);
});
