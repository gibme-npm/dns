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
 * Encoder for DNS DHCID (DHCP Identifier) resource records (Type 49).
 *
 * Associates a DHCP client identity with a DNS name for conflict resolution.
 *
 * @see RFC 4701
 */
export class DHCID {
    /** IANA resource record type identifier */
    public static readonly type: number = 49;

    /**
     * Decodes a DHCID record from the byte stream.
     *
     * @param reader - the byte stream reader positioned at the DHCID RDATA
     * @returns the decoded DHCID record
     */
    public static decode (reader: Reader): DHCID.Record {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'DHCID RDATA length');
        const rdataLength = reader.uint16_t(true).toJSNumber();

        // Create bounded reader for RDATA payload
        const rdataReader = createBoundedReader(reader, rdataLength, 'DHCID RDATA payload');

        return {
            type: rdataReader.uint16_t(true).toJSNumber(),
            digestType: rdataReader.uint8_t().toJSNumber(),
            digest: rdataReader.unreadBuffer
        };
    }

    /**
     * Encodes a DHCID record into the byte stream.
     *
     * @param writer - the byte stream writer to encode into
     * @param data - the DHCID record to encode
     */
    public static encode (writer: Writer, data: DHCID.Record): void {
        const temp = new Writer();

        temp.uint16_t(data.type ?? 0, true);

        temp.uint8_t(data.digestType ?? 0);

        temp.bytes(data.digest ?? Buffer.alloc(0));

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace DHCID {
    export type Record = {
        /** DHCID identifier type code */
        type: number;
        /** Digest algorithm type */
        digestType: number;
        /** The DHCID digest data */
        digest: Buffer;
    }
}
