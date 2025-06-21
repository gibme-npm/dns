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
import { Name, TypeBitMap } from '../';
import { RTYPE, RType } from '../../types';

export class NSEC {
    public static readonly type: number = 47;

    public static decode (reader: Reader): NSEC.Record {
        const length = reader.uint16_t(true).toJSNumber();

        const nextDomain = Name.decode(reader);

        const types = TypeBitMap.decode(new Reader(reader.bytes(length - nextDomain.length - 2)));

        return {
            nextDomain,
            types: types.map(type => new RType(type).name)
        };
    }

    public static encode (writer: Writer, data: NSEC.Record, index: Name.CompressionIndex): void {
        const temp = new Writer();

        temp.bytes(Name.compress(data.nextDomain ?? '', index, writer.length + 2));

        TypeBitMap.encode(temp, (data.types ?? []).map(type => new RType(type).id));

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace NSEC {
    export type Record = {
        nextDomain: string;
        types: RTYPE[];
    }
}
