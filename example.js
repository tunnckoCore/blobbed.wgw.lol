import fs from 'node:fs/promises';
import { encode as encodeCborX } from 'cbor-x';
import cbor from 'cbor';
import { bytesToHex, createPublicClient, createWalletClient, http, numberToHex, parseGwei } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { gzipSync } from 'fflate';

const OWNER = '0xA20C07F94A127fD76E61fbeA1019cCe759225002';
const CREATOR_PRIV_KEY = 'c7e9cfdee5c194ee4d0990ef2e6152b7577d55f2a3c93123f825376b38d3eca2';

// const API_URL = `https://blobbed.wgw.lol`;

const API_URL = `http://localhost:4321`;
// const CONTENT = 'data:,hey world! this is a blob; follow for more: https://twitter.com/wgw_eth';

const filename = 'handong.b9058b8d.webp';
const file = await fs.readFile(`./${filename}`);
const fileBytes = new Uint8Array(file.buffer);
const gzipBytes = gzipSync(fileBytes);
const CONTENT = bytesToHex(gzipBytes);

console.log('    File Size:', fileBytes.length, 'gzip:', gzipBytes.length);

// await inscribeBlob({
//   blobs: await createBlob(CONTENT),
//   initialOwnerAddress: OWNER,
//   chainId: 1,
//   maxGasFeePerGas: 5,
//   rpcUrl: 'https://go.getblock.io/cc615130d7f84537b0940e7e5870594f',
//   creatorPrivateKey: CREATOR_PRIV_KEY,
// });

async function createBlob(content) {
  const { blobs, versionedHashes } = await fetch(`${API_URL.replace(/\/$/, '')}/api/create-blob`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ content }),
  }).then((x) => x.json());

  console.log({ versionedHashes });

  return blobs;
}

async function inscribeBlob(opts) {
  const privkey = `0x${(opts.creatorPrivateKey || generatePrivateKey()).replace(/0x/i, '')}`;
  const account = privateKeyToAccount(privkey);

  console.log({ ...opts, ...account });

  const resp = await fetch(`${API_URL.replace(/\/$/, '')}/api/inscribe-blob`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...opts }),
  }).then((x) => x.json());

  console.log(resp);
}

// NOTE: Not that useful? Better go with gzipped raw file/content
async function cborBlob(content, mimetype) {
  content = Buffer.isBuffer(content) ? new Uint8Array(content.buffer) : content;

  const encodeCbor = cbor.encode;
  const gzipFile = gzipSync(content);
  const obj = encodeCbor({ content: gzipFile, mimetype });
  const cborU8 = new Uint8Array(obj.buffer);
  const cborHex = bytesToHex(cborU8);
  const b64datauri = `data:image/jpeg;base64,${Buffer.from(content).toString('base64')}`;

  console.log('');
  console.log('   content size:', content.length, 'gzip:', gzipFile.length);
  console.log('   cbor size:', cborU8.length);
  console.log(
    '   b64 data uri size:',
    b64datauri.length,
    'gzip:',
    gzipSync(new TextEncoder().encode(b64datauri)).length,
  );
  console.log('');

  // const gzipFileU8 = gzipSync(content);
  // const obj = encodeCbor({ content: gzipFileU8, mimetype });
  // const cborU8 = new Uint8Array(obj.buffer);
  // const gzipCborU8 = gzipSync(cborU8);
  // const b64 = `data:image/jpeg;base64,${Buffer.from(content).toString('base64')}`;
  // const b64gzip = gzipSync(new TextEncoder().encode(b64));

  // console.log('');
  // console.log('    Content Size:', content.length, 'gzip:', gzipFileU8.length);
  // console.log('    Content b64 Size:', b64.length, 'b64 gzip:', b64gzip.length);
  // console.log(
  //   '    CBOR Size (includes gzipped content):',
  //   cborU8.length,
  //   'gzip of cbor with gzipped content inside:',
  //   gzipCborU8.length,
  // );
  // console.log('');
}

// await cborBlob(fileBytes, 'image/webp');

const formData = new FormData();
formData.append('gzip', 'true');
formData.append('file', new File([fileBytes], filename, { type: 'image/jpeg' }));

// console.log('    File Size:', fileBytes.length);

const resp = await fetch(`${API_URL}/api/upload-file`, {
  method: 'POST',
  body: formData,
}).then((x) => x.json());

console.log(resp);
