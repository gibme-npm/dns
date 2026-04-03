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
 * Encoder for DNS ZONEMD (Zone Message Digest) resource records (Type 63).
 *
 * Provides a cryptographic digest of a DNS zone's contents.
 *
 * @see RFC 8976
 */
export class ZONEMD {
    /** IANA resource record type identifier */
    public static readonly type: number = 63;

    /**
     * Decodes a ZONEMD record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the decoded ZONEMD record
     */
    public static decode (reader: Reader): ZONEMD.Record {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'ZONEMD RDATA length');
        const rdataLength = reader.uint16_t(true).toJSNumber();

        // Create bounded reader for RDATA payload
        const rdataReader = createBoundedReader(reader, rdataLength, 'ZONEMD RDATA payload');

        return {
            serial: rdataReader.uint32_t(true).toJSNumber(),
            scheme: rdataReader.uint8_t().toJSNumber(),
            algorithm: rdataReader.uint8_t().toJSNumber(),
            digest: rdataReader.unreadBuffer
        };
    }

    /**
     * Encodes a ZONEMD record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param data - the ZONEMD record to encode
     */
    public static encode (writer: Writer, data: ZONEMD.Record): void {
        const temp = new Writer();

        temp.uint32_t(data.serial ?? 0, true);

        temp.uint8_t(data.scheme ?? 0);

        temp.uint8_t(data.algorithm ?? 0);

        temp.bytes(data.digest ?? Buffer.alloc(0));

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace ZONEMD {
    export type Record = {
        /** SOA serial number the digest was generated from */
        serial: number;
        /** Digest scheme (1=SIMPLE) */
        scheme: number;
        /** Hash algorithm (1=SHA-384, 2=SHA-512) */
        algorithm: number;
        /** The zone digest data */
        digest: Buffer;
    }
}
