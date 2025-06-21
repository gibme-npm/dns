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

export class HIP {
    public static readonly type: number = 55;

    public static decode (reader: Reader): HIP.Record {
        let length = reader.uint16_t(true).toJSNumber();

        const hit_length = reader.uint8_t().toJSNumber();
        length -= 1;

        const publicKeyAlgorithm = reader.uint8_t().toJSNumber();
        length -= 1;

        const public_key_length = reader.uint16_t(true).toJSNumber();
        length -= 2;

        const hit = reader.bytes(hit_length);
        length -= hit_length;

        const publicKey = reader.bytes(public_key_length);
        length -= public_key_length;

        const rendezvousServers: string[] = [];

        while (length > 0) {
            const before = reader.unreadBytes;

            rendezvousServers.push(Name.decode(reader));

            const after = reader.unreadBytes;

            length -= (before - after);
        }

        return {
            publicKeyAlgorithm,
            publicKey,
            hit,
            rendezvousServers
        };
    }

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
        publicKeyAlgorithm: number;
        publicKey: Buffer;
        hit: Buffer;
        rendezvousServers: string[];
    }
}
