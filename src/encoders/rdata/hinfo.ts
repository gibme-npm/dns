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
import { String } from '../';
import { validateBufferLength, createBoundedReader } from '../../utils/validation';

/**
 * Encoder for DNS HINFO (Host Information) resource records (Type 13).
 *
 * Describes the hardware and operating system of a host.
 *
 * @see RFC 1035 Section 3.3.2
 */
export class HINFO {
    /** IANA resource record type identifier */
    public static readonly type: number = 13;

    /**
     * Decodes an HINFO record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the decoded HINFO record
     */
    public static decode (reader: Reader): HINFO.Record {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'HINFO RDATA length');
        const rdataLength = reader.uint16_t(true).toJSNumber();

        // Create bounded reader for RDATA payload
        const rdataReader = createBoundedReader(reader, rdataLength, 'HINFO RDATA payload');

        return {
            cpu: String.decode(rdataReader),
            os: String.decode(rdataReader)
        };
    }

    /**
     * Encodes an HINFO record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param data - the HINFO record to encode
     */
    public static encode (writer: Writer, data: HINFO.Record): void {
        const temp = new Writer();

        String.encode(temp, data.cpu ?? '');

        String.encode(temp, data.os ?? '');

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace HINFO {
    export type Record = {
        /** CPU type or architecture */
        cpu: string;
        /** Operating system name */
        os: string;
    }
}
