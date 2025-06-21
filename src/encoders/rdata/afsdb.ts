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
import type { Name } from '../';
import { MX } from './mx';

export class AFSDB {
    public static readonly type: number = 18;

    public static decode (reader: Reader): AFSDB.Record {
        const {
            preference: subtype,
            exchange: hostname
        } = MX.decode(reader);

        return {
            subtype,
            hostname
        };
    }

    public static encode (writer: Writer, data: AFSDB.Record, index: Name.CompressionIndex): void {
        return MX.encode(writer, {
            preference: data.subtype,
            exchange: data.hostname
        }, index);
    }
}

export namespace AFSDB {
    export type Record = {
        subtype: number;
        hostname: string;
    }
}
