import { loadKZG } from 'kzg-wasm';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { bytesToHex, createPublicClient, createWalletClient, extractChain, http, parseGwei } from 'viem';
import * as chains from 'viem/chains';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const { initialOwnerAddress, chainId, customCalldataUri, rpcUrl, blobs, creatorPrivateKey, maxFeePerBlobGas } =
    await request.json();

  if (!initialOwnerAddress || !blobs) {
    return new Response(JSON.stringify({ error: '`blobs` and `initialOwnerAddress` are required' }), { status: 400 });
  }

  const kzg = await loadKZG();

  const chain = extractChain({
    id: chainId || Number('11155111'),
    chains: Object.values(chains),
  });

  const transport = http(rpcUrl || `https://go.getblock.io/08ddc0f364494878a7ad8975770fb9c1`);

  const privateKey = creatorPrivateKey || generatePrivateKey();
  const account = privateKeyToAccount(`0x${privateKey.replace(/^0x/i, '')}` as `0x${string}`);

  const client = createPublicClient({ chain, transport });
  const wallet = createWalletClient({ account, chain, transport });

  const calldata = await handleCalldata(customCalldataUri);
  const { maxFeePerGas, maxPriorityFeePerGas } = await client.estimateFeesPerGas();
  const gasPerBlob = typeof maxFeePerBlobGas === 'number' ? String(maxFeePerBlobGas) : maxFeePerBlobGas;

  const req = await wallet.prepareTransactionRequest({
    kzg,
    blobs,
    account,
    maxFeePerGas,
    maxPriorityFeePerGas,
    maxFeePerBlobGas: parseGwei(gasPerBlob || '100'),
    to: initialOwnerAddress,
    type: 'eip4844',
    value: 0n,
    data: calldata,
  });

  const sig = await wallet.signTransaction(req);
  const hash = await wallet.sendRawTransaction({ serializedTransaction: sig });

  console.log({ req, sig, hash });
  // const hash = await wallet.sendTransaction({
  //   kzg,
  //   blobs,
  //   account,
  //   maxFeePerGas,
  //   maxPriorityFeePerGas,
  //   maxFeePerBlobGas: parseGwei(maxFeePerBlobGas || '30'),
  //   to: initialOwnerAddress,
  //   type: 'eip4844',
  //   value: 0n,
  //   data: calldata,
  // });

  return new Response(
    JSON.stringify({
      chainId,
      blobs,
      sig,
      blobTxHash: hash,
      creatorAddress: account.address,
      creatorPrivateKey: privateKey, // NOTE: it's okay, cuz that is one-time use key
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};

async function handleCalldata(customCalldataUri: any): Promise<`0x${string}`> {
  const defaultCalldata = '0x646174613a3b72756c653d65736970362c6973626c6f62';

  let calldata;

  try {
    if (customCalldataUri || typeof customCalldataUri === 'string') {
      if (customCalldataUri.startsWith('0x')) {
        calldata = customCalldataUri;
      } else if (customCalldataUri.startsWith('data:')) {
        // eslint-disable-next-line unicorn/no-await-expression-member
        const data = await (await fetch(customCalldataUri)).arrayBuffer();
        calldata = bytesToHex(new Uint8Array(data));
      } else {
        // eslint-disable-next-line node/no-unsupported-features/node-builtins
        calldata = bytesToHex(new TextEncoder().encode(customCalldataUri));
      }
    }
  } catch {
    calldata = null;
  }

  return calldata || defaultCalldata;
}
