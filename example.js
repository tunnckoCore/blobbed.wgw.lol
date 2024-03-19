import fs from 'node:fs/promises';
import { encode as encodeCbor } from 'cbor-x';
import { bytesToHex, createPublicClient, createWalletClient, http, numberToHex, parseGwei } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { gzipSync } from 'fflate';

const OWNER = '0xA20C07F94A127fD76E61fbeA1019cCe759225002';
const CREATOR_PRIV_KEY = '0x...';

// const API_URL = `https://blobbed.wgw.lol`;

const API_URL = `http://localhost:4321`;
const CONTENT = 'data:,hey world! this is a blob; follow for more: https://twitter.com/wgw_eth';

await inscribeBlob({
  blobs: await createBlob(CONTENT),
  initialOwnerAddress: OWNER,
  chainId: 1,
  maxGasFeePerGas: 5,
  rpcUrl: 'https://go.getblock.io/cc615130d7f84537b0940e7e5870594f',
});

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
