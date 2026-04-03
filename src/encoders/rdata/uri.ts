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
 * Encoder for DNS URI (Uniform Resource Identifier) resource records (Type 256).
 *
 * Publishes URI mappings for domain names.
 *
 * @see RFC 7553
 */
export class URI {
    /** IANA resource record type identifier */
    public static readonly type: number = 256;

    /**
     * Decodes a URI record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the decoded URI record
     */
    public static decode (reader: Reader): URI.Record {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'URI RDATA length');
        const rdataLength = reader.uint16_t(true).toJSNumber();

        // Create bounded reader for RDATA payload
        const rdataReader = createBoundedReader(reader, rdataLength, 'URI RDATA payload');

        return {
            priority: rdataReader.uint16_t(true).toJSNumber(),
            weight: rdataReader.uint16_t(true).toJSNumber(),
            target: rdataReader.unreadBuffer.toString('utf8')
        };
    }

    /**
     * Encodes a URI record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param data - the URI record to encode
     */
    public static encode (writer: Writer, data: URI.Record): void {
        const temp = new Writer();

        temp.uint16_t(data.priority ?? 0, true);

        temp.uint16_t(data.weight ?? 0, true);

        temp.bytes(Buffer.from(data.target ?? '', 'utf8'));

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace URI {
    export type Record = {
        /** Service priority (lower is preferred) */
        priority: number;
        /** Relative weight for records with equal priority */
        weight: number;
        /** The URI target string */
        target: string;
    }
}
