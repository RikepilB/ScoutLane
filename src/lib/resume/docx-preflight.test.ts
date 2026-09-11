// @vitest-environment node
import { deflateRawSync } from "node:zlib";

import { describe, expect, it } from "vitest";

import { assertSafeDocxArchive } from "./docx-preflight";

type ZipEntry = {
  name: string;
  content: Buffer;
  declaredSize?: number;
};

function makeZip(entries: ZipEntry[]) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name);
    const compressed = deflateRawSync(entry.content);
    const declaredSize = entry.declaredSize ?? entry.content.length;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(declaredSize, 22);
    local.writeUInt16LE(name.length, 26);
    localParts.push(local, name, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(declaredSize, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);

    offset += local.length + name.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...localParts, centralDirectory, end]);
}

function safeDocx(document = Buffer.from("<w:document>Hello</w:document>"), declaredSize?: number) {
  return makeZip([
    { name: "[Content_Types].xml", content: Buffer.from("<Types />") },
    { name: "_rels/.rels", content: Buffer.from("<Relationships />") },
    { name: "word/document.xml", content: document, declaredSize },
  ]);
}

describe("assertSafeDocxArchive", () => {
  it("accepts a small structurally valid DOCX archive", () => {
    expect(() => assertSafeDocxArchive(safeDocx())).not.toThrow();
  });

  it("rejects a PK-prefixed payload that is not a ZIP archive", () => {
    expect(() => assertSafeDocxArchive(Buffer.from("PK-not-a-zip"))).toThrow(
      "DOCX archive is invalid.",
    );
  });

  it("rejects forged size metadata by bounding actual decompression", () => {
    const compressedBomb = Buffer.alloc(2 * 1024 * 1024, 65);
    expect(() => assertSafeDocxArchive(safeDocx(compressedBomb, 64))).toThrow(
      "DOCX archive is unsafe.",
    );
  });

  it("requires the core Word document entries", () => {
    const zip = makeZip([{ name: "word/not-document.xml", content: Buffer.from("missing") }]);
    expect(() => assertSafeDocxArchive(zip)).toThrow("DOCX archive is invalid.");
  });
});
