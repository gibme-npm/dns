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
import { Name } from '../encoders';
import { Question } from './question';
import { Answer } from './answer';
import { OpCode } from './opcode';
import { RCode } from './rcode';

/**
 * Represents the packet type
 */
export enum PacketType {
    Query = 0,
    Response = 1
}

export class Packet {
    /**
     * A 16-bit identifier assigned by the program that generates any kind of query. This
     * identifier is copied to the corresponding reply and can be used by the requester
     * to match up replies to outstanding queries.
     */
    public id = 0;
    /**
     * A one-bit field that specifies whether this message is a query (0) or a response (1).
     */
    public type: PacketType = PacketType.Query;
    /**
     * A four-bit field that specifies the kind of query in this message. This value is set
     * by the originator of a query and copied into the response.
     */
    public opcode: OpCode = OpCode.Query;
    /**
     * Authoritative Answer - this bit is valid in responses and specifies that the
     * responding name server is an authority for the domain in a question section.
     *
     * Note that the contents of the answer section may have multiple owner names
     * because of aliases. The `AA` bit corresponds to the name which matches the
     * query name, or the first owner name in the answer section.
     */
    public authoritative_answer = false;
    /**
     * Truncated - specifies that this message was truncated due to a length greater than
     * that permitted on the transmission channel.
     */
    public truncated = false;
    /**
     * Recursion Desired - this bit may be set in a query and is copied into the response.
     * If `RD` is set, it directs the name server to pursue the query recursively. Recursive
     * query support is optional.
     */
    public recursion_desired = false;
    /**
     * Recursion Available - this bit is set or cleared in a response and denotes whether
     * recursive query support is available in the name server.
     */
    public recursion_available = false;
    /**
     * Reserved for future use. Must be zero in all queries and responses.
     */
    public z = false;
    /**
     * Authentic Data - this one-bit field indicates whether the data in the response
     * has been authenticated by the name server that provided the response.
     */
    public authentic_data = false;
    /**
     * Checking Disabled - this one-bit field tells the upstream resolvers to skip
     * DNSSEC validation and return the data as-is, regardless of whether the signature
     * validates.
     */
    public checking_disabled = false;
    /**
     * Response Code - this 4-bit field is set as part of responses.
     */
    public rcode: RCode = RCode.NoError;
    /**
     * The list of questions contained within the message
     */
    public questions: Question.Type[] = [];
    /**
     * The list of resource records contained within the message
     */
    public answers: Answer.Type[] = [];
    /**
     * The list of server resource records within the message
     */
    public authorities: Answer.Type[] = [];
    /**
     * The list of additional resource records contained within the message
     */
    public additionals: Answer.Type[] = [];

    /**
     * Constructs a new DNS packet
     * @param bufferOrParams
     */
    constructor (bufferOrParams?: Buffer | Partial<Packet.Object>) {
        if (Buffer.isBuffer(bufferOrParams)) {
            const reader = new Reader(bufferOrParams);

            if (reader.unreadBytes < 12) {
                throw new Error(`Not enough bytes to decode header: ${reader.unreadBytes} < 12`);
            }

            this.id = reader.uint16_t(true).toJSNumber();

            const flags = reader.uint16_t(true).toJSNumber();

            this.type = (flags & 0x8000) !== 0 ? 1 : 0;

            this.opcode = (flags >> 11) & 0xf;

            this.authoritative_answer = ((flags >> 10) & 0x1) === 1;

            this.truncated = ((flags >> 9) & 0x1) === 1;

            this.recursion_desired = ((flags >> 8) & 0x1) === 1;

            this.recursion_available = ((flags >> 7) & 0x1) === 1;

            this.z = ((flags >> 6) & 0x1) === 1;

            this.authentic_data = ((flags >> 5) & 0x1) === 1;

            this.checking_disabled = ((flags >> 4) & 0x1) === 1;

            this.rcode = flags & 0xf;

            const QDCOUNT = reader.uint16_t(true).toJSNumber();

            const ANCOUNT = reader.uint16_t(true).toJSNumber();

            const NSCOUNT = reader.uint16_t(true).toJSNumber();

            const ARCOUNT = reader.uint16_t(true).toJSNumber();

            for (let i = 0; i < QDCOUNT; i++) {
                this.questions.push(Question.from(reader));
            }

            for (let i = 0; i < ANCOUNT; i++) {
                this.answers.push(Answer.from(reader));
            }

            for (let i = 0; i < NSCOUNT; i++) {
                this.authorities.push(Answer.from(reader));
            }

            for (let i = 0; i < ARCOUNT; i++) {
                this.additionals.push(Answer.from(reader));
            }
        } else if (bufferOrParams) {
            this.load(bufferOrParams);
        }
    }

