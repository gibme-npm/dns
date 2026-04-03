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
 * Encoder for DNS SRV (Service Locator) resource records (Type 33).
 *
 * Specifies the location of services by protocol and domain.
 *
 * @see RFC 2782
 */
export class SRV {
    /** IANA resource record type identifier */
    public static readonly type: number = 33;

    /**
     * Decodes an SRV record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the decoded SRV record
     */
    public static decode (reader: Reader): SRV.Record {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'SRV RDATA length');
        reader.uint16_t(true).toJSNumber(); // length, unused for compression-capable records

        // Validate minimum fields are available
        validateBufferLength(reader, 6, 'SRV fixed fields');

        return {
            priority: reader.uint16_t(true).toJSNumber(),
            weight: reader.uint16_t(true).toJSNumber(),
            port: reader.uint16_t(true).toJSNumber(),
            target: Name.decode(reader)
        };
    }

    /**
     * Encodes an SRV record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param data - the SRV record to encode
     * @param index - compression index for DNS name pointer compression
     */
    public static encode (writer: Writer, data: SRV.Record, index: Name.CompressionIndex): void {
        const temp = new Writer();

        temp.uint16_t(data.priority ?? 0, true);

        temp.uint16_t(data.weight ?? 0, true);

        temp.uint16_t(data.port ?? 0, true);

        temp.bytes(Name.compress(data.target ?? '', index, writer.length + temp.length + 2));

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace SRV {
    export type Record = {
        /** Service priority (lower is preferred) */
        priority: number;
        /** Relative weight for records with equal priority */
        weight: number;
        /** TCP or UDP port number */
        port: number;
        /** Domain name of the target host */
        target: string;
    }
}
