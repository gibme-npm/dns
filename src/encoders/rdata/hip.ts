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
import { Name } from '../';
import { ValidationErrors } from '../../constants/validation';
import { validateBufferLength, validateNonNegativeLength } from '../../utils/validation';

/**
 * Encoder for DNS HIP (Host Identity Protocol) resource records (Type 55).
 *
 * Associates a Host Identity Tag with public key and rendezvous servers.
 *
 * @see RFC 8005
 */
export class HIP {
    /** IANA resource record type identifier */
    public static readonly type: number = 55;

    /**
     * Decodes a HIP record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the decoded HIP record
     */
    public static decode (reader: Reader): HIP.Record {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'HIP RDATA length');
        const rdataLength = reader.uint16_t(true).toJSNumber();

        let remainingLength = rdataLength;

        // Read fixed-length header fields
        validateBufferLength(reader, 4, 'HIP header');

        const hit_length = reader.uint8_t().toJSNumber();
        remainingLength -= 1;

        const publicKeyAlgorithm = reader.uint8_t().toJSNumber();
        remainingLength -= 1;

        const public_key_length = reader.uint16_t(true).toJSNumber();
        remainingLength -= 2;

        // Validate variable-length fields
        validateBufferLength(reader, hit_length, 'HIP HIT');
        const hit = reader.bytes(hit_length);
        remainingLength -= hit_length;

        validateNonNegativeLength(remainingLength, 'HIP after HIT');

        validateBufferLength(reader, public_key_length, 'HIP public key');
        const publicKey = reader.bytes(public_key_length);
        remainingLength -= public_key_length;

        validateNonNegativeLength(remainingLength, 'HIP after public key');

        // Decode rendezvous servers
        const rendezvousServers: string[] = [];

        while (remainingLength > 0) {
            const before = reader.unreadBytes;

            // Validate we have at least 1 byte for name
            validateBufferLength(reader, 1, 'HIP rendezvous server name');

            rendezvousServers.push(Name.decode(reader));

            const after = reader.unreadBytes;
            const consumed = before - after;

            // Detect zero-byte consumption (infinite loop)
            if (consumed === 0) {
                throw new Error(ValidationErrors.ZERO_BYTE_CONSUMPTION('HIP rendezvous servers'));
            }

            remainingLength -= consumed;

            validateNonNegativeLength(remainingLength, 'HIP after rendezvous server');
        }

        return {
            publicKeyAlgorithm,
            publicKey,
            hit,
            rendezvousServers
        };
    }

    /**
     * Encodes a HIP record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param data - the HIP record to encode
     * @param index - compression index for DNS name compression
     */
    public static encode (writer: Writer, data: HIP.Record, index: Name.CompressionIndex): void {
        const temp = new Writer();

        temp.uint8_t(data.hit.length ?? 0);

        temp.uint8_t(data.publicKeyAlgorithm ?? 0);

        temp.uint16_t(data.publicKey.length ?? 0, true);

        temp.bytes(data.hit ?? Buffer.alloc(0));

        temp.bytes(data.publicKey ?? Buffer.alloc(0));

        for (const server of data.rendezvousServers ?? []) {
            temp.bytes(Name.compress(server, index, writer.length + temp.length + 2));
        }

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace HIP {
    export type Record = {
        /** HIP public key algorithm */
        publicKeyAlgorithm: number;
        /** The host's public key */
        publicKey: Buffer;
        /** Host Identity Tag */
        hit: Buffer;
        /** List of rendezvous server domain names */
        rendezvousServers: string[];
    }
}
