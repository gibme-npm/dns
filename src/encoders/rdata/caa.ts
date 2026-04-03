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
 * Encoder for DNS CAA (Certification Authority Authorization) resource records (Type 257).
 *
 * Specifies which certificate authorities are authorized to issue certificates for a domain.
 *
 * @see RFC 8659
 */
export class CAA {
    /** IANA resource record type identifier */
    public static readonly type: number = 257;
    public static readonly ISSUER_CRITICAL = 1 << 7;

    /**
     * Decodes a CAA record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the decoded CAA record
     */
    public static decode (reader: Reader): CAA.Record {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'CAA RDATA length');
        const rdataLength = reader.uint16_t(true).toJSNumber();

        // Create bounded reader for RDATA payload
        const rdataReader = createBoundedReader(reader, rdataLength, 'CAA RDATA payload');

        const flags = rdataReader.uint8_t().toJSNumber();

        const tag = String.decode(rdataReader);

        const value = rdataReader.unreadBuffer.toString('utf8');

        return {
            flags,
            tag,
            value,
            issuerCritical: !!(flags & CAA.ISSUER_CRITICAL)
        };
    }

    /**
     * Encodes a CAA record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param data - the CAA record to encode
     */
    public static encode (writer: Writer, data: CAA.Record): void {
        const temp = new Writer();

        let { flags } = data;

        flags ??= 0;

        if (data.issuerCritical) {
            flags |= CAA.ISSUER_CRITICAL;
        }

        temp.uint8_t(flags);

        String.encode(temp, data.tag ?? '');

        temp.bytes(Buffer.from(data.value ?? '', 'utf8'));

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace CAA {
    export type Record = {
        /** CAA flags byte */
        flags: number;
        /** The property tag (e.g. issue, issuewild, iodef) */
        tag: string;
        /** The property value */
        value: string;
        /** Whether the issuer critical flag is set */
        issuerCritical: boolean;
    }
}
