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
 * Encoder for DNS DS (Delegation Signer) resource records (Type 43).
 *
 * Links a child zone's DNSKEY to its parent zone for DNSSEC chain of trust.
 *
 * @see RFC 4034 Section 5
 */
export class DS {
    /** IANA resource record type identifier */
    public static readonly type: number = 43;

    /**
     * Decodes a DS record from the byte stream.
     *
     * @param reader - the byte stream reader positioned at the DS RDATA
     * @returns the decoded DS record
     */
    public static decode (reader: Reader): DS.Record {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'DS RDATA length');
        const rdataLength = reader.uint16_t(true).toJSNumber();

        // Create bounded reader for RDATA payload
        const rdataReader = createBoundedReader(reader, rdataLength, 'DS RDATA payload');

        return {
            keyTag: rdataReader.uint16_t(true).toJSNumber(),
            algorithm: rdataReader.uint8_t().toJSNumber(),
            digestType: rdataReader.uint8_t().toJSNumber(),
            digest: rdataReader.unreadBuffer
        };
    }

    /**
     * Encodes a DS record into the byte stream.
     *
     * @param writer - the byte stream writer to encode into
     * @param data - the DS record to encode
     */
    public static encode (writer: Writer, data: DS.Record): void {
        const temp = new Writer();

        temp.uint16_t(data.keyTag ?? 0, true);

        temp.uint8_t(data.algorithm ?? 0);

        temp.uint8_t(data.digestType ?? 0);

        temp.bytes(data.digest ?? Buffer.alloc(0));

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace DS {
    export type Record = {
        /** Key tag of the referenced DNSKEY */
        keyTag: number;
        /** DNSSEC algorithm number */
        algorithm: number;
        /** Digest algorithm type (1=SHA-1, 2=SHA-256, etc.) */
        digestType: number;
        /** The digest of the referenced DNSKEY */
        digest: Buffer;
    }
}
