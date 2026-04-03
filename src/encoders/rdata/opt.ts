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
 * Encoder for DNS OPT (Option) pseudo-resource records (Type 41).
 *
 * Carries EDNS(0) extension information in DNS messages.
 *
 * @see RFC 6891
 */
export class OPT {
    /** IANA resource record type identifier */
    public static readonly type: number = 41;

    /**
     * Decodes an OPT record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the decoded OPT record
     */
    public static decode (reader: Reader): OPT.Record {
        const udpPayloadSize = reader.uint16_t(true).toJSNumber();

        const rcode = reader.uint8_t().toJSNumber();

        const eDnsVersion = reader.uint8_t().toJSNumber();

        const flags = reader.uint16_t(true).toJSNumber();

        const flag_do = ((flags >> 15) & 0x1) === 1;

        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'OPT RDATA length');
        const rdataLength = reader.uint16_t(true).toJSNumber();

        // Create bounded reader for RDATA payload
        const rdataReader = createBoundedReader(reader, rdataLength, 'OPT RDATA payload');

        const options = new Map<number, Buffer>();

        while (rdataReader.unreadBytes > 0) {
            const code = rdataReader.uint16_t(true).toJSNumber();

            const optionLength = rdataReader.uint16_t(true).toJSNumber();

            options.set(code, rdataReader.bytes(optionLength));
        }

        return {
            udpPayloadSize,
            rcode,
            eDnsVersion,
            flags,
            do: flag_do,
            options
        };
    }

    /**
     * Encodes an OPT record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param data - the OPT record to encode
     */
    public static encode (writer: Writer, data: OPT.Record): void {
        const temp = new Writer();

        temp.uint16_t(data.udpPayloadSize ?? 0, true);

        temp.uint8_t(data.rcode ?? 0);

        temp.uint8_t(data.eDnsVersion ?? 0);

        let { flags } = data;
        flags ??= 0;

        if (data.do) {
            flags |= 0x8000;
        } else {
            flags &= 0x7FFF;
        }

        temp.uint16_t(flags, true);

        const options = new Writer();

        for (const [code, value] of data.options) {
            options.uint16_t(code, true);

            options.uint16_t(value.length, true);

            options.bytes(value);
        }

        temp.uint16_t(options.length, true);

        temp.bytes(options.buffer);

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace OPT {
    /** Decoded OPT record data */
    export type Record = {
        /** Maximum UDP payload size the sender can reassemble */
        udpPayloadSize: number;
        /** Upper 8 bits of the extended RCODE */
        rcode: number;
        /** EDNS version supported */
        eDnsVersion: number;
        /** EDNS flags */
        flags: number;
        /** DNSSEC OK flag indicating DNSSEC-aware resolver */
        do: boolean;
        /** List of EDNS option code-data pairs */
        options: Map<number, Buffer>; // TODO: I'd like to handle these better than this
    }
}
