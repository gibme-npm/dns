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
import { Name } from '../';
import { validateBufferLength } from '../../utils/validation';

/**
 * Encoder for DNS CNAME (Canonical Name) resource records (Type 5).
 *
 * Maps an alias name to a canonical domain name.
 *
 * @see RFC 1035 Section 3.3.1
 */
export class CNAME {
    /** IANA resource record type identifier */
    public static readonly type: number = 5;

    /**
     * Decodes a CNAME record from the byte stream.
     *
     * @param reader - the byte stream reader positioned at the CNAME RDATA
     * @returns the canonical domain name
     */
    public static decode (reader: Reader): string {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'CNAME RDATA length');
        reader.uint16_t(true).toJSNumber(); // length, unused for compression-capable records

        return Name.decode(reader);
    }

    /**
     * Encodes a CNAME record into the byte stream.
     *
     * @param writer - the byte stream writer to encode into
     * @param name - the canonical domain name
     * @param index - compression index for DNS name pointer compression
     */
    public static encode (writer: Writer, name: string, index: Name.CompressionIndex): void {
        const buffer = Name.compress(name, index, writer.length + 2);

        writer.uint16_t(buffer.length, true);

        writer.bytes(buffer);
    }
}

export namespace CNAME {
    /** The CNAME record data is a domain name string representing the canonical name. */
    export type Record = string;
}
