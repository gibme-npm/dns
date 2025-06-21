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

export class SOA {
    public static readonly type: number = 6;

    public static decode (reader: Reader): SOA.Record {
        reader.uint16_t(true).toJSNumber(); // length, unused

        return {
            mname: Name.decode(reader),
            rname: Name.decode(reader, true),
            serial: reader.uint32_t(true).toJSNumber(),
            refresh: reader.uint32_t(true).toJSNumber(),
            retry: reader.uint32_t(true).toJSNumber(),
            expire: reader.uint32_t(true).toJSNumber(),
            minimum: reader.uint32_t(true).toJSNumber()
        };
    }

    public static encode (writer: Writer, data: SOA.Record, index: Name.CompressionIndex): void {
        const temp = new Writer();

        temp.bytes(Name.compress(data.mname ?? '', index, writer.length + 2));

        temp.bytes(Name.compress(
            data.rname ?? '', index, writer.length + temp.length + 2, true));

        temp.uint32_t(data.serial ?? 0, true);

        temp.uint32_t(data.refresh ?? 0, true);

        temp.uint32_t(data.retry ?? 0, true);

        temp.uint32_t(data.expire ?? 0, true);

        temp.uint32_t(data.minimum ?? 0, true);

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace SOA {
    export type Record = {
        mname: string;
        rname: string;
        serial: number;
        refresh: number;
        retry: number;
        expire: number;
        minimum: number;
    }
}
