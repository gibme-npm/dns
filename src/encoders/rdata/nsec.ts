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
import { Name, TypeBitMap } from '../';
import { RTYPE, RType } from '../../types';
import { validateBufferLength } from '../../utils/validation';

/**
 * Encoder for DNS NSEC (Next Secure) resource records (Type 47).
 *
 * Provides authenticated denial of existence for DNSSEC.
 *
 * @see RFC 4034 Section 4
 */
export class NSEC {
    /** IANA resource record type identifier */
    public static readonly type: number = 47;

    /**
     * Decodes an NSEC record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the decoded NSEC record
     */
    public static decode (reader: Reader): NSEC.Record {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'NSEC RDATA length');
        reader.uint16_t(true).toJSNumber(); // length, unused for compression-capable records

        const nextDomain = Name.decode(reader);

        // Remaining bytes are the type bitmap
        const types = TypeBitMap.decode(reader);

        return {
            nextDomain,
            types: types.map(type => new RType(type).name)
        };
    }

    /**
     * Encodes an NSEC record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param data - the NSEC record to encode
     * @param index - compression index for DNS name compression
     */
    public static encode (writer: Writer, data: NSEC.Record, index: Name.CompressionIndex): void {
        const temp = new Writer();

        temp.bytes(Name.compress(data.nextDomain ?? '', index, writer.length + 2));

        TypeBitMap.encode(temp, (data.types ?? []).map(type => new RType(type).id));

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace NSEC {
    export type Record = {
        /** The next owner name in canonical ordering */
        nextDomain: string;
        /** Bitmap of record types that exist at the NSEC owner name */
        types: RTYPE[];
    }
}