    /**
     * Returns the packet as a buffer
     */
    public get buffer (): Buffer {
        const writer = new Writer();

        this.z = false;

        let flags = this.type === PacketType.Response ? 0x8000 : 0x0;

        flags |= (this.opcode & 0xf) << 11;

        if (this.authoritative_answer) flags |= 1 << 10;

        if (this.truncated) flags |= 1 << 9;

        if (this.recursion_desired) flags |= 1 << 8;

        if (this.recursion_available) flags |= 1 << 7;

        if (this.z) flags |= 1 << 6;

        if (this.authentic_data) flags |= 1 << 5;

        if (this.checking_disabled) flags |= 1 << 4;

        flags |= this.rcode & 0xf;

        writer.uint16_t(this.id, true);

        writer.uint16_t(flags, true);

        writer.uint16_t(this.questions.length, true);

        writer.uint16_t(this.answers.length, true);

        writer.uint16_t(this.authorities.length, true);

        writer.uint16_t(this.additionals.length, true);

        const index = Name.newCompressionIndex();

        const question_encoder = (question: Question.Type) => {
            if (question instanceof Question) {
                return question.encode(writer, index);
            }

            const {
                name,
                class: klass,
                type,
                qu
            } = question;

            return (new Question(name, type, klass ?? 'IN', qu ?? false)).encode(writer, index);
        };

        const answer_encoder = (answer: Answer.Type) => {
            if (answer instanceof Answer) {
                return answer.encode(writer, index);
            }

            const {
                name,
                class: klass,
                type,
                ttl,
                data,
                flush
            } = answer;

            return (new Answer(name, type, klass ?? 'IN', ttl, data, flush ?? false)).encode(writer, index);
        };

        this.questions.forEach(question_encoder);

        this.answers.forEach(answer_encoder);

        this.authorities.forEach(answer_encoder);

        this.additionals.forEach(answer_encoder);

        return writer.buffer;
    }

    /**
     * Loads the packet from the full list of available properties
     * @param params
     * @protected
     */
    protected load (params: Partial<Packet.Object> = {}) {
        const {
            id,
            type,
            opcode,
            authoritative_answer,
            truncated,
            recursion_desired,
            recursion_available,
            z,
            authentic_data,
            checking_disabled,
            rcode,
            questions,
            answers,
            authorities,
            additionals
        } = params;

        this.id = id ?? 0;
        this.type = type ?? PacketType.Query;
        this.opcode = opcode ?? OpCode.Query;
        this.authoritative_answer = authoritative_answer ?? false;
        this.truncated = truncated ?? false;
        this.recursion_desired = recursion_desired ?? false;
        this.recursion_available = recursion_available ?? false;
        this.z = z ?? false;
        this.authentic_data = authentic_data ?? false;
        this.checking_disabled = checking_disabled ?? false;
        this.rcode = rcode ?? RCode.NoError;
        this.questions = questions ?? [];
        this.answers = answers ?? [];
        this.authorities = authorities ?? [];
        this.additionals = additionals ?? [];
    }
}

export namespace Packet {
    export type Object = {
        /**
         * A 16-bit identifier assigned by the program that generates any kind of query. This
         * identifier is copied to the corresponding reply and can be used by the requester
         * to match up replies to outstanding queries.
         */
        id: number;
        /**
         * A one-bit field that specifies whether this message is a query (0) or a response (1).
         */
        type: PacketType;
        /**
         * A four-bit field that specifies the kind of query in this message. This value is set
         * by the originator of a query and copied into the response.
         */
        opcode: OpCode;
        /**
         * Authoritative Answer - this bit is valid in responses and specifies that the
         * responding name server is an authority for the domain in a question section.
         *
         * Note that the contents of the answer section may have multiple owner names
         * because of aliases. The `AA` bit corresponds to the name which matches the
         * query name, or the first owner name in the answer section.
         */
        authoritative_answer: boolean;
        /**
         * Truncation - specifies that this message was truncated due to a length greater than
         * that permitted on the transmission channel.
         */
        truncated: boolean;
        /**
         * Recursion Desired - this bit may be set in a query and is copied into the response.
         * If `RD` is set, it directs the name server to pursue the query recursively. Recursive
         * query support is optional.
         */
        recursion_desired: boolean;
        /**
         * Recursion Available - this bit is set or cleared in a response and denotes whether
         * recursive query support is available in the name server.
         */
        recursion_available: boolean;
        /**
         * Reserved for future use. Must be zero in all queries and responses.
         */
        z: boolean;
        /**
         * Authentic Data - this one-bit field indicates whether the data in the response
         * has been authenticated by the name server that provided the response.
         */
        authentic_data: boolean;
        /**
         * Checking Disabled - this one-bit field tells the upstream resolvers to skip
         * DNSSEC validation and return the data as-is, regardless of whether the signature
         * validates.
         */
        checking_disabled: boolean;
        /**
         * Response Code - this 4-bit field is set as part of responses.
         */
        rcode: RCode;
        /**
         * The list of questions contained within the message
         */
        questions: Question.Type[];
        /**
         * The list of resource records contained within the message
         */
        answers: Answer.Type[];
        /**
         * The list of server resource records within the message
         */
        authorities: Answer.Type[];
        /**
         * The list of additional resource records contained within the message
         */
        additionals: Answer.Type[];
    }

    export type Type = Packet | Object;
}
