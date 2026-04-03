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
import { DS } from './ds';

/**
 * Encoder for DNS CDS (Child DS) resource records (Type 59).
 *
 * Contains a child zone's DS record for parent validation during key rollovers.
 *
 * @see RFC 7344 Section 3.1
 */
export class CDS {
    /** IANA resource record type identifier */
    public static readonly type: number = 59;

    /**
     * Decodes a CDS record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the decoded CDS record
     */
    public static decode (reader: Reader): CDS.Record {
        return DS.decode(reader);
    }

    /**
     * Encodes a CDS record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param record - the CDS record to encode
     */
    public static encode (writer: Writer, record: CDS.Record): void {
        return DS.encode(writer, record);
    }
}

export namespace CDS {
    export type Record = DS.Record;
}
