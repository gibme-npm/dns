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
 * Encoder for DNS TLSA (Transport Layer Security Authentication) resource records (Type 52).
 *
 * Associates TLS certificates with domain names for DANE.
 *
 * @see RFC 6698
 */
export class TLSA {
    /** IANA resource record type identifier */
    public static readonly type: number = 52;

    /**
     * Decodes a TLSA record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the decoded TLSA record
     */
    public static decode (reader: Reader): TLSA.Record {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'TLSA RDATA length');
        const rdataLength = reader.uint16_t(true).toJSNumber();

        // Create bounded reader for RDATA payload
        const rdataReader = createBoundedReader(reader, rdataLength, 'TLSA RDATA payload');

        return {
            usage: rdataReader.uint8_t().toJSNumber(),
            selector: rdataReader.uint8_t().toJSNumber(),
            matchingType: rdataReader.uint8_t().toJSNumber(),
            certificate: rdataReader.unreadBuffer
        };
    }

    /**
     * Encodes a TLSA record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param data - the TLSA record to encode
     */
    public static encode (writer: Writer, data: TLSA.Record): void {
        const temp = new Writer();

        temp.uint8_t(data.usage ?? 0);

        temp.uint8_t(data.selector ?? 0);

        temp.uint8_t(data.matchingType ?? 0);

        temp.bytes(data.certificate ?? Buffer.alloc(0));

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace TLSA {
    export type Record = {
        /** Certificate association data */
        certificate: Buffer;
        /** Certificate usage (0=CA constraint, 1=service certificate, 2=trust anchor, 3=domain-issued) */
        usage: number;
        /** Selector (0=full certificate, 1=SubjectPublicKeyInfo) */
        selector: number;
        /** Matching type (0=exact, 1=SHA-256, 2=SHA-512) */
        matchingType: number;
    }
}
