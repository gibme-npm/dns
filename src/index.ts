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

import { Query, Question, Response } from './types';
import { Socket } from 'net';
import { createSocket } from 'dgram';
import { Address4, Address6 } from 'ip-address';
import { Reader, Writer } from '@gibme/bytepack';

export * from './types';

/**
 * Performs a DNS lookup of the supplied Questions.
 *
 * Note: This method automatically switches to a TCP-based query
 * if a UDP-based query receives a response with the truncated
 * bit set.
 *
 * @param questions
 * @param options
 */
export const lookup = async (
    questions: Question.Type | Question.Type[],
    options: Partial<{
        /**
         * The nameserver to perform the lookup against
         */
        host: string;
        /**
         * The port of the nameserver
         */
        port: number;
        /**
         * The timeout in milliseconds (ms) to wait for a reply
         *
         * Note: the timeout is for each of the underlying queries (UDP + TCP)
         */
        timeout: number;
    }> = {}
): Promise<[Response | undefined, Error | undefined]> => {
    options.host ??= '1.1.1.1';
    options.port ??= 53;
    options.timeout ??= 2000;

    const udp_type = Address4.isValid(options.host) ? 'udp4' : Address6.isValid(options.host) ? 'udp6' : undefined;

    if (!udp_type) {
        throw new Error('Host is not a valid IPv4 or IPv6 address');
    }

    /**
     * Sends the query via UDP
     * @param outgoing
     */
    const send_via_udp = async (
        outgoing: Query
    ): Promise<Response | Error> => new Promise(resolve => {
        const socket = createSocket(udp_type);

        const timeout = setTimeout(() => {
            socket.removeAllListeners();
            socket.close();
            return resolve(new Error('Request timed out.'));
        }, options.timeout ?? 2000);

        const cleanup = () => {
            clearTimeout(timeout);
            socket.removeAllListeners();
            socket.close();
        };

        socket.on('error', error => {
            cleanup();
            return resolve(error);
        });

        socket.on('message', buffer => {
            cleanup();

            try {
                const message = new Response(buffer);

                if (message.id === outgoing.id) {
                    return resolve(message);
                }

                return resolve(new Error(
                    `Message received with invalid ID. Expected ${outgoing.id}; Received ${message.id}`));
            } catch {
                return resolve(new Error('Malformed response detected; could not decode.'));
            }
        });

        socket.send(outgoing.buffer, options.port, options.host);
    });

    /**
     * Sends the query via TCP
     * @param outgoing
     */
    const send_via_tcp = async (
        outgoing: Query
    ): Promise<Response | Error> => new Promise(resolve => {
        const reader = new Reader();
        const socket = new Socket();

        const timeout = setTimeout(() => {
            socket.removeAllListeners();
            socket.destroy();
            return resolve(new Error('Request timed out.'));
        }, options.timeout ?? 2000);

        const cleanup = () => {
            clearTimeout(timeout);
            socket.removeAllListeners();
            socket.destroy();
        };

        socket.setTimeout(options.timeout ?? 2000)
            .on('error', error => {
                cleanup();
                return resolve(error);
            }).on('timeout', () => {
                cleanup();
                return resolve(new Error('Request timed out.'));
            }).connect({
                host: options.host,
                port: options.port ?? 53
            }, () => {
                const message = outgoing.buffer;
                const writer = new Writer();
                writer.uint16_t(message.length, true);
                writer.bytes(message);
                socket.write(writer.buffer);
            }).pipe(reader);

        let length = 0;

        const read = () => {
            if (socket.closed) return;

            if (reader.unreadBytes >= 2 && length === 0) {
                length = reader.uint16_t(true).toJSNumber();
            } else if (length !== 0 && reader.unreadBytes >= length) {
                cleanup();

                const buffer = reader.bytes(length);

                try {
                    const message = new Response(buffer);

                    if (message.id === outgoing.id) {
                        return resolve(message);
                    }

                    return resolve(new Error(
                        `Message received with invalid ID. Expected ${outgoing.id}; Received ${message.id}`));
                } catch {
                    return resolve(new Error('Malformed response detected; could not decode.'));
                }
            }

            setTimeout(read, 50);
        };

        read();
    });

    const query = new Query({
        id: Math.floor(Math.random() * 65535),
        questions: Array.isArray(questions) ? questions : [questions]
    });

    let reply: Response | Error = await send_via_udp(query);

    if (reply instanceof Response && reply.truncated) {
        reply = await send_via_tcp(query);
    }

    if (reply instanceof Error) {
        return [undefined, reply];
    }

    return [reply, undefined];
};
