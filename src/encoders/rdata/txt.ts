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

import { Reader, Writer } from '@gibme/bytepack';

export class TXT {
    public static readonly type: number = 16;

    public static decode (reader: Reader): Record<string, string> {
        const result: Record<string, string> = {};

        const length = reader.uint16_t(true).toJSNumber();

        const temp = new Reader(reader.bytes(length));

        while (temp.unreadBytes > 0) {
            const length = temp.uint8_t().toJSNumber();

            const [key, ...value] = temp.bytes(length).toString('utf8').split('=');

            result[key.trim()] = (value.join('=') ?? '').trim();
        }

        return result;
    }

    public static encode (writer: Writer, data: Record<string, string>): void {
        const temp = new Writer();

        for (const [key, value] of Object.entries(data)) {
            const entry = Buffer.from(`${key}=${value ?? ''}`, 'utf8');

            temp.uint8_t(entry.length);

            temp.bytes(entry);
        }

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace TXT {
    export type Record = {[key: string]: string};
}
