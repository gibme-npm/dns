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

/**
 * The DNS resource record class identifier
 */
export type RCLASS = 'IN' | 'CH' | 'HS' | 'NONE' | 'ANY';

/**
 * Handles encoding and decoding of DNS resource record classes,
 * including the mDNS flush/QU bit in the high bit of the class field.
 *
 * @internal
 */
export class RClass {
    /** Maps numeric class IDs to their string names */
    public static readonly ID_TO_NAME: Map<number, RCLASS> = new Map<number, RCLASS>([
        [1, 'IN'],
        [3, 'CH'],
        [4, 'HS'],
        [254, 'NONE'],
        [255, 'ANY']
    ]);

    /** Maps string class names to their numeric IDs */
    public static readonly NAME_TO_ID: Map<RCLASS, number> = new Map(
        Array.from(RClass.ID_TO_NAME.entries()).map(([id, name]) => [name, id])
    );

    /** The numeric class identifier */
    public readonly id: number;
    /** The string name of the class (e.g. IN, CH) */
    public readonly name: RCLASS;
    /** The mDNS flush bit (answers) or QU bit (questions) */
    public flushOrQu: boolean;

    /**
     * Constructs a new Resource Record Class
     * @param nameOrId - the class name or numeric ID
     * @param flushOrQu - optional override for the flush/QU bit
     */
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

    /**
     * Returns the class as a 2-byte big-endian Buffer, with flush/QU bit injected
     */
    public get buffer (): Buffer {
        const buffer = Buffer.alloc(2);

        const id = RClass.injectFlushOrQu(this.id, this.flushOrQu);

        buffer.writeUInt16BE(id, 0);

        return buffer;
    }

    /**
     * Decodes a Resource Record Class from the byte stream
     * @param buffer - the byte stream or raw buffer
     */
    public static from (buffer: Reader | Buffer): RClass {
        if (Buffer.isBuffer(buffer)) {
            buffer = new Reader(buffer);
        }

        const klass = buffer.uint16_t(true).toJSNumber();

        return new RClass(klass);
    }

    /**
     * Extracts the flush/QU bit and base class ID from a raw 16-bit class value
     * @param type - the raw 16-bit class field value
     */
    public static parseFlushOrQu (type: number): { qClass: number; flushOrQu: boolean } {
        const flushOrQu = (type & 0x8000) !== 0;

        const qClass = type & 0x7FFF;

        return {
            qClass,
            flushOrQu
        };
    }

    /**
     * Injects the flush/QU bit into a class ID to produce the raw 16-bit value
     * @param type - the base class ID
     * @param flushOrQu - whether to set the high bit
     */
    public static injectFlushOrQu (type: number, flushOrQu: boolean): number {
        return (flushOrQu ? 0x8000 : 0) | (type & 0x7FFF);
    }

    /**
     * Converts a class name to its numeric ID
     * @param name - the class name
     */
    public static nameToId (name: RCLASS): number {
        name = name.toUpperCase() as RCLASS;

        if (RClass.NAME_TO_ID.has(name)) return RClass.NAME_TO_ID.get(name)!;

        if (name.startsWith('UNKNOWN.')) {
            const [, id] = name.split('.');

            return parseInt(id, 10) || 0;
        }

        return 0;
    }

    /**
     * Converts a numeric class ID to its name
     * @param type - the numeric class ID
     */
    public static idToName (type: number): RCLASS {
        return RClass.ID_TO_NAME.get(type) ?? `UNKNOWN.${type}` as RCLASS;
    }

    /**
     * Returns the class name as a string
     */
    public toString (): string {
        return this.name;
    }
}
