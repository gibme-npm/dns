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

import { describe, it } from 'mocha';
import { RTYPE, Question, Response, lookup } from '../src';
import { config } from 'dotenv';
import { Address4, Address6 } from 'ip-address';
import assert from 'assert';

config();

const NAMESERVER = process.env.NAME_SERVER || '8.8.8.8';

describe('Unit Tests', () => {
    const send_question = async (question: Question.Type, server: string, port = 53): Promise<Response> => {
        const [response, error] = await lookup(question, { host: server, port });

        if (error || !response) {
            throw error;
        }

        return response;
    };

    const test_targets = new Map<RTYPE, string>([
        ['A', 'google.com'],
        ['AAAA', 'google.com'],
        ['CNAME', 'www.reuters.com'],
        ['NS', 'google.com'],
        ['MX', 'google.com'],
        ['TXT', 'google.com'],
        ['PTR', '1.1.1.1.in-addr.arpa'],
        ['SOA', 'google.com'],
        ['CAA', 'google.com'],
        ['SRV', '_sip._tcp.jabber.com'],
        ['DS', 'cloudflare.com'],
        ['DNSKEY', 'cloudflare.com'],
        ['NSEC', 'cloudflare.com']
    ]);

    let valid_server = false;

    it(`Checking ${NAMESERVER} for validity`, () => {
        assert.ok(Address4.isValid(NAMESERVER) || Address6.isValid(NAMESERVER));
        valid_server = true;
    });

    for (const [type, target] of test_targets) {
        it(`${type}: ${target}`, async function () {
            if (!valid_server) {
                return this.skip();
            }

            const reply = await send_question({
                type: type as any,
                name: target
            }, NAMESERVER);

            assert.notEqual(reply.answers.length, 0);
            assert.notEqual(reply.answers.filter(answer =>
                answer.type === type && answer.name === target).length, 0);
        });
    }
});
