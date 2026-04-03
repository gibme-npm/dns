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

import type { Reader, Writer } from '@gibme/bytepack';
import { DNS_MAX_STRING_LENGTH, ValidationErrors } from '../constants/validation';
import { validateBufferLength, getUtf8ByteLength } from '../utils/validation';

/**
 * Encoder for DNS character-strings as defined in RFC 1035 Section 3.3.
 * Handles length-prefixed strings with a maximum of 255 bytes.
 */
export class String {
    /**
     * Decodes a simple string from the provided byte stream
     * @param reader
     */
    public static decode (reader: Reader): string {
        // Validate buffer has length byte
        validateBufferLength(reader, 1, 'String length byte');

        const length = reader.uint8_t().toJSNumber();

        // Validate length doesn't exceed maximum
        if (length > DNS_MAX_STRING_LENGTH) {
            throw new Error(ValidationErrors.STRING_TOO_LONG(length));
        }

        // Validate buffer has string data
        validateBufferLength(reader, length, 'String data');

        return reader.bytes(length).toString('utf8');
    }

    /**
     * Encodes a single string into the provided Writer instance
     * @param writer
     * @param str
     */
    public static encode (writer: Writer, str: string): void {
        // Get actual UTF-8 byte length (not character count)
        const byteLength = getUtf8ByteLength(str);

        // Validate byte length doesn't exceed maximum
        if (byteLength > DNS_MAX_STRING_LENGTH) {
            throw new Error(ValidationErrors.STRING_TOO_LONG(byteLength));
        }

        writer.uint8_t(byteLength);
        writer.bytes(Buffer.from(str, 'utf8'));
    }
}
