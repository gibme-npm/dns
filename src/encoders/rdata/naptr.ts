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
import { Name, String } from '../';

export class NAPTR {
    public static readonly type: number = 35;

    public static decode (reader: Reader): NAPTR.Record {
        reader.uint16_t(true).toJSNumber(); // length, unused

        return {
            order: reader.uint16_t(true).toJSNumber(),
            preference: reader.uint16_t(true).toJSNumber(),
            flags: String.decode(reader),
            service: String.decode(reader),
            regexp: String.decode(reader),
            replacement: Name.decode(reader)
        };
    }

    public static encode (writer: Writer, data: NAPTR.Record, index: Name.CompressionIndex): void {
        const temp = new Writer();

        temp.uint16_t(data.order ?? 0, true);

        temp.uint16_t(data.preference ?? 0, true);

        String.encode(temp, data.flags ?? '');

        String.encode(temp, data.service ?? '');

        String.encode(temp, data.regexp ?? '');

        temp.bytes(Name.compress(data.replacement ?? '', index, writer.length + temp.length + 2));

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace NAPTR {
    export type Record = {
        order: number;
        preference: number;
        flags: string;
        service: string;
        regexp: string;
        replacement: string;
    }
}
