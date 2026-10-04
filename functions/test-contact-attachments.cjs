const {test} = require('node:test');
const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');
const {parseAttachments, MAX_FILE_BYTES} = require('./lib/contact-attachments');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5ZkAAAAASUVORK5CYII=', 'base64');
const payload = (bytes = png, type = 'image/png') => ({content: bytes.toString('base64'), contentType: type});

test('legacy text-only requests and all supported signatures', () => {
  assert.deepEqual(parseAttachments(undefined), []);
  assert.deepEqual(parseAttachments([]), []);
  const files = parseAttachments([
    {...payload(), filename: '../../evil.html', path: '/etc/passwd'},
    payload(Buffer.from([255,216,255,224,0,0]), 'image/jpeg'),
    payload(Buffer.from('RIFFxxxxWEBPVP8 '), 'image/webp'),
  ]);
  assert.deepEqual(files.map(f => f.filename), ['screenshot-1.png','screenshot-2.jpg','screenshot-3.webp']);
  assert.deepEqual(files[0].content, png);
  assert.equal(files[0].contentDisposition, 'attachment');
});

test('rejects excess count, arbitrary objects, types, malformed base64 and spoofed MIME', () => {
  for (const value of [null, {}, [null], Array(4).fill(payload()),
    [payload(Buffer.from('<svg></svg>'), 'image/svg+xml')],
    [payload(png, 'image/jpeg')], [{...payload(), content: '%%%='}],
    [{...payload(), content: ''}], [{...payload(), content: 'AAAA\n'}],
    [{...payload(), content: payload().content + '='}], [{contentType:'image/png', path:'/etc/passwd'}]]) {
    assert.throws(() => parseAttachments(value), /invalid attachments/);
  }
});

test('enforces both the 5 MiB per-file and 10 MiB total limits', () => {
  const full = Buffer.alloc(MAX_FILE_BYTES); png.copy(full);
  assert.equal(parseAttachments([payload(full), payload(full)]).length, 2);
  assert.throws(() => parseAttachments([payload(Buffer.concat([full,Buffer.from([0])]))]));
  assert.throws(() => parseAttachments([payload(full), payload(full), payload()]));
});

test('mailer creates an attachment in memory, with no SMTP or network send', async () => {
  const mailer = nodemailer.createTransport({streamTransport: true, buffer: true});
  const result = await mailer.sendMail({
    from: 'test@example.com', to:'test@example.com', subject:'attachment test', text:'test',
    attachments:parseAttachments([payload()]),
  });
  const mime = result.message.toString();
  assert.match(mime, /Content-Type: image\/png/);
  assert.match(mime, /Content-Disposition: attachment; filename=screenshot-1.png/);
  assert.ok(mime.replace(/\r?\n/g,'').includes(png.toString('base64')));
});
