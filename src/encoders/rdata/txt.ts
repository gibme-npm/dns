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
 * Encoder for DNS TXT (Text) resource records (Type 16).
 *
 * Holds arbitrary text strings, commonly used for SPF, DKIM, and domain verification.
 *
 * @see RFC 1035 Section 3.3.14
 */
export class TXT {
    /** IANA resource record type identifier */
    public static readonly type: number = 16;

    /**
     * Decodes a TXT record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the decoded text strings
     */
    public static decode (reader: Reader): Record<string, string> {
        const result: Record<string, string> = {};

        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'TXT RDATA length');
        const rdataLength = reader.uint16_t(true).toJSNumber();

        // Create bounded reader for RDATA payload
        const rdataReader = createBoundedReader(reader, rdataLength, 'TXT RDATA payload');

        while (rdataReader.unreadBytes > 0) {
            const length = rdataReader.uint8_t().toJSNumber();

            const [key, ...value] = rdataReader.bytes(length).toString('utf8').split('=');

            result[key.trim()] = (value.join('=') ?? '').trim();
        }

        return result;
    }

    /**
     * Encodes a TXT record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param data - the text strings to encode
     */
    public static encode (writer: Writer, data: Record<string, string>): void {
        const temp = new Writer();

        for (const [key, value] of Object.entries(data)) {
            const entry = Buffer.from(`${key}=${value ?? ''}`, 'utf8');

            temp.uint8_t(entry.length);

            temp.bytes(entry);
        }

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace TXT {
    export type Record = {[key: string]: string};
}
