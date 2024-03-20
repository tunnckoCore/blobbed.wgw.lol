import { loadKZG } from 'kzg-wasm';
import type { APIRoute } from 'astro';
import { blobsToCommitments, bytesToHex, sha256, toBlobs } from 'viem';
// import { encode as encodeCbor } from 'cbor-x';

export const POST: APIRoute = async ({ request }) => {
  const { content /* , mimetype = '' */ } = await request.json();
  if (!content) {
    return new Response(JSON.stringify({ error: 'content is required' }), { status: 400 });
  }

  const kzg = await loadKZG();

  const { blobs, commitments, versionedHashes, buffer } = contentToBlobs(content, kzg);

  return new Response(JSON.stringify({ blobs, commitments, versionedHashes, blobData: bytesToHex(buffer) }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

function contentToBlobs(content: string | Uint8Array, kzg: any) {
  // eslint-disable-next-line node/no-unsupported-features/node-builtins
  const contentBuffer = typeof content === 'string' ? new TextEncoder().encode(content) : content;

  const contentBlobs = toBlobs({ data: contentBuffer, to: 'hex' });
  const contentCommitments = blobsToCommitments({ blobs: contentBlobs, kzg });

  return {
    content,
    buffer: contentBuffer,
    blobs: contentBlobs,
    commitments: contentCommitments,
    versionedHashes: contentCommitments.map((x) => `0x01${sha256(x).slice(4)}`),
    toBlobHash: (x: any) => `0x01${sha256(x).slice(4)}`,
  };
}
