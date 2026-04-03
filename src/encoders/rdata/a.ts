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
import { Address4 } from 'ip-address';
import { validateBufferLength, createBoundedReader } from '../../utils/validation';

/**
 * Encoder for DNS A (Address) resource records (Type 1).
 *
 * Maps a domain name to an IPv4 address.
 *
 * @see RFC 1035 Section 3.4.1
 */
export class A {
    /** IANA resource record type identifier */
    public static readonly type: number = 1;

    /**
     * Decodes an A record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the decoded IPv4 address string
     */
    public static decode (reader: Reader): string {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'A RDATA length');
        const rdataLength = reader.uint16_t(true).toJSNumber();

        // Create bounded reader for RDATA payload
        const rdataReader = createBoundedReader(reader, rdataLength, 'A RDATA payload');

        return Address4.fromHex(rdataReader.bytes(rdataLength).toString('hex')).address;
    }

    /**
     * Encodes an A record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param address - the IPv4 address string
     */
    public static encode (writer: Writer, address: string): void {
        const buffer = Buffer.from((new Address4(address)).toArray());

        writer.uint16_t(buffer.length, true);

        writer.bytes(buffer);
    }
}

export namespace A {
    export type Record = string;
}
