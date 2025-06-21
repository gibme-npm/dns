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

export class NSEC3PARAM {
    public static readonly type: number = 51;

    public static decode (reader: Reader): NSEC3PARAM.Record {
        const length = reader.uint16_t(true).toJSNumber();

        const temp = new Reader(reader.bytes(length));

        const algorithm = temp.uint8_t().toJSNumber();

        const flags = temp.uint8_t().toJSNumber();

        const iterations = temp.uint16_t(true).toJSNumber();

        const salt_length = temp.uint8_t().toJSNumber();

        const salt = temp.bytes(salt_length);

        return {
            algorithm,
            flags,
            iterations,
            salt
        };
    }

    public static encode (writer: Writer, data: NSEC3PARAM.Record): void {
        const temp = new Writer();

        temp.uint8_t(data.algorithm ?? 0);

        temp.uint8_t(data.flags ?? 0);

        temp.uint16_t(data.iterations ?? 0, true);

        temp.uint8_t(data.salt.length ?? 0);

        temp.bytes(data.salt ?? Buffer.alloc(0));

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace NSEC3PARAM {
    export type Record = {
        algorithm: number;
        flags: number;
        iterations: number;
        salt: Buffer;
    }
}
