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
import { Unsupported } from './unsupported';

/**
 * Encoder for DNS DOA (Digital Object Architecture) resource records (Type 259).
 *
 * Associates digital object identifiers with DNS names.
 * Note: The DOA RR is handled as an unsupported type due to specification complexity.
 *
 * @see IANA experimental
 */
export class DOA {
    /** IANA resource record type identifier */
    public static readonly type: number = 259;

    /**
     * Decodes a DOA record from the byte stream.
     *
     * @param reader - the byte stream reader positioned at the DOA RDATA
     * @returns the decoded DOA record as a raw Buffer
     */
    public static decode (reader: Reader): Buffer {
        return Unsupported.decode(reader, DOA.type).payload;
    }

    /**
     * Encodes a DOA record into the byte stream.
     *
     * @param writer - the byte stream writer to encode into
     * @param data - the raw DOA record data
     */
    public static encode (writer: Writer, data: Buffer): void {
        return Unsupported.encode(writer, {
            payload: data,
            type: DOA.type
        });
    }
}

export namespace DOA {
    /** The DOA record data stored as a raw Buffer (unsupported structured format). */
    export type Record = Buffer;
}
