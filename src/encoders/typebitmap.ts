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

export class TypeBitMap {
    /**
     * Decodes a type bitmap from the provided byte stream
     * @param reader
     */
    public static decode (reader: Reader): number[] {
        const types: number[] = [];

        while (reader.unreadBytes > 0) {
            const window = reader.uint8_t().toJSNumber();

            const length = reader.uint8_t().toJSNumber();

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
        const typesByWindow: number[][] = [];

        for (const type of types) {
            typesByWindow[type >> 8] ??= [];

            typesByWindow[type >> 8][(type >> 3) & 0x1f] |= 1 << (7 - (type & 0x7));
        }

        for (let i = 0; i < typesByWindow.length; i++) {
            if (typeof typesByWindow[i] !== 'undefined') {
                const window = Buffer.from(typesByWindow[i]);

                writer.uint8_t(i);

                writer.uint8_t(window.length);

                writer.bytes(window);
            }
        }
    }
}
