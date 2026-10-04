const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname,'../hosting/public/support.html'),'utf8');
const script = html.match(/<script type="text\/x-dc" data-dc-script>([\s\S]*?)<\/script>/)[1];
const png = fs.readFileSync(path.join(__dirname,'../hosting/public/assets/img/app-icon-512.png'));
const file = (extra = {}) => ({name:'example.png',type:'image/png',size:png.length,bytes:png,...extra});
function setup(response = {ok:true}) {
  const calls = [];
  class DCLogic {
    setState(update) { this.state = {...this.state,...(typeof update==='function' ? update(this.state) : update)}; }
  }
  class FileReader {
    readAsDataURL(f) { this.result = `data:${f.type};base64,${f.bytes.toString('base64')}`; queueMicrotask(()=>this.onload()); }
  }
  const Component = vm.runInNewContext(script+'\nComponent',{
    DCLogic, FileReader,
    window:{location:{protocol:'https:'},__getAppCheckToken:async()=>'test-token'},
    fetch:async(url, options)=>{ calls.push({url,...options}); return response; },
  });
  const component = new Component();
  component.state.fields = {name:'Test',email:'test@example.com',category:'bug',appVersion:'1',iosVersion:'17',message:'test'};
  return {component,calls};
}
const select = (component,files) => component.onChangeAttachments({target:{files,value:'test'}});

test('selection, append, removal, count/type/size/total validation preserve accepted images',async()=>{
  const {component:c}=setup();
  await select(c,[file()]);
  assert.equal(c.state.attachments.length,1);
  assert.equal(c.renderVals().attachments[0].name,'example.png');
  await select(c,[file(),file(),file()]);
  assert.match(c.state.attachmentError,/最大3枚/);
  assert.equal(c.state.attachments.length,1);
  await select(c,[file({type:'application/pdf'})]);
  assert.match(c.state.attachmentError,/形式/);
  await select(c,[file({size:5*1024*1024+1})]);
  assert.match(c.state.attachmentError,/5MB/);
  await select(c,[file({size:5*1024*1024}),file({size:5*1024*1024})]);
  assert.match(c.state.attachmentError,/10MB/);
  c.renderVals().attachments[0].remove();
  assert.equal(c.state.attachments.length,0);
  assert.equal(c.state.attachmentError,'');
});

test('submit serializes image bytes and App Check token to the correct project',async()=>{
  const {component:c,calls}=setup();
  await select(c,[file()]);
  await c.handleSubmit({preventDefault(){}});
  assert.equal(calls.length,1);
  assert.equal(calls[0].url,'https://us-central1-musiclibrary-lp.cloudfunctions.net/submitContact');
  assert.equal(calls[0].headers['X-Firebase-AppCheck'],'test-token');
  const body=JSON.parse(calls[0].body);
  assert.equal(body.attachments[0].content,png.toString('base64'));
  assert.equal(body.attachments[0].contentType,'image/png');
  assert.equal(c.state.result,'success');
  assert.equal(c.state.attachments.length,0);
});

test('failed send retains images for retry; blank forms and loading never send',async()=>{
  const {component:c,calls}=setup({ok:false,status:400});
  await select(c,[file()]);
  await c.handleSubmit({preventDefault(){}});
  assert.equal(c.state.result,'error');
  assert.match(c.state.submitErrorMessage,/添付画像/);
  assert.equal(c.state.attachments.length,1);
  c.state.fields.email='';
  await c.handleSubmit({preventDefault(){}});
  c.state.fields.email='test@example.com';
  c.state.attachmentLoading=true;
  await c.handleSubmit({preventDefault(){}});
  assert.equal(calls.length,1);
});
