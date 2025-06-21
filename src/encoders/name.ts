// Copyright (c) 2018-2025, Brandon Lehmann <brandonlehmann@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import type { Reader, Writer } from '@gibme/bytepack';

export class Name {
    /**
     * Decodes a name from the byte stream
     * @param reader
     * @param isEmail
     * @param visited
     */
    public static decode (reader: Reader, isEmail = false, visited = new Set<number>()): string {
        const labels: string[] = [];

        while (true) {
            const offset = reader.offset;

            if (visited.has(offset)) {
                throw new Error('Cyclic compression pointer detected');
            }

            visited.add(offset);

            const length = reader.uint8_t().toJSNumber();

            // Compression pointer
            if ((length & 0xC0) === 0xC0) {
                const secondByte = reader.uint8_t().toJSNumber();

                const pointerOffset = ((length & 0x3F) << 8) | secondByte;

                const savedOffset = reader.offset;

                reader.reset(pointerOffset);

                labels.push(...Name.decode(reader, isEmail, visited).split('.'));

                reader.reset(savedOffset);

                break;
            }

            if (length === 0) break;

            const labelBytes = reader.bytes(length);

            labels.push(labelBytes.toString('ascii'));
        }

        if (isEmail) {
            return labels.join('.').replace(/\./, '@');
        } else {
            return labels.join('.');
        }
    }

    /**
     * Returns a new compression index
     */
    public static newCompressionIndex (): Name.CompressionIndex {
        return new Map<string, number>();
    }

    /**
     * Compresses the given name using the specified parameters
     * @param name
     * @param index
     * @param packetOffset
     * @param isEmail
     */
    public static compress (name: string, index: Name.CompressionIndex, packetOffset: number, isEmail = false): Buffer {
        if (!name || name === '.') {
            return Buffer.from([0]);
        }

        if (isEmail) {
            name = name.replace('@', '.');
        }

        const cleanName = (name.endsWith('.') ? name.slice(0, -1) : name);

        const labels = cleanName.split('.');

        const resultBuffer = Buffer.alloc(256); // Max possible name size is 255 bytes

        let currentOffset = 0;

        for (let i = 0; i < labels.length; i++) {
            const suffix = labels.slice(i).join('.');

            if (index.has(suffix)) {
                const compressionOffset = index.get(suffix)!;

                const pointer = 0xC000 | compressionOffset;

                resultBuffer[currentOffset++] = (pointer >> 8) & 0xFF;

                resultBuffer[currentOffset++] = pointer & 0xFF;

                return resultBuffer.subarray(0, currentOffset);
            }

            const absoluteOffset = packetOffset + currentOffset;

            if (absoluteOffset <= 0x3FFF && !index.has(suffix)) {
                index.set(suffix, absoluteOffset);
            }

            const label = labels[i];

            if (label.length > 63) {
                throw new Error(`Label "${label}" exceeds maximum length of 63 characters`);
            }

            resultBuffer[currentOffset++] = label.length;

            for (let j = 0; j < label.length; j++) {
                const charCode = label.charCodeAt(j);

                if (charCode > 127) {
                    throw new Error(`Label "${label}" contains non-ASCII characters`);
                }

                resultBuffer[currentOffset++] = charCode;
            }
        }

        resultBuffer[currentOffset++] = 0;

        return resultBuffer.subarray(0, currentOffset);
    }

    /**
     * Encodes the given name with the specified parameters into the given Writer instance
     * @param writer
     * @param name
     * @param index
     * @param isEmail
     */
    public static encode (writer: Writer, name: string, index: Name.CompressionIndex, isEmail = false): void {
        const buffer = Name.compress(name, index, writer.length, isEmail);
        writer.bytes(buffer);
    }
}

export namespace Name {
    /**
     * A mapping of already used labels within a byte stream
     */
    export type CompressionIndex = Map<string, number>;
}
