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
import type { Name } from '../';
import { SVCB } from './svcb';

/**
 * Encoder for DNS HTTPS (HTTPS Service Binding) resource records (Type 65).
 *
 * Provides HTTPS-specific service binding parameters for a domain.
 *
 * @see RFC 9460
 */
export class HTTPS {
    /** IANA resource record type identifier */
    public static readonly type: number = 65;

    /**
     * Decodes an HTTPS record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the decoded HTTPS record
     */
    public static decode (reader: Reader): HTTPS.Record {
        return SVCB.decode(reader);
    }

    /**
     * Encodes an HTTPS record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param data - the HTTPS record to encode
     * @param index - compression index for DNS name compression
     */
    public static encode (writer: Writer, data: HTTPS.Record, index: Name.CompressionIndex): void {
        return SVCB.encode(writer, data, index);
    }
}

export namespace HTTPS {
    /**
     * HTTPS record data.
     *
     * - `priority` - Service priority (0 = alias mode, >0 = service mode)
     * - `target` - Target domain name
     * - `params` - Service parameters as key-value pairs
     */
    export type Record = SVCB.Record;
}
