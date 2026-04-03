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
 * Encoder for DNS MX (Mail Exchange) resource records (Type 15).
 *
 * Specifies the mail server responsible for accepting email for a domain.
 *
 * @see RFC 1035 Section 3.3.9
 */
export class MX {
    /** IANA resource record type identifier */
    public static readonly type: number = 15;

    /**
     * Decodes an MX record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the decoded MX record
     */
    public static decode (reader: Reader): MX.Record {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'MX RDATA length');
        reader.uint16_t(true).toJSNumber(); // length, unused for compression-capable records

        // Validate minimum fields are available
        validateBufferLength(reader, 2, 'MX preference field');

        return {
            preference: reader.uint16_t(true).toJSNumber(),
            exchange: Name.decode(reader)
        };
    }

    /**
     * Encodes an MX record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param data - the MX record to encode
     * @param index - compression index for DNS name compression
     */
    public static encode (writer: Writer, data: MX.Record, index: Name.CompressionIndex): void {
        const temp = new Writer();

        temp.uint16_t(data.preference ?? 0, true);

        temp.bytes(Name.compress(data.exchange ?? '', index, temp.length + 4));

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace MX {
    export type Record = {
        /** Preference value (lower is preferred) */
        preference: number;
        /** Domain name of the mail server */
        exchange: string;
    }
}
