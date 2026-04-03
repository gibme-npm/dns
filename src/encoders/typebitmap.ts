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
    DNS_MAX_TYPE_BITMAP_WINDOW,
    DNS_MIN_TYPE_BITMAP_LENGTH,
    DNS_MAX_TYPE_BITMAP_LENGTH,
    ValidationErrors
} from '../constants/validation';
import { validateBufferLength, validateRange } from '../utils/validation';

/**
 * Encoder for NSEC/NSEC3 type bitmaps as defined in RFC 4034 Section 4.1.2.
 * Represents a set of DNS record types present at a given name.
 */
export class TypeBitMap {
    /**
     * Decodes a type bitmap from the provided byte stream
     * @param reader
     */
    public static decode (reader: Reader): number[] {
        const types: number[] = [];

        while (reader.unreadBytes > 0) {
            // Validate buffer has window number and length
            validateBufferLength(reader, 2, 'TypeBitMap window header');

            const window = reader.uint8_t().toJSNumber();

            // Validate window number
            if (window >= DNS_MAX_TYPE_BITMAP_WINDOW) {
                throw new Error(ValidationErrors.INVALID_TYPE_BITMAP_WINDOW(window));
            }

            const length = reader.uint8_t().toJSNumber();

            // Validate bitmap length
            validateRange(
                length,
                DNS_MIN_TYPE_BITMAP_LENGTH,
                DNS_MAX_TYPE_BITMAP_LENGTH,
                'TypeBitMap window length'
            );

            // Validate buffer has bitmap data
            validateBufferLength(reader, length, 'TypeBitMap window data');

            for (let i = 0; i < length; i++) {
                const b = reader.uint8_t().toJSNumber();

                for (let j = 0; j < 8; j++) {
                    if (b & (1 << (7 - j))) {
                        types.push((window << 8) | (i << 3) | j);
                    }
                }
            }
        }

        return types;
    }

    /**
     * Encodes a type bitmap into the provided Writer instance
     * @param writer
     * @param types
     */
    public static encode (writer: Writer, types: number[]): void {
        // Use Map instead of sparse array to prevent DoS
        const typesByWindow = new Map<number, number[]>();

        for (const type of types) {
            const window = type >> 8;

            // Validate window number
            if (window >= DNS_MAX_TYPE_BITMAP_WINDOW) {
                throw new Error(ValidationErrors.INVALID_TYPE_BITMAP_WINDOW(window));
            }

            if (!typesByWindow.has(window)) {
                typesByWindow.set(window, []);
            }

            const windowArray = typesByWindow.get(window)!;
            const byteIndex = (type >> 3) & 0x1f;

            windowArray[byteIndex] ??= 0;
            windowArray[byteIndex] |= 1 << (7 - (type & 0x7));
        }

        // Sort windows for consistent encoding
        const sortedWindows = Array.from(typesByWindow.keys()).sort((a, b) => a - b);

        for (const window of sortedWindows) {
            const windowData = typesByWindow.get(window)!;
            const buffer = Buffer.from(windowData);

            // Validate bitmap length
            if (buffer.length < DNS_MIN_TYPE_BITMAP_LENGTH || buffer.length > DNS_MAX_TYPE_BITMAP_LENGTH) {
                throw new Error(ValidationErrors.INVALID_TYPE_BITMAP_LENGTH(buffer.length));
            }

            writer.uint8_t(window);
            writer.uint8_t(buffer.length);
            writer.bytes(buffer);
        }
    }
}
