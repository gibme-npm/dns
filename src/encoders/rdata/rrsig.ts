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

export class RRSIG {
    public static readonly type: number = 46;

    public static decode (reader: Reader): RRSIG.Record {
        const length = reader.uint16_t(true).toJSNumber();

        const typeCovered = reader.uint16_t(true).toJSNumber();

        const algorithm = reader.uint8_t().toJSNumber();

        const labels = reader.uint8_t().toJSNumber();

        const originalTTL = reader.uint32_t().toJSNumber();

        const signatureExpiration = reader.uint32_t().toJSNumber();

        const signatureInception = reader.uint32_t().toJSNumber();

        const keyTag = reader.uint16_t(true).toJSNumber();

        const signerName = Name.decode(reader);

        const signature = reader.bytes(length - 18);

        return {
            typeCovered,
            algorithm,
            labels,
            originalTTL,
            signatureExpiration,
            signatureInception,
            keyTag,
            signerName,
            signature
        };
    }

    public static encode (writer: Writer, data: RRSIG.Record, index: Name.CompressionIndex): void {
        const temp = new Writer();

        temp.uint16_t(data.typeCovered ?? 0, true);

        temp.uint8_t(data.algorithm ?? 0);

        temp.uint8_t(data.labels ?? 0);

        temp.uint32_t(data.originalTTL ?? 0);

        temp.uint32_t(data.signatureExpiration ?? 0);

        temp.uint32_t(data.signatureInception ?? 0);

        temp.uint16_t(data.keyTag ?? 0, true);

        temp.bytes(Name.compress(data.signerName ?? '', index, writer.length + temp.length + 2));

        temp.bytes(data.signature ?? Buffer.alloc(0));

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace RRSIG {
    export type Record = {
        typeCovered: number;
        algorithm: number;
        labels: number;
        originalTTL: number;
        signatureExpiration: number;
        signatureInception: number;
        keyTag: number;
        signerName: string;
        signature: Buffer;
    }
}
