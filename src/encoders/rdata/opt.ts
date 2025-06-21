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

export class OPT {
    public static readonly type: number = 41;

    public static decode (reader: Reader): OPT.Record {
        const udpPayloadSize = reader.uint16_t(true).toJSNumber();

        const rcode = reader.uint8_t().toJSNumber();

        const eDnsVersion = reader.uint8_t().toJSNumber();

        const flags = reader.uint16_t(true).toJSNumber();

        const flag_do = ((flags >> 15) & 0x1) === 1;

        const length = reader.uint16_t(true).toJSNumber();

        const options = new Map<number, Buffer>();

        const temp = new Reader(reader.bytes(length));

        while (temp.unreadBytes > 0) {
            const code = temp.uint16_t(true).toJSNumber();

            const length = temp.uint16_t(true).toJSNumber();

            options.set(code, temp.bytes(length));
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
    export type Record = {
        udpPayloadSize: number;
        rcode: number;
        eDnsVersion: number;
        flags: number;
        do: boolean;
        options: Map<number, Buffer>; // TODO: I'd like to handle these better than this
    }
}
