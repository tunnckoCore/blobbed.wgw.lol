import fs from 'node:fs/promises';
import { encode as encodeCbor } from 'cbor-x';
import { bytesToHex, createPublicClient, createWalletClient, http, numberToHex, parseGwei } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { gzipSync } from 'fflate';

const CONTENT = 'data:,hey world! this is a blob; follow for more: https://twitter.com/wgw_eth';
const OWNER = '0xA20C07F94A127fD76E61fbeA1019cCe759225002';
const CREATOR_PRIV_KEY = '0x0d52ccde318a676a9b896ae742419325bf174bc94680c45314bb4be3021a8141';

// const bunfile = await Bun.file('./image.webp');
// const file = new File([new Uint8Array(await bunfile.arrayBuffer())], './some-img.webp', { type: 'image/webp' });
// const arrBuf = await file.arrayBuffer();
// const u8bytes = new Uint8Array(arrBuf);
// const content = bytesToHex(u8bytes);

// const formData = new FormData();
// formData.append('blob');
// formData.append('initialOwnerAddress', '0xA20C07F94A127fD76E61fbeA1019cCe759225002');

// console.log({ u8bytes });

const API_URL = `https://astro-tidal-cycle.vercel.app`;

const blobs = await createBlob(CONTENT);

await inscribeBlob({
  blobs,
  creatorPrivateKey: `0x74e344495a3e814a8f3a66a93d431f0c1d5dd55ba4b889c20683ae4be678fbc6`,
  initialOwnerAddress: OWNER,
  chainId: 1,
  maxGasFeePerGas: 20,
  rpcUrl: 'https://go.getblock.io/cc615130d7f84537b0940e7e5870594f',
});

async function createBlob(content) {
  const { blobs, versionedHashes } = await fetch(`${API_URL}/api/create-blob`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ content }),
  }).then((x) => x.json());

  console.log({ versionedHashes });

  return blobs;
}

async function inscribeBlob(opts) {
  const account = privateKeyToAccount(opts.creatorPrivateKey || generatePrivateKey());

  console.log({ ...opts, ...account });

  const resp = await fetch(`${API_URL}/api/inscribe-blob`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...opts }),
  }).then((x) => x.json());

  console.log(resp);
}

// NOTE: Not that useful? Better go with gzipped raw file/content
// async function cborBlob(content, mimetype, compression) {
//   content = Buffer.isBuffer(content) ? new Uint8Array(content.buffer) : content;

//   const gzipFileU8 = gzipSync(content);
//   const obj = encodeCbor({ content: gzipFileU8, mimetype });
//   const cborU8 = new Uint8Array(obj.buffer);
//   const gzipCborU8 = gzipSync(cborU8);

//   console.log('');
//   console.log('    Content Size:', content.length, 'gzip:', gzipFileU8.length);
//   console.log('    CBOR Size:', cborU8.length, 'gzip of cbor with gzipped content inside:', gzipCborU8.length);
//   console.log('');
// }

// await cborBlob(await fs.readFile('./image.webp'), 'image/webp');
