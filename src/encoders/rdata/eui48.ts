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
import { validateBufferLength, createBoundedReader } from '../../utils/validation';

/**
 * Encoder for DNS EUI48 (48-bit Extended Unique Identifier) resource records (Type 108).
 *
 * Stores a 48-bit IEEE MAC address.
 *
 * @see RFC 7043 Section 3
 */
export class EUI48 {
    /** IANA resource record type identifier */
    public static readonly type: number = 108;

    /**
     * Decodes an EUI48 record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the MAC address string
     */
    public static decode (reader: Reader): string {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'EUI48 RDATA length');
        const rdataLength = reader.uint16_t(true).toJSNumber();

        // Create bounded reader for RDATA payload
        const rdataReader = createBoundedReader(reader, rdataLength, 'EUI48 RDATA payload');

        const mac = rdataReader.bytes(rdataLength);

        return [...mac].map(b => b.toString(16).padStart(2, '0')).join(':');
    }

    /**
     * Encodes an EUI48 record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param data - the MAC address string (colon-separated)
     */
    public static encode (writer: Writer, data: string): void {
        const temp = new Writer();

        const mac = Buffer.from(data.split(':').map(b => parseInt(b, 16)));

        temp.bytes(mac);

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace EUI48 {
    /** The EUI48 record data represented as a colon-separated MAC address string */
    export type Record = string;
}
