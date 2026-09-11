import { inflateRawSync } from "node:zlib";

const END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const CENTRAL_DIRECTORY_ENTRY = 0x02014b50;
const LOCAL_FILE_ENTRY = 0x04034b50;
const MAX_ZIP_COMMENT_BYTES = 65_535;
const MAX_ENTRIES = 200;
const MAX_ENTRY_UNCOMPRESSED_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_UNCOMPRESSED_BYTES = 20 * 1024 * 1024;
const MAX_COMPRESSION_RATIO = 100;

const REQUIRED_ENTRIES = new Set([
  "[Content_Types].xml",
  "_rels/.rels",
  "word/document.xml",
]);

type ArchiveEntry = {
  name: string;
  method: number;
  compressedSize: number;
  uncompressedSize: number;
  localOffset: number;
};

function invalid(): never {
  throw new Error("DOCX archive is invalid.");
}

function unsafe(): never {
  throw new Error("DOCX archive is unsafe.");
}

function findDirectoryEnd(buffer: Buffer) {
  const earliest = Math.max(0, buffer.length - 22 - MAX_ZIP_COMMENT_BYTES);
  for (let offset = buffer.length - 22; offset >= earliest; offset -= 1) {
    if (buffer.readUInt32LE(offset) === END_OF_CENTRAL_DIRECTORY) return offset;
  }
  return invalid();
}

function parseEntries(buffer: Buffer): ArchiveEntry[] {
  if (buffer.length < 22) return invalid();

  const endOffset = findDirectoryEnd(buffer);
  const disk = buffer.readUInt16LE(endOffset + 4);
  const directoryDisk = buffer.readUInt16LE(endOffset + 6);
  const entriesOnDisk = buffer.readUInt16LE(endOffset + 8);
  const entryCount = buffer.readUInt16LE(endOffset + 10);
  const directorySize = buffer.readUInt32LE(endOffset + 12);
  const directoryOffset = buffer.readUInt32LE(endOffset + 16);

  if (disk !== 0 || directoryDisk !== 0 || entriesOnDisk !== entryCount) return invalid();
  if (entryCount === 0 || entryCount > MAX_ENTRIES || entryCount === 0xffff) return unsafe();
  if (directorySize === 0xffffffff || directoryOffset === 0xffffffff) return unsafe();
  if (directoryOffset + directorySize > endOffset) return invalid();

  const entries: ArchiveEntry[] = [];
  const names = new Set<string>();
  let cursor = directoryOffset;

  for (let index = 0; index < entryCount; index += 1) {
    if (cursor + 46 > endOffset || buffer.readUInt32LE(cursor) !== CENTRAL_DIRECTORY_ENTRY) {
      return invalid();
    }

    const flags = buffer.readUInt16LE(cursor + 8);
    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const nextCursor = cursor + 46 + nameLength + extraLength + commentLength;

    if (nextCursor > endOffset) return invalid();
    if ((flags & 1) !== 0 || (method !== 0 && method !== 8)) return unsafe();
    if (
      compressedSize === 0xffffffff ||
      uncompressedSize === 0xffffffff ||
      localOffset === 0xffffffff
    ) {
      return unsafe();
    }

    const name = buffer.subarray(cursor + 46, cursor + 46 + nameLength).toString("utf8");
    if (!name || names.has(name) || name.includes("\\") || name.startsWith("/") || name.includes("..")) {
      return unsafe();
    }

    names.add(name);
    entries.push({ name, method, compressedSize, uncompressedSize, localOffset });
    cursor = nextCursor;
  }

  if (cursor !== directoryOffset + directorySize) return invalid();
  return entries;
}

function verifyEntry(buffer: Buffer, entry: ArchiveEntry) {
  if (entry.uncompressedSize > MAX_ENTRY_UNCOMPRESSED_BYTES) return unsafe();
  if (
    entry.uncompressedSize > 1024 * 1024 &&
    (entry.compressedSize === 0 || entry.uncompressedSize / entry.compressedSize > MAX_COMPRESSION_RATIO)
  ) {
    return unsafe();
  }

  if (
    entry.localOffset + 30 > buffer.length ||
    buffer.readUInt32LE(entry.localOffset) !== LOCAL_FILE_ENTRY
  ) {
    return invalid();
  }

  const localMethod = buffer.readUInt16LE(entry.localOffset + 8);
  const nameLength = buffer.readUInt16LE(entry.localOffset + 26);
  const extraLength = buffer.readUInt16LE(entry.localOffset + 28);
  const dataOffset = entry.localOffset + 30 + nameLength + extraLength;
  const dataEnd = dataOffset + entry.compressedSize;
  if (localMethod !== entry.method || dataEnd > buffer.length) return invalid();

  const compressed = buffer.subarray(dataOffset, dataEnd);
  if (entry.method === 0) {
    if (compressed.length !== entry.uncompressedSize) return unsafe();
    return;
  }

  try {
    const inflated = inflateRawSync(compressed, {
      maxOutputLength: Math.min(entry.uncompressedSize + 1, MAX_ENTRY_UNCOMPRESSED_BYTES + 1),
    });
    if (inflated.length !== entry.uncompressedSize) return unsafe();
  } catch {
    return unsafe();
  }
}

/**
 * Validates DOCX ZIP structure and bounds actual decompression before Mammoth
 * receives the archive. This keeps a small compressed upload from expanding
 * without limit in the request process.
 */
export function assertSafeDocxArchive(buffer: Buffer): void {
  const entries = parseEntries(buffer);
  const names = new Set(entries.map((entry) => entry.name));
  if ([...REQUIRED_ENTRIES].some((name) => !names.has(name))) return invalid();

  const totalUncompressed = entries.reduce((total, entry) => total + entry.uncompressedSize, 0);
  if (totalUncompressed > MAX_TOTAL_UNCOMPRESSED_BYTES) return unsafe();

  for (const entry of entries) verifyEntry(buffer, entry);
}
