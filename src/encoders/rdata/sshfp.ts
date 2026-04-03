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
 * Encoder for DNS SSHFP (SSH Fingerprint) resource records (Type 44).
 *
 * Publishes SSH host key fingerprints in DNS for verification.
 *
 * @see RFC 4255
 */
export class SSHFP {
    /** IANA resource record type identifier */
    public static readonly type: number = 44;

    /**
     * Decodes an SSHFP record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the decoded SSHFP record
     */
    public static decode (reader: Reader): SSHFP.Record {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'SSHFP RDATA length');
        const rdataLength = reader.uint16_t(true).toJSNumber();

        // Create bounded reader for RDATA payload
        const rdataReader = createBoundedReader(reader, rdataLength, 'SSHFP RDATA payload');

        return {
            algorithm: rdataReader.uint8_t().toJSNumber(),
            hash: rdataReader.uint8_t().toJSNumber(),
            fingerprint: rdataReader.unreadBuffer
        };
    }

    /**
     * Encodes an SSHFP record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param data - the SSHFP record to encode
     */
    public static encode (writer: Writer, data: SSHFP.Record): void {
        const temp = new Writer();

        temp.uint8_t(data.algorithm ?? 0);

        temp.uint8_t(data.hash ?? 0);

        temp.bytes(data.fingerprint ?? Buffer.alloc(0));

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace SSHFP {
    export type Record = {
        /** SSH key algorithm (1=RSA, 2=DSA, 3=ECDSA, 4=Ed25519) */
        algorithm: number;
        /** Fingerprint hash type (1=SHA-1, 2=SHA-256) */
        hash: number;
        /** The key fingerprint data */
        fingerprint: Buffer;
    }
}
