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
import { Name, String } from '../';
import { Address4, Address6 } from 'ip-address';
import { ValidationErrors } from '../../constants/validation';
import { validateBufferLength, validateNonNegativeLength } from '../../utils/validation';

export type ParameterValue = Buffer | string | undefined | number;

type Parameters = Record<number, ParameterValue[]>;

/**
 * Encoder for DNS SVCB (Service Binding) resource records (Type 64).
 *
 * Provides alternative endpoints and associated parameters for a service.
 *
 * @see RFC 9460
 */
export class SVCB {
    /** IANA resource record type identifier */
    public static readonly type: number = 64;

    /**
     * Decodes an SVCB record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the decoded SVCB record
     */
    public static decode (reader: Reader): SVCB.Record {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'SVCB RDATA length');
        const rdataLength = reader.uint16_t(true).toJSNumber();

        // Read priority
        validateBufferLength(reader, 2, 'SVCB priority');
        const priority = reader.uint16_t(true).toJSNumber();

        // Read target name
        const beforeTarget = reader.unreadBytes;
        const target = Name.decode(reader);
        const targetLength = beforeTarget - reader.unreadBytes;

        // Calculate remaining length for parameters
        let remainingLength = rdataLength - 2 - targetLength;
        validateNonNegativeLength(remainingLength, 'SVCB after target');

        const parameters: Parameters = {};

        while (remainingLength > 0) {
            // Validate buffer has key and length fields
            validateBufferLength(reader, 4, 'SVCB parameter header');

            const key = reader.uint16_t(true).toJSNumber();
            const parameterLength = reader.uint16_t(true).toJSNumber();

            remainingLength -= 4;
            validateNonNegativeLength(remainingLength, 'SVCB after parameter header');

            // Validate parameter length doesn't exceed remaining data
            if (parameterLength > remainingLength) {
                throw new Error(`SVCB parameter length ${parameterLength} exceeds remaining data ${remainingLength}`);
            }

            parameters[key] ??= [];

            let paramBytesConsumed = 0;

            while (paramBytesConsumed < parameterLength) {
                const beforeParam = reader.unreadBytes;

                switch (key) {
                    case 1: // alpn
                        parameters[key].push(String.decode(reader));
                        break;
                    case 2: // no-default-alpn
                        parameters[key].push(undefined);
                        break;
                    case 3: // port
                        validateBufferLength(reader, 2, 'SVCB port');
                        parameters[key].push(reader.uint16_t(true).toJSNumber());
                        break;
                    case 4: // ipv4hint
                        validateBufferLength(reader, 4, 'SVCB IPv4 hint');
                        parameters[key].push(Address4.fromHex(reader.bytes(4).toString('hex')).address);
                        break;
                    case 6: // ipv6hint
                        validateBufferLength(reader, 16, 'SVCB IPv6 hint');
                        parameters[key].push(Address6.fromUnsignedByteArray([...reader.bytes(16)]).address);
                        break;
                    case 7: // dohpath
                    case 8: // privatedohtarget
                        parameters[key].push(Name.decode(reader));
                        break;
                    case 5: // ech
                    default: {
                        const echLength = parameterLength - paramBytesConsumed;
                        parameters[key].push(reader.bytes(echLength));
                        break;
                    }
                }

                const afterParam = reader.unreadBytes;
                const consumed = beforeParam - afterParam;

                // Detect zero-byte consumption (infinite loop)
                if (consumed === 0) {
                    throw new Error(ValidationErrors.ZERO_BYTE_CONSUMPTION(`SVCB parameter ${key}`));
                }

                paramBytesConsumed += consumed;
            }

            remainingLength -= parameterLength;
            validateNonNegativeLength(remainingLength, `SVCB after parameter ${key}`);
        }

        return {
            priority,
            target,
            parameters
        };
    }

    /**
     * Encodes an SVCB record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param data - the SVCB record to encode
     * @param index - compression index for DNS name pointer compression
     */
    public static encode (writer: Writer, data: SVCB.Record, index: Name.CompressionIndex): void {
        const temp = new Writer();

        temp.uint16_t(data.priority ?? 0, true);

        temp.bytes(Name.compress(data.target ?? '', index, temp.length + 6));

        const keys = Object.keys(data.parameters ?? {})
            .map(key => parseInt(key, 10) || 0)
            .sort((a, b) => a - b);

        for (const key of keys) {
            if (key === 0) continue;

            temp.uint16_t(key, true);

            const values = data.parameters[key];

            const temp_value = new Writer();

            for (const value of values ?? []) {
                switch (key) {
                    case 1: // alpn
                        String.encode(temp_value, value as string);
                        break;
                    case 2: // no-default-alpn
                        break;
                    case 3: // port
                        temp_value.uint16_t(value as number, true);
                        break;
                    case 4: // ipv4hint
                        temp_value.bytes(Buffer.from((new Address4(value as string)).toArray()));
                        break;
                    case 6: // ipv6hint
                        temp_value.bytes(Buffer.from((new Address6(value as string)).toUnsignedByteArray()));
                        break;
                    case 7: // dohpath
                    case 8: // privatedohtarget
                        temp_value.bytes(Name.compress(
                            value as string, index, writer.length + temp.length + temp_value.length + 2));
                        break;
                    case 5: // ech
                    default:
                        temp_value.bytes(value as Buffer);
                        break;
                }
            }

            temp.uint16_t(temp_value.length, true);

            temp.bytes(temp_value.buffer);
        }

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }
}

export namespace SVCB {
    export type Record = {
        /** Service priority (0 = alias mode, >0 = service mode) */
        priority: number;
        /** Target domain name */
        target: string;
        /** Service parameters as key-value pairs */
        parameters: Parameters;
    }
}
