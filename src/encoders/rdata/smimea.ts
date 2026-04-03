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
 * Encoder for DNS SMIMEA (S/MIME Certificate Association) resource records (Type 53).
 *
 * Associates S/MIME certificates with email addresses via DNS.
 *
 * @see RFC 8162
 */
export class SMIMEA {
    /** IANA resource record type identifier */
    public static readonly type: number = 53;

    /**
     * Decodes an SMIMEA record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the decoded SMIMEA record
     */
    public static decode (reader: Reader): SMIMEA.Record {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'SMIMEA RDATA length');
        const rdataLength = reader.uint16_t(true).toJSNumber();

        // Create bounded reader for RDATA payload
        const rdataReader = createBoundedReader(reader, rdataLength, 'SMIMEA RDATA payload');

        return {
            certificateUsage: rdataReader.uint8_t().toJSNumber(),
            selector: rdataReader.uint8_t().toJSNumber(),
            matchingType: rdataReader.uint8_t().toJSNumber(),
            certificateAssociationData: rdataReader.unreadBuffer
        };
    }

    /**
     * Encodes an SMIMEA record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param data - the SMIMEA record to encode
     */
    public static encode (writer: Writer, data: SMIMEA.Record): void {
        const temp = new Writer();

        temp.uint8_t(data.certificateUsage ?? 0);

        temp.uint8_t(data.selector ?? 0);

        temp.uint8_t(data.matchingType ?? 0);

        temp.bytes(data.certificateAssociationData ?? Buffer.alloc(0));

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace SMIMEA {
    export type Record = {
        /** Certificate usage (0=CA constraint, 1=service certificate, 2=trust anchor, 3=domain-issued) */
        certificateUsage: number;
        /** Selector (0=full certificate, 1=SubjectPublicKeyInfo) */
        selector: number;
        /** Matching type (0=exact, 1=SHA-256, 2=SHA-512) */
        matchingType: number;
        /** Certificate association data */
        certificateAssociationData: Buffer;
    }
}
