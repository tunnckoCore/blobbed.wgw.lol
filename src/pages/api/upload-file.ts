import { loadKZG } from 'kzg-wasm';
import type { APIRoute } from 'astro';
import { gzipSync } from 'fflate';
import { encode as encodeCbor } from 'cbor-x';
import { blobsToCommitments, bytesToHex, sha256, toBlobs } from 'viem';

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get('file') as File | Blob;

  if (!file) {
    return Response.json({ error: 'the `file` field is required' }, { status: 400 });
  }

  const isGzip = formData.get('gzip') === 'true';
  const arrbuf = await file.arrayBuffer();
  const u8data = new Uint8Array(arrbuf);
  const content = isGzip ? gzipSync(u8data) : u8data;
  const ratio = isGzip ? u8data.length / content.length : 1;

  if (ratio > 10) {
    return Response.json({ error: 'Compression ratio too high, exceeds 10:1' }, { status: 400 });
  }

  console.log({
    isGzip,
    ratio,
    originalSize: u8data.length,
    compressedSize: content.length,
    compressedByteLength: content.byteLength,
  });

  const data = encodeCbor({ content, mimetype: file.type || 'text/plain', _something: 'foo bar' });

  const kzg = await loadKZG();

  const { blobs, commitments, versionedHashes, buffer } = contentToBlobs(data, kzg);

  return Response.json(
    {
      blobs,
      commitments,
      versionedHashes,
      blobData: bytesToHex(buffer),
    },
    { status: 200 },
  );
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
