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
 * Fallback encoder for unsupported or unknown DNS resource record types.
 *
 * Preserves the raw RDATA payload as a Buffer for record types without a dedicated encoder.
 */
export class Unsupported {
    /**
     * Decodes an unsupported record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @param type - the record type ID
     * @returns the decoded unsupported record
     */
    public static decode (reader: Reader, type: number): Unsupported.Record {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'Unsupported RDATA length');
        const rdataLength = reader.uint16_t(true).toJSNumber();

        // Create bounded reader for RDATA payload
        const rdataReader = createBoundedReader(reader, rdataLength, 'Unsupported RDATA payload');

        return {
            payload: rdataReader.bytes(rdataLength),
            type
        };
    }

    /**
     * Encodes an unsupported record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param data - the unsupported record to encode
     */
    public static encode (writer: Writer, data: Unsupported.Record): void {
        writer.uint16_t(data.payload.length, true);

        writer.bytes(data.payload);
    }
}

export namespace Unsupported {
    export type Record = {
        /** The raw RDATA payload */
        payload: Buffer;
        /** The numeric record type identifier */
        type: number;
    }
}
