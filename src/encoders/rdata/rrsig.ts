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
import { validateBufferLength, validateNonNegativeLength } from '../../utils/validation';

/**
 * Encoder for DNS RRSIG (Resource Record Signature) resource records (Type 46).
 *
 * Contains a DNSSEC signature covering an RRset.
 *
 * @see RFC 4034 Section 3
 */
export class RRSIG {
    /** IANA resource record type identifier */
    public static readonly type: number = 46;

    /**
     * Decodes an RRSIG record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the decoded RRSIG record
     */
    public static decode (reader: Reader): RRSIG.Record {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'RRSIG RDATA length');
        const rdataLength = reader.uint16_t(true).toJSNumber();

        // Validate minimum fixed fields are available
        validateBufferLength(reader, 18, 'RRSIG fixed fields');

        const typeCovered = reader.uint16_t(true).toJSNumber();

        const algorithm = reader.uint8_t().toJSNumber();

        const labels = reader.uint8_t().toJSNumber();

        const originalTTL = reader.uint32_t().toJSNumber();

        const signatureExpiration = reader.uint32_t().toJSNumber();

        const signatureInception = reader.uint32_t().toJSNumber();

        const keyTag = reader.uint16_t(true).toJSNumber();

        const beforeName = reader.offset;
        const signerName = Name.decode(reader);
        const nameWireLength = reader.offset - beforeName;

        const signatureLength = rdataLength - 18 - nameWireLength;
        validateNonNegativeLength(signatureLength, 'RRSIG signature length');

        const signature = reader.bytes(signatureLength);

        return {
            typeCovered,
            algorithm,
            labels,
            originalTTL,
            signatureExpiration,
            signatureInception,
            keyTag,
            signerName,
            signature
        };
    }

    /**
     * Encodes an RRSIG record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param data - the RRSIG record to encode
     * @param index - compression index for DNS name compression
     */
    public static encode (writer: Writer, data: RRSIG.Record, index: Name.CompressionIndex): void {
        const temp = new Writer();

        temp.uint16_t(data.typeCovered ?? 0, true);

        temp.uint8_t(data.algorithm ?? 0);

        temp.uint8_t(data.labels ?? 0);

        temp.uint32_t(data.originalTTL ?? 0);

        temp.uint32_t(data.signatureExpiration ?? 0);

        temp.uint32_t(data.signatureInception ?? 0);

        temp.uint16_t(data.keyTag ?? 0, true);

        temp.bytes(Name.compress(data.signerName ?? '', index, writer.length + temp.length + 2));

        temp.bytes(data.signature ?? Buffer.alloc(0));

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace RRSIG {
    /** Decoded RRSIG record data */
    export type Record = {
        /** RR type covered by this signature */
        typeCovered: number;
        /** DNSSEC algorithm number */
        algorithm: number;
        /** Number of labels in the original owner name */
        labels: number;
        /** Original TTL of the covered RRset */
        originalTTL: number;
        /** Signature expiration timestamp */
        signatureExpiration: number;
        /** Signature inception timestamp */
        signatureInception: number;
        /** Key tag of the signing DNSKEY */
        keyTag: number;
        /** Domain name of the signing authority */
        signerName: string;
        /** The cryptographic signature */
        signature: Buffer;
    }
}
