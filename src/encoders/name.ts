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
import {
    DNS_MAX_LABEL_LENGTH,
    DNS_MAX_NAME_LENGTH,
    DNS_MAX_POINTER_DEPTH,
    ValidationErrors
} from '../constants/validation';
import { validateBufferLength, validatePointerOffset } from '../utils/validation';

export class Name {
    /**
     * Decodes a name from the byte stream
     * @param reader
     * @param isEmail
     * @param visited
     * @param depth
     * @param totalLength
     */
    public static decode (
        reader: Reader,
        isEmail = false,
        visited = new Set<number>(),
        depth = 0,
        totalLength = 0
    ): string {
        // Check pointer depth to prevent compression bombs
        if (depth > DNS_MAX_POINTER_DEPTH) {
            throw new Error(ValidationErrors.POINTER_DEPTH_EXCEEDED(depth));
        }

        const labels: string[] = [];
        const bufferStart = 0;
        const bufferSize = reader.length;

        while (true) {
            const offset = reader.offset;

            // Check for cyclic pointers
            if (visited.has(offset)) {
                throw new Error('Cyclic compression pointer detected');
            }

            visited.add(offset);

            // Validate buffer has at least 1 byte for length
            validateBufferLength(reader, 1, 'Name length byte');

            const length = reader.uint8_t().toJSNumber();

            // Compression pointer
            if ((length & 0xC0) === 0xC0) {
                // Validate buffer has second byte of pointer
                validateBufferLength(reader, 1, 'Compression pointer second byte');

                const secondByte = reader.uint8_t().toJSNumber();

                const pointerOffset = ((length & 0x3F) << 8) | secondByte;

                // Validate pointer offset
                validatePointerOffset(
                    pointerOffset,
                    bufferStart,
                    offset,
                    bufferSize,
                    'Name compression pointer'
                );

                const savedOffset = reader.offset;

                reader.reset(pointerOffset);

                // Recursively decode with increased depth
                const decodedName = Name.decode(reader, isEmail, visited, depth + 1, totalLength);

                // Add to total length (each label + length byte, +1 for null terminator accounted in recursive call)
                const newTotalLength = totalLength + decodedName.length + labels.join('.').length + labels.length;

                if (newTotalLength > DNS_MAX_NAME_LENGTH) {
                    throw new Error(ValidationErrors.NAME_TOO_LONG(newTotalLength));
                }

                labels.push(...decodedName.split('.'));

                reader.reset(savedOffset);

                break;
            }

            // End of name
            if (length === 0) break;

            // Validate label length
            if (length > DNS_MAX_LABEL_LENGTH) {
                throw new Error(ValidationErrors.LABEL_TOO_LONG(length));
            }

            // Validate buffer has label data
            validateBufferLength(reader, length, 'Name label data');

            const labelBytes = reader.bytes(length);

            labels.push(labelBytes.toString('ascii'));

            // Track total name length (label + length byte)
            totalLength += length + 1;

            if (totalLength > DNS_MAX_NAME_LENGTH) {
                throw new Error(ValidationErrors.NAME_TOO_LONG(totalLength));
            }
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

        const resultBuffer = Buffer.alloc(DNS_MAX_NAME_LENGTH + 1); // Max possible name size + null terminator

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

            // Validate label length
            if (label.length > DNS_MAX_LABEL_LENGTH) {
                throw new Error(ValidationErrors.LABEL_TOO_LONG(label.length));
            }

            // Check total name length doesn't exceed limit
            if (currentOffset + label.length + 2 > DNS_MAX_NAME_LENGTH) {
                throw new Error(ValidationErrors.NAME_TOO_LONG(currentOffset + label.length + 2));
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
