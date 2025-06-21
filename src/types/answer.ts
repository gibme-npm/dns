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
import { RCLASS, RClass } from './rclass';
import { RTYPE, RType } from './rtype';
import { Name, RDATA } from '../encoders';

export { Name };

export class Answer<DataType = any> {
    /**
     * Contains the list of RTypes that we should never have in an answer
     */
    public static readonly INVALID_RTYPES: Set<string> = new Set(['ANY', 'IXFR', 'AXFR']);

    public name: string;
    public class: RCLASS;
    public type: RTYPE;
    public ttl: number;
    public data: DataType;
    public flush: boolean;

    /**
     * Constructs a new instance of an Answer
     * @param name
     * @param type
     * @param klass
     * @param ttl
     * @param data
     * @param flush
     */
    public constructor (
        name: string,
        type: RType | RTYPE | number,
        klass: RClass | RCLASS | number,
        ttl: number,
        data: DataType,
        flush: boolean = false
    ) {
        this.name = name;

        let _flush: boolean;

        if (typeof klass === 'number' || typeof klass === 'string') {
            const temp = new RClass(klass);

            this.class = temp.name;

            _flush = temp.flushOrQu;
        } else {
            this.class = klass.name;

            _flush = klass.flushOrQu;
        }

        if (typeof type === 'number' || typeof type === 'string') {
            const temp = new RType(type);

            this.type = temp.name;
        } else {
            this.type = type.name;
        }

        if (Answer.INVALID_RTYPES.has(this.type)) {
            throw new Error(`Invalid RTYPE for Answer: ${this.type}`);
        }

        this.ttl = ttl;

        this.data = data;

        this.flush = flush ?? _flush ?? false;
    }

    /**
     * Decodes an Answer from the supplied byte stream
     * @param buffer
     */
    public static from (buffer: Buffer | Reader): Answer {
        if (Buffer.isBuffer(buffer)) {
            buffer = new Reader(buffer);
        }

        const name = Name.decode(buffer);

        const type = RType.from(buffer);

        const klass = type.id !== 41 ? RClass.from(buffer) : new RClass(0);

        const ttl = type.id !== 41 ? buffer.uint32_t(true).toJSNumber() : 0;

        const rrdata = RDATA.decode(type.id, buffer);

        const { flushOrQu: flush } = klass;

        return new Answer(name, type, klass, ttl, rrdata, flush);
    }

    /**
     * Encodes the Answer into the Writer instance
     * @param writer
     * @param index
     */
    public encode (writer: Writer, index: Name.CompressionIndex): void {
        if (Answer.INVALID_RTYPES.has(this.type)) {
            throw new Error(`Invalid RTYPE: ${this.type}`);
        }

        Name.encode(writer, this.name, index);

        const { id } = new RType(this.type);

        writer.uint16_t(id, true);

        if (id !== 41) {
            const { buffer: klass } = new RClass(this.class, this.flush);

            writer.bytes(klass);

            writer.uint32_t(this.ttl, true);
        }

        RDATA.encode(id, this.data, writer, index);
    }
}

export namespace Answer {
    export type Object<DataType = any> = {
        /**
         * The name of the resource
         */
        name: string;
        /**
         * The resource record type
         */
        type: RTYPE;
        /**
         * The resource record class
         * @default `IN`
         */
        class?: RCLASS;
        /**
         * The TTL of the resource record
         */
        ttl: number;
        /**
         * The resource record data
         */
        data: DataType;
        /**
         * For multicast answers, whether outdated cache records should be purged
         */
        flush?: boolean;
    }

    export type Type<DataType = any> = Answer<DataType> | Object<DataType>;
}
