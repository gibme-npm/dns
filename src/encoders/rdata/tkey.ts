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
import { Name } from '../';

export class TKEY {
    public static readonly type: number = 249;

    public static decode (reader: Reader): TKEY.Record {
        reader.uint16_t(true).toJSNumber(); // length, unused

        const algorithm = Name.decode(reader);

        const inception = reader.uint32_t(true).toJSNumber();

        const expiration = reader.uint32_t(true).toJSNumber();

        const mode = reader.uint16_t(true).toJSNumber();

        const error = reader.uint16_t(true).toJSNumber();

        const key_length = reader.uint16_t(true).toJSNumber();

        const key = reader.bytes(key_length);

        const other_length = reader.uint16_t(true).toJSNumber();

        const other = reader.bytes(other_length);

        return {
            algorithm,
            inception,
            expiration,
            mode,
            error,
            key,
            other
        };
    }

    public static encode (writer: Writer, data: TKEY.Record, index: Name.CompressionIndex): void {
        const temp = new Writer();

        temp.bytes(Name.compress(data.algorithm ?? '', index, writer.length + 2));

        temp.uint32_t(data.inception ?? 0, true);

        temp.uint32_t(data.expiration ?? 0, true);

        temp.uint16_t(data.mode ?? 0, true);

        temp.uint16_t(data.error ?? 0, true);

        temp.uint16_t(data.key.length ?? 0, true);

        temp.bytes(data.key ?? Buffer.alloc(0));

        temp.uint16_t(data.other.length ?? 0, true);

        temp.bytes(data.other);

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace TKEY {
    export type Record = {
        algorithm: string;
        inception: number;
        expiration: number;
        mode: number;
        error: number;
        key: Buffer;
        other: Buffer;
    }
}
