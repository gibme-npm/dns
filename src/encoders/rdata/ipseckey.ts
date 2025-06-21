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
import { Address4, Address6 } from 'ip-address';

export class IPSECKEY {
    public static readonly type: number = 45;

    public static decode (reader: Reader): IPSECKEY.Record {
        let length = reader.uint16_t(true).toJSNumber();

        const precedence = reader.uint8_t().toJSNumber();
        length -= 1;

        const gatewayType = reader.uint8_t().toJSNumber();
        length -= 1;

        const algorithm = reader.uint8_t().toJSNumber();
        length -= 1;

        const [gateway, gatewayLength] = IPSECKEY.decode_gateway(reader, gatewayType);
        length -= gatewayLength;

        const publicKey = reader.bytes(length);

        return {
            precedence,
            algorithm,
            gateway,
            publicKey
        };
    }

    public static encode (
        writer: Writer,
        data: Omit<IPSECKEY.Record, 'gatewayType'>,
        index: Name.CompressionIndex
    ): void {
        const temp = new Writer();

        temp.uint8_t(data.precedence ?? 0);

        const [gatewayType, gatewayValue] = IPSECKEY.determine_gateway_type(data.gateway);

        temp.uint8_t(gatewayType);

        temp.uint8_t(data.algorithm ?? 0);

        const gatewayBuffer = IPSECKEY.encode_gateway(
            gatewayType,
            gatewayValue,
            index,
            writer.length + temp.length + 2
        );

        temp.bytes(gatewayBuffer);

        temp.bytes(data.publicKey ?? Buffer.alloc(0));

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }

    protected static decode_gateway (
        reader: Reader,
        gatewayType: number
    ): [string | undefined, number] {
        switch (gatewayType) {
            case 0:
                return [undefined, 0];
            case 1:
                return [Address4.fromHex(reader.bytes(4).toString('hex')).address, 4];
            case 2:
                return [Address6.fromUnsignedByteArray([...reader.bytes(16)]).address, 16];
            case 3: {
                const before = reader.unreadBytes;

                const gateway = Name.decode(reader);

                const after = reader.unreadBytes;

                return [gateway, (before - after)];
            }
            default:
                throw new Error('Invalid gateway type');
        }
    }

    protected static determine_gateway_type (gateway?: string): [number, string] {
        if (!gateway) {
            return [0, ''];
        }

        if (Address4.isValid(gateway)) {
            return [1, gateway];
        } else if (Address6.isValid(gateway)) {
            return [2, gateway];
        }

        return [3, gateway];
    }

    protected static encode_gateway (
        gatewayType: number,
        gatewayValue: string,
        index: Name.CompressionIndex,
        positionOffset: number
    ): Buffer {
        switch (gatewayType) {
            case 0:
                return Buffer.alloc(0);
            case 1:
                return Buffer.from((new Address4(gatewayValue)).toArray());
            case 2:
                return Buffer.from((new Address6(gatewayValue)).toUnsignedByteArray());
            case 3:
                return Name.compress(gatewayValue, index, positionOffset);
            default:
                throw new Error('Invalid gateway type');
        }
    }
}

export namespace IPSECKEY {
    export type Record = {
        precedence: number;
        algorithm: number;
        gateway?: string;
        publicKey: Buffer;
    }
}
