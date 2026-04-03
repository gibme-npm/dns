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
import { TypeBitMap } from '../';
import { RType, RTYPE } from '../../types';
import { validateBufferLength, createBoundedReader } from '../../utils/validation';

/**
 * Encoder for DNS NSEC3 (Next Secure v3) resource records (Type 50).
 *
 * Provides hashed authenticated denial of existence for DNSSEC.
 *
 * @see RFC 5155
 */
export class NSEC3 {
    /** IANA resource record type identifier */
    public static readonly type: number = 50;

    /**
     * Decodes an NSEC3 record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the decoded NSEC3 record
     */
    public static decode (reader: Reader): NSEC3.Record {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'NSEC3 RDATA length');
        const rdataLength = reader.uint16_t(true).toJSNumber();

        // Create bounded reader for RDATA payload
        const rdataReader = createBoundedReader(reader, rdataLength, 'NSEC3 RDATA payload');

        const algorithm = rdataReader.uint8_t().toJSNumber();

        const flags = rdataReader.uint8_t().toJSNumber();

        const iterations = rdataReader.uint16_t(true).toJSNumber();

        const salt_length = rdataReader.uint8_t().toJSNumber();

        const salt = rdataReader.bytes(salt_length);

        const nextDomain_length = rdataReader.uint8_t().toJSNumber();

        const nextDomain = rdataReader.bytes(nextDomain_length);

        const types = TypeBitMap.decode(rdataReader);

        return {
            algorithm,
            flags,
            iterations,
            salt,
            nextDomain,
            types: types.map(type => new RType(type).name)
        };
    }

    /**
     * Encodes an NSEC3 record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param data - the NSEC3 record to encode
     */
    public static encode (writer: Writer, data: NSEC3.Record): void {
        const temp = new Writer();

        temp.uint8_t(data.algorithm ?? 0);

        temp.uint8_t(data.flags ?? 0);

        temp.uint16_t(data.iterations ?? 0, true);

        temp.uint8_t(data.salt.length ?? 0);

        temp.bytes(data.salt ?? Buffer.alloc(0));

        temp.uint8_t(data.nextDomain.length ?? 0);

        temp.bytes(data.nextDomain ?? Buffer.alloc(0));

        TypeBitMap.encode(temp, (data.types ?? []).map(type => new RType(type).id));

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace NSEC3 {
    export type Record = {
        /** Hash algorithm (1=SHA-1) */
        algorithm: number;
        /** NSEC3 flags (bit 0: opt-out) */
        flags: number;
        /** Number of additional hash iterations */
        iterations: number;
        /** Salt value for the hash */
        salt: Buffer;
        /** Hash of the next owner name */
        nextDomain: Buffer;
        /** Bitmap of record types at the hashed owner name */
        types: RTYPE[];
    }
}
