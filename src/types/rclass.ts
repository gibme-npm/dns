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

import { Reader } from '@gibme/bytepack';

export type RCLASS = 'IN' | 'CH' | 'HS' | 'NONE' | 'ANY';

/**
 * @internal
 */
export class RClass {
    public static readonly ID_TO_NAME: Map<number, RCLASS> = new Map<number, RCLASS>([
        [1, 'IN'],
        [3, 'CH'],
        [4, 'HS'],
        [254, 'NONE'],
        [255, 'ANY']
    ]);

    public static readonly NAME_TO_ID: Map<RCLASS, number> = new Map(
        Array.from(RClass.ID_TO_NAME.entries()).map(([id, name]) => [name, id])
    );

    public readonly id: number;
    public readonly name: RCLASS;
    public flushOrQu: boolean;

    constructor (nameOrId: RCLASS | number, flushOrQu?: boolean) {
        if (typeof nameOrId === 'string') {
            this.name = nameOrId.toUpperCase() as RCLASS;

            const {
                qClass,
                flushOrQu: bit
            } = RClass.parseFlushOrQu(RClass.nameToId(this.name));

            this.id = qClass;

            this.flushOrQu = flushOrQu ?? bit ?? false;
        } else {
            const {
                qClass,
                flushOrQu: bit
            } = RClass.parseFlushOrQu(nameOrId);

            this.name = RClass.idToName(qClass);

            this.id = qClass;

            this.flushOrQu = flushOrQu ?? bit ?? false;
        }
    }

    public get buffer (): Buffer {
        const buffer = Buffer.alloc(2);

        const id = RClass.injectFlushOrQu(this.id, this.flushOrQu);

        buffer.writeUInt16BE(id, 0);

        return buffer;
    }

    public static from (buffer: Reader | Buffer): RClass {
        if (Buffer.isBuffer(buffer)) {
            buffer = new Reader(buffer);
        }

        const klass = buffer.uint16_t(true).toJSNumber();

        return new RClass(klass);
    }

    public static parseFlushOrQu (type: number): { qClass: number; flushOrQu: boolean } {
        const flushOrQu = (type & 0x8000) !== 0;

        const qClass = type & 0x7FFF;

        return {
            qClass,
            flushOrQu
        };
    }

    public static injectFlushOrQu (type: number, flushOrQu: boolean): number {
        return (flushOrQu ? 0x8000 : 0) | (type & 0x7FFF);
    }

    public static nameToId (name: RCLASS): number {
        name = name.toUpperCase() as RCLASS;

        if (RClass.NAME_TO_ID.has(name)) return RClass.NAME_TO_ID.get(name)!;

        if (name.startsWith('UNKNOWN.')) {
            const [, id] = name.split('.');

            return parseInt(id, 10) || 0;
        }

        return 0;
    }

    public static idToName (type: number): RCLASS {
        return RClass.ID_TO_NAME.get(type) ?? `UNKNOWN.${type}` as RCLASS;
    }

    public toString (): string {
        return this.name;
    }
}
