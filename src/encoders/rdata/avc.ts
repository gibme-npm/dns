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
import { DNS_MAX_STRING_LENGTH, ValidationErrors } from '../../constants/validation';
import { validateBufferLength, createBoundedReader } from '../../utils/validation';

/**
 * Encoder for DNS AVC (Application Visibility and Control) resource records (Type 258).
 *
 * Provides application visibility metadata.
 *
 * @see IANA experimental
 */
export class AVC {
    /** IANA resource record type identifier */
    public static readonly type: number = 258;

    /**
     * Decodes an AVC record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the decoded AVC strings
     */
    public static decode (reader: Reader): string[] {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'AVC RDATA length');
        const length = reader.uint16_t(true).toJSNumber();

        // Create bounded reader for RDATA payload
        const temp = createBoundedReader(reader, length, 'AVC RDATA payload');

        const strings: string[] = [];

        while (temp.unreadBytes > 0) {
            // Validate buffer has string length byte
            validateBufferLength(temp, 1, 'AVC string length');
            const str_length = temp.uint8_t().toJSNumber();

            // Validate string length
            if (str_length > DNS_MAX_STRING_LENGTH) {
                throw new Error(ValidationErrors.STRING_TOO_LONG(str_length));
            }

            // Validate buffer has string data
            validateBufferLength(temp, str_length, 'AVC string data');

            // FIX: Read from temp (bounded reader), not from reader (original buffer)
            strings.push(temp.bytes(str_length).toString('utf8'));
        }

        return strings;
    }

    /**
     * Encodes an AVC record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param data - the AVC text strings
     */
    public static encode (writer: Writer, data: string[]): void {
        const temp = new Writer();

        for (const str of data) {
            const buffer = Buffer.from(str, 'utf8');

            if (buffer.length > 255) {
                throw new Error('AVC string exceeds maximum length of 255 bytes');
            }

            temp.uint8_t(buffer.length);

            temp.bytes(buffer);
        }

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace AVC {
    export type Record = string[];
}
