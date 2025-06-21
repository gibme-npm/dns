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

export class TSIG {
    public static readonly type: number = 250;

    public static decode (reader: Reader): TSIG.Record {
        reader.uint16_t(true).toJSNumber(); // length, unused

        const algorithm = Name.decode(reader);

        const signed = TSIG.decode_time(reader);

        const fudge = reader.uint16_t(true).toJSNumber();

        const mac_length = reader.uint16_t(true).toJSNumber();

        const mac = reader.bytes(mac_length);

        const originalId = reader.uint16_t(true).toJSNumber();

        const error = reader.uint16_t(true).toJSNumber();

        const other_length = reader.uint16_t(true).toJSNumber();

        const other = reader.bytes(other_length);

        return {
            algorithm,
            signed,
            fudge,
            mac,
            originalId,
            error,
            other
        };
    }

    public static encode (writer: Writer, data: TSIG.Record, index: Name.CompressionIndex): void {
        const temp = new Writer();

        temp.bytes(Name.compress(data.algorithm ?? '', index, writer.length + 2));

        temp.bytes(TSIG.encode_time(data.signed ?? 0));

        temp.uint16_t(data.fudge ?? 0, true);

        temp.uint16_t(data.mac.length ?? 0, true);

        temp.bytes(data.mac ?? Buffer.alloc(0));

        temp.uint16_t(data.originalId ?? 0, true);

        temp.uint16_t(data.error ?? 0, true);

        temp.uint16_t(data.other.length ?? 0, true);

        temp.bytes(data.other ?? Buffer.alloc(0));

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }

    protected static decode_time (reader: Reader): number {
        const high = reader.uint32_t(true).toJSNumber();

        const low = reader.uint16_t(true).toJSNumber();

        return parseInt(((BigInt(high) << BigInt(16)) + BigInt(low)).toString(10));
    }

    protected static encode_time (time: number): Buffer {
        const temp = new Writer();

        const high = Number((BigInt(time) >> BigInt(16)) & BigInt(0xFFFFFFFF));

        const low = Number(BigInt(time) & BigInt(0xFFFF));

        temp.uint32_t(high, true);

        temp.uint16_t(low, true);

        return temp.buffer;
    }
}

export namespace TSIG {
    export type Record = {
        algorithm: string;
        signed: number;
        fudge: number;
        mac: Buffer;
        originalId: number;
        error: number;
        other: Buffer;
    }
}
