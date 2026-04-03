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
import { validateBufferLength } from '../../utils/validation';

/**
 * Encoder for DNS RP (Responsible Person) resource records (Type 17).
 *
 * Identifies the responsible person for a domain name.
 *
 * @see RFC 1183 Section 2
 */
export class RP {
    /** IANA resource record type identifier */
    public static readonly type: number = 17;

    /**
     * Decodes an RP record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the decoded RP record
     */
    public static decode (reader: Reader): RP.Record {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'RP RDATA length');
        reader.uint16_t(true).toJSNumber(); // length, unused for compression-capable records

        return {
            mbox: Name.decode(reader, true),
            txt: Name.decode(reader)
        };
    }

    /**
     * Encodes an RP record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param data - the RP record to encode
     * @param index - compression index for DNS name compression
     */
    public static encode (writer: Writer, data: RP.Record, index: Name.CompressionIndex): void {
        const temp = new Writer();

        temp.bytes(Name.compress(data.mbox ?? '', index, writer.length + 2, true));

        temp.bytes(Name.compress(data.txt ?? '', index, writer.length + temp.length + 2));

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace RP {
    /** Decoded RP record data */
    export type Record = {
        /** Mailbox of the responsible person (encoded as a domain name) */
        mbox: string;
        /** Domain name pointing to associated TXT records */
        txt: string;
    }
}
