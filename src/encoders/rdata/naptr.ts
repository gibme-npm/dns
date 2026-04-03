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
import { validateBufferLength } from '../../utils/validation';

/**
 * Encoder for DNS NAPTR (Naming Authority Pointer) resource records (Type 35).
 *
 * Specifies rules for rewriting domain names for DDDS applications.
 *
 * @see RFC 3403
 */
export class NAPTR {
    /** IANA resource record type identifier */
    public static readonly type: number = 35;

    /**
     * Decodes a NAPTR record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the decoded NAPTR record
     */
    public static decode (reader: Reader): NAPTR.Record {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'NAPTR RDATA length');
        reader.uint16_t(true).toJSNumber(); // length, unused for compression-capable records

        // Validate minimum fields are available
        validateBufferLength(reader, 4, 'NAPTR fixed fields');

        return {
            order: reader.uint16_t(true).toJSNumber(),
            preference: reader.uint16_t(true).toJSNumber(),
            flags: String.decode(reader),
            service: String.decode(reader),
            regexp: String.decode(reader),
            replacement: Name.decode(reader)
        };
    }

    /**
     * Encodes a NAPTR record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param data - the NAPTR record to encode
     * @param index - compression index for DNS name compression
     */
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
        /** Processing order (lower first) */
        order: number;
        /** Preference among records with equal order */
        preference: number;
        /** NAPTR flags (e.g. 'U' for URI, 'S' for SRV) */
        flags: string;
        /** Service field describing available protocols */
        service: string;
        /** Regular expression for URI rewriting */
        regexp: string;
        /** Replacement domain name (mutually exclusive with regexp) */
        replacement: string;
    }
}
