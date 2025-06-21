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

import { RTYPE, RType } from './rtype';
import { RCLASS, RClass } from './rclass';
import { Reader, Writer } from '@gibme/bytepack';
import { Name } from '../encoders';

export class Question {
    public name: string;
    public class: RCLASS;
    public type: RTYPE;
    public qu: boolean;

    /**
     * Constructs a new instance of a question
     * @param name
     * @param type
     * @param klass
     * @param qu
     */
    public constructor (
        name: string,
        type: RType | RTYPE | number,
        klass: RClass | RCLASS | number,
        qu: boolean
    ) {
        this.name = name;

        let _qu: boolean;

        if (typeof klass === 'number' || typeof klass === 'string') {
            const temp = new RClass(klass);

            this.class = temp.name;

            _qu = temp.flushOrQu;
        } else {
            this.class = klass.name;

            _qu = klass.flushOrQu;
        }

        if (typeof type === 'number' || typeof type === 'string') {
            const temp = new RType(type);

            this.type = temp.name;
        } else {
            this.type = type.name;
        }

        this.qu = qu ?? _qu ?? false;
    }

    /**
     * Decodes a question from the supplied byte stream
     * @param buffer
     */
    public static from (buffer: Buffer | Reader): Question {
        if (Buffer.isBuffer(buffer)) {
            buffer = new Reader(buffer);
        }

        const name = Name.decode(buffer);

        const type = RType.from(buffer);

        const klass = RClass.from(buffer);

        const { flushOrQu: qu } = klass;

        return new Question(name, type, klass, qu);
    }

    /**
     * Encodes the question into the Writer instance
     * @param writer
     * @param index
     */
    public encode (writer: Writer, index: Name.CompressionIndex): void {
        Name.encode(writer, this.name, index);

        const { id } = new RType(this.type as RTYPE);

        writer.uint16_t(id, true);

        const { buffer: klass } = new RClass(this.class as RCLASS, this.qu);

        writer.bytes(klass);
    }
}

export namespace Question {
    export type Object = {
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
         * For multicast questions, whether the response should be sent back via unicast
         */
        qu?: boolean;
    }

    export type Type = Question | Object;
}
