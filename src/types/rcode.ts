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

/**
 * Defines DNS packet response code
 */
export enum RCode {
    /** No error condition (RFC 1035) */
    NoError = 0,
    /** Format error: the server was unable to interpret the query (RFC 1035) */
    FormErr = 1,
    /** Server failure: the server encountered an internal error (RFC 1035) */
    ServFail = 2,
    /** Non-existent domain: the queried name does not exist (RFC 1035) */
    NXDomain = 3,
    /** Not implemented: the server does not support the requested operation (RFC 1035) */
    NotImp = 4,
    /** Query refused by policy (RFC 1035) */
    Refused = 5,
    /** Name exists when it should not (RFC 2136) */
    YXDomain = 6,
    /** RR set exists when it should not (RFC 2136) */
    YXRRSet = 7,
    /** RR set that should exist does not (RFC 2136) */
    NXRRSet = 8,
    /** Server not authoritative for zone, or not authorized (RFC 2136/RFC 8945) */
    NotAuth = 9,
    /** Name not contained in zone (RFC 2136) */
    NotZone = 10,
    /** DSO-TYPE not implemented (RFC 8490) */
    DSOType = 11,
    /** TSIG signature failure or bad OPT version (RFC 8945/RFC 6891) */
    BadSigOrBadVers = 16,
    /** Key not recognized (RFC 8945) */
    BadKey = 17,
    /** Signature out of time window (RFC 8945) */
    BadTime = 18,
    /** Bad TKEY mode (RFC 2930) */
    BadMode = 19,
    /** Duplicate key name (RFC 2930) */
    BadName = 20,
    /** Algorithm not supported (RFC 2930) */
    BadAlg = 21,
    /** Bad truncation (RFC 8945) */
    BadTrunc = 22,
    /** Bad/missing server cookie (RFC 7873) */
    BadCookie = 23
}
