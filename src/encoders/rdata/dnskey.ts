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
 * Encoder for DNS DNSKEY (DNS Key) resource records (Type 48).
 *
 * Holds a public key used for DNSSEC signature verification.
 *
 * @see RFC 4034 Section 2
 */
export class DNSKEY {
    /** IANA resource record type identifier */
    public static readonly type: number = 48;
    public static readonly PROTOCOL_DNSSEC = 3;
    public static readonly ZONE_KEY = 0x80;
    public static readonly SECURE_ENTRYPOINT = 0x8000;

    /**
     * Decodes a DNSKEY record from the byte stream.
     *
     * @param reader - the byte stream reader positioned at the DNSKEY RDATA
     * @returns the decoded DNSKEY record
     */
    public static decode (reader: Reader): DNSKEY.Record {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'DNSKEY RDATA length');
        const rdataLength = reader.uint16_t(true).toJSNumber();

        // Create bounded reader for RDATA payload
        const rdataReader = createBoundedReader(reader, rdataLength, 'DNSKEY RDATA payload');

        return {
            flags: rdataReader.uint16_t(true).toJSNumber(),
            protocol: rdataReader.uint8_t().toJSNumber(),
            algorithm: rdataReader.uint8_t().toJSNumber(),
            key: rdataReader.unreadBuffer
        };
    }

    /**
     * Encodes a DNSKEY record into the byte stream.
     *
     * @param writer - the byte stream writer to encode into
     * @param data - the DNSKEY record to encode (protocol is always set to 3)
     */
    public static encode (writer: Writer, data: Omit<DNSKEY.Record, 'protocol'>): void {
        const temp = new Writer();

        temp.uint16_t(data.flags ?? 0, true);

        temp.uint8_t(DNSKEY.PROTOCOL_DNSSEC);

        temp.uint8_t(data.algorithm ?? 0);

        temp.bytes(data.key ?? Buffer.alloc(0));

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace DNSKEY {
    export type Record = {
        /** DNSKEY flags field (bit 7: zone key, bit 15: secure entry point) */
        flags: number;
        /** Must be 3 (DNSSEC) */
        protocol: number;
        /** DNSSEC algorithm number */
        algorithm: number;
        /** The public key material */
        key: Buffer;
    }
}
