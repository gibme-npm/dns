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

export type ParameterValue = Buffer | string | undefined | number;

type Parameters = Record<number, ParameterValue[]>;

export class SVCB {
    public static readonly type: number = 64;

    public static decode (reader: Reader): SVCB.Record {
        let length = reader.uint16_t(true).toJSNumber();

        const priority = reader.uint16_t(true).toJSNumber();
        length -= 2;

        const start = reader.offset;
        const target = Name.decode(reader);
        length -= reader.offset - start;

        const parameters_end = reader.offset + length;

        const parameters: Parameters = {};

        while (reader.offset < parameters_end) {
            const key = reader.uint16_t(true).toJSNumber();

            let parameters_length = reader.uint16_t(true).toJSNumber();

            parameters[key] ??= [];

            while (parameters_length > 0) {
                const start = reader.offset;

                switch (key) {
                    case 1: // alpn
                        parameters[key].push(String.decode(reader));
                        break;
                    case 2: // no-default-alpn
                        parameters[key].push(undefined);
                        break;
                    case 3: // port
                        parameters[key].push(reader.uint16_t(true).toJSNumber());
                        break;
                    case 4: // ipv4hint
                        parameters[key].push(Address4.fromHex(reader.bytes(4).toString('hex')).address);
                        break;
                    case 6: // ipv6hint
                        parameters[key].push(Address6.fromUnsignedByteArray([...reader.bytes(16)]).address);
                        break;
                    case 7: // dohpath
                    case 8: // privatedohtarget
                        parameters[key].push(Name.decode(reader));
                        break;
                    case 5: // ech
                    default:
                        parameters[key].push(reader.bytes(parameters_length));
                        break;
                }

                parameters_length -= reader.offset - start;
            }
        }

        return {
            priority,
            target,
            parameters
        };
    }

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
        priority: number;
        target: string;
        parameters: Parameters;
    }
}
