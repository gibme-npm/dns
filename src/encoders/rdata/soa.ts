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
import { validateBufferLength } from '../../utils/validation';

/**
 * Encoder for DNS SOA (Start of Authority) resource records (Type 6).
 *
 * Marks the start of a zone of authority and contains zone administration parameters.
 *
 * @see RFC 1035 Section 3.3.13
 */
export class SOA {
    /** IANA resource record type identifier */
    public static readonly type: number = 6;

    /**
     * Decodes a SOA record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the decoded SOA record
     */
    public static decode (reader: Reader): SOA.Record {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'SOA RDATA length');
        reader.uint16_t(true).toJSNumber(); // length, unused for compression-capable records

        return {
            mname: Name.decode(reader),
            rname: Name.decode(reader, true),
            serial: reader.uint32_t(true).toJSNumber(),
            refresh: reader.uint32_t(true).toJSNumber(),
            retry: reader.uint32_t(true).toJSNumber(),
            expire: reader.uint32_t(true).toJSNumber(),
            minimum: reader.uint32_t(true).toJSNumber()
        };
    }

    /**
     * Encodes a SOA record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param data - the SOA record to encode
     * @param index - compression index for DNS name pointer compression
     */
    public static encode (writer: Writer, data: SOA.Record, index: Name.CompressionIndex): void {
        const temp = new Writer();

        temp.bytes(Name.compress(data.mname ?? '', index, writer.length + 2));

        temp.bytes(Name.compress(
            data.rname ?? '', index, writer.length + temp.length + 2, true));

        temp.uint32_t(data.serial ?? 0, true);

        temp.uint32_t(data.refresh ?? 0, true);

        temp.uint32_t(data.retry ?? 0, true);

        temp.uint32_t(data.expire ?? 0, true);

        temp.uint32_t(data.minimum ?? 0, true);

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace SOA {
    export type Record = {
        /** Primary name server for the zone */
        mname: string;
        /** Email of the zone administrator (encoded as domain name) */
        rname: string;
        /** Zone serial number */
        serial: number;
        /** Refresh interval in seconds */
        refresh: number;
        /** Retry interval in seconds */
        retry: number;
        /** Expiration time in seconds */
        expire: number;
        /** Minimum TTL for negative caching */
        minimum: number;
    }
}
