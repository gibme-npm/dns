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
import { Address4, Address6 } from 'ip-address';
import { Name } from '../';

export class AMTRELAY {
    public static readonly type: number = 260;

    public static decode (reader: Reader): AMTRELAY.Record {
        const length = reader.uint16_t(true).toJSNumber();

        const temp = new Reader(reader.bytes(length));

        const precedence = temp.uint8_t().toJSNumber();

        const flags = temp.uint8_t().toJSNumber();

        const discoveryOptional = (flags & 0x80) !== 0;

        const type = flags & 0x7F;

        const relay = AMTRELAY.decode_relay(temp, type);

        return {
            precedence,
            discoveryOptional,
            relay
        };
    }

    public static encode (writer: Writer, data: AMTRELAY.Record, index: Name.CompressionIndex): void {
        const temp = new Writer();

        temp.uint8_t(data.precedence ?? 0);

        const [relayType, relayValue] = AMTRELAY.determine_relay_type(data.relay);

        const flags = (data.discoveryOptional ? 0x80 : 0x00) | (relayType & 0x7F);

        temp.uint8_t(flags);

        const relayBuffer = AMTRELAY.encode_relay(
            relayType,
            relayValue,
            index,
            writer.length + temp.length + 2
        );

        temp.bytes(relayBuffer);

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }

    protected static decode_relay (reader: Reader, type: number): string {
        switch (type) {
            case 0:
                return Address4.fromHex(reader.bytes(4).toString('hex')).address;
            case 1:
                return Address6.fromUnsignedByteArray([...reader.bytes(16)]).address;
            case 2:
                return Name.decode(reader);
            default:
                throw new Error('Unsupported relay type');
        }
    }

    protected static determine_relay_type (relay?: string): [number, string] {
        if (!relay) {
            return [-1, ''];
        }

        if (Address4.isValid(relay)) {
            return [0, relay];
        } else if (Address6.isValid(relay)) {
            return [1, relay];
        }

        return [2, relay];
    }

    protected static encode_relay (
        relayType: number,
        relayValue: string,
        index: Name.CompressionIndex,
        positionOffset: number
    ): Buffer {
        switch (relayType) {
            case 0:
                return Buffer.from((new Address4(relayValue)).toArray());
            case 1:
                return Buffer.from((new Address6(relayValue)).toUnsignedByteArray());
            case 2:
                return Name.compress(relayValue, index, positionOffset);
            default:
                throw new Error('Unsupported relay type');
        }
    }
}

export namespace AMTRELAY {
    export type Record = {
        precedence: number;
        discoveryOptional: boolean;
        relay: string;
    };
}
