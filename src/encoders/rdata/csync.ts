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
import { TypeBitMap } from '../';
import { RType, RTYPE } from '../../types';
import { validateBufferLength, createBoundedReader } from '../../utils/validation';

/**
 * Encoder for DNS CSYNC (Child-to-Parent Synchronization) resource records (Type 62).
 *
 * Indicates which records in a child zone should be synchronized to the parent.
 *
 * @see RFC 7477
 */
export class CSYNC {
    /** IANA resource record type identifier */
    public static readonly type: number = 62;

    /**
     * Decodes a CSYNC record from the byte stream.
     *
     * @param reader - the byte stream reader positioned at the CSYNC RDATA
     * @returns the decoded CSYNC record
     */
    public static decode (reader: Reader): CSYNC.Record {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'CSYNC RDATA length');
        const rdataLength = reader.uint16_t(true).toJSNumber();

        // Create bounded reader for RDATA payload
        const rdataReader = createBoundedReader(reader, rdataLength, 'CSYNC RDATA payload');

        const serial = rdataReader.uint32_t(true).toJSNumber();

        const flags = rdataReader.uint16_t(true).toJSNumber();

        const types = TypeBitMap.decode(new Reader(rdataReader.unreadBuffer));

        return {
            serial,
            flags,
            types: types.map(type => new RType(type).name)
        };
    }

    /**
     * Encodes a CSYNC record into the byte stream.
     *
     * @param writer - the byte stream writer to encode into
     * @param data - the CSYNC record to encode
     */
    public static encode (writer: Writer, data: CSYNC.Record): void {
        const temp = new Writer();

        temp.uint32_t(data.serial ?? 0, true);

        temp.uint16_t(data.flags ?? 0, true);

        TypeBitMap.encode(temp, (data.types ?? []).map(type => new RType(type).id));

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace CSYNC {
    export type Record = {
        /** The SOA serial number for synchronization */
        serial: number;
        /** CSYNC flags (bit 0: immediate, bit 1: SOA minimum) */
        flags: number;
        /** Bitmap of record types to synchronize */
        types: RTYPE[];
    }
}
