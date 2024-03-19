import { bytesToHex, createPublicClient, createWalletClient, http, numberToHex, parseGwei } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

// 'data:,hey world! this is a blob'
// 0x0d52ccde318a676a9b896ae742419325bf174bc94680c45314bb4be3021a8141

// const bunfile = await Bun.file('./image.webp');
// const file = new File([new Uint8Array(await bunfile.arrayBuffer())], './some-img.webp', { type: 'image/webp' });
// const arrBuf = await file.arrayBuffer();
// const u8bytes = new Uint8Array(arrBuf);
// const content = bytesToHex(u8bytes);

// const formData = new FormData();
// formData.append('blob');
// formData.append('initialOwnerAddress', '0xA20C07F94A127fD76E61fbeA1019cCe759225002');

// console.log({ u8bytes });

async function createBlob(content, owner) {
  const { blobs } = await fetch('http://localhost:4321/api/create-blob', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ content, initialOwnerAddress: owner }),
  }).then((x) => x.json());

  return blobs;
}

async function inscribeBlob(blobs, privKey) {
  const creatorPrivateKey = privKey || generatePrivateKey();
  const account = privateKeyToAccount(creatorPrivateKey);

  console.log({ ...account, privateKey: creatorPrivateKey });

  const resp = await fetch('http://localhost:4321/api/inscribe-blob', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      blobs,
      creatorPrivateKey,
      initialOwnerAddress: '0xA20C07F94A127fD76E61fbeA1019cCe759225002',
    }),
  }).then((x) => x.json());

  console.log(resp);
}

// async function unblockNonce() {
//   const transport = http(`https://go.getblock.io/08ddc0f364494878a7ad8975770fb9c1`);
//   const account = privateKeyToAccount('0x0d52ccde318a676a9b896ae742419325bf174bc94680c45314bb4be3021a8141');
//   const client = createPublicClient({ account, chain: sepolia, transport: http() });
//   const wallet = createWalletClient({ account, chain: sepolia, transport });

//   const { maxFeePerGas, maxPriorityFeePerGas } = await client.estimateFeesPerGas();

//   console.log({ maxFeePerGas, maxPriorityFeePerGas });
//   const hash = await wallet.sendTransaction({
//     from: account.address,
//     to: account.address,
//     nonce: 0,
//     value: 0n,
//     data: '0x',
//     // gas: numberToHex(21_000),
//     // gasPrice: parseGwei('50'),
//     // maxFeePerGas,
//     // maxPriorityFeePerGas,

//     maxFeePerGas: 9_515_359_532n,
//     maxPriorityFeePerGas: 5_500_000_000n,

//     // type: 'legacy',
//   });

//   console.log({ hash });
// }

// unblockNonce();
