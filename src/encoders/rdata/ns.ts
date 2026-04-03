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
 * Encoder for DNS NS (Name Server) resource records (Type 2).
 *
 * Delegates a DNS zone to an authoritative name server.
 *
 * @see RFC 1035 Section 3.3.11
 */
export class NS {
    /** IANA resource record type identifier */
    public static readonly type: number = 2;

    /**
     * Decodes an NS record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the authoritative name server domain
     */
    public static decode (reader: Reader): string {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'NS RDATA length');
        const rdataLength = reader.uint16_t(true).toJSNumber();

        // Validate RDATA payload is available
        validateBufferLength(reader, rdataLength, 'NS RDATA payload');

        return Name.decode(reader);
    }

    /**
     * Encodes an NS record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param name - the name server domain
     * @param index - compression index for DNS name compression
     */
    public static encode (writer: Writer, name: string, index: Name.CompressionIndex): void {
        const temp = new Writer();

        temp.bytes(Name.compress(name, index, writer.length + 2));

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace NS {
    export type Record = string;
}
