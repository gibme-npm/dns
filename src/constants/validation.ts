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
 * DNS protocol validation limits and security constants
 */

/**
 * Maximum length of a DNS name (including length octets)
 * RFC 1035 Section 2.3.4
 */
export const DNS_MAX_NAME_LENGTH = 255;

/**
 * Maximum length of a single DNS label
 * RFC 1035 Section 2.3.1
 */
export const DNS_MAX_LABEL_LENGTH = 63;

/**
 * Maximum depth of name compression pointers to prevent compression bombs
 * This prevents malicious packets from causing excessive memory/CPU usage
 */
export const DNS_MAX_POINTER_DEPTH = 16;

/**
 * Maximum number of records in each packet section to prevent DoS attacks
 * This prevents packets claiming 65535 records from exhausting memory
 */
export const DNS_MAX_SECTION_COUNT = 100;

/**
 * Maximum length of a DNS message over TCP
 * RFC 1035 Section 4.2.2
 */
export const DNS_MAX_TCP_MESSAGE_LENGTH = 65535;

/**
 * Maximum length of RDATA field
 * Limited by 16-bit length field in resource records
 */
export const DNS_MAX_RDATA_LENGTH = 65535;

/**
 * Maximum length of a character string
 * RFC 1035 Section 3.3
 */
export const DNS_MAX_STRING_LENGTH = 255;

/**
 * Minimum DNS packet size (header only)
 */
export const DNS_MIN_PACKET_SIZE = 12;

/**
 * Maximum window number in type bitmap
 * RFC 4034 Section 4.1.2
 */
export const DNS_MAX_TYPE_BITMAP_WINDOW = 256;

/**
 * Minimum type bitmap window length
 */
export const DNS_MIN_TYPE_BITMAP_LENGTH = 1;

/**
 * Maximum type bitmap window length
 */
export const DNS_MAX_TYPE_BITMAP_LENGTH = 32;

/**
 * Error messages for validation failures
 */
export const ValidationErrors = {
    INSUFFICIENT_BUFFER: (context: string, required: number, available: number) =>
        `${context}: insufficient buffer (need ${required} bytes, have ${available})`,
    NEGATIVE_LENGTH: (context: string, value: number) =>
        `${context}: negative length not allowed (got ${value})`,
    INVALID_POINTER: (context: string, offset: number, bufferSize: number) =>
        `${context}: invalid compression pointer offset ${offset} (buffer size: ${bufferSize})`,
    FORWARD_POINTER: (context: string, offset: number, current: number) =>
        `${context}: compression pointer points forward (offset ${offset} >= current ${current})`,
    POINTER_DEPTH_EXCEEDED: (depth: number) =>
        `Name compression depth exceeded (max ${DNS_MAX_POINTER_DEPTH}, got ${depth})`,
    NAME_TOO_LONG: (length: number) =>
        `DNS name exceeds maximum length (max ${DNS_MAX_NAME_LENGTH} bytes, got ${length})`,
    LABEL_TOO_LONG: (length: number) =>
        `DNS label exceeds maximum length (max ${DNS_MAX_LABEL_LENGTH} bytes, got ${length})`,
    SECTION_COUNT_EXCEEDED: (section: string, count: number) =>
        `${section} count exceeds limit (max ${DNS_MAX_SECTION_COUNT}, got ${count})`,
    TCP_MESSAGE_TOO_LONG: (length: number) =>
        `TCP message exceeds maximum length (max ${DNS_MAX_TCP_MESSAGE_LENGTH}, got ${length})`,
    STRING_TOO_LONG: (length: number) =>
        `String exceeds maximum length (max ${DNS_MAX_STRING_LENGTH} bytes, got ${length})`,
    RDATA_TOO_LONG: (length: number) =>
        `RDATA exceeds maximum length (max ${DNS_MAX_RDATA_LENGTH}, got ${length})`,
    INVALID_TYPE_BITMAP_WINDOW: (window: number) =>
        `Type bitmap window number out of range (max ${DNS_MAX_TYPE_BITMAP_WINDOW}, got ${window})`,
    INVALID_TYPE_BITMAP_LENGTH: (length: number) =>
        'Type bitmap length out of range ' +
        `(must be ${DNS_MIN_TYPE_BITMAP_LENGTH}-${DNS_MAX_TYPE_BITMAP_LENGTH}, got ${length})`,
    ZERO_BYTE_CONSUMPTION: (context: string) =>
        `${context}: loop consumed zero bytes (potential infinite loop)`,
    PACKET_TOO_SMALL: (size: number) =>
        `Packet too small (min ${DNS_MIN_PACKET_SIZE} bytes, got ${size})`
};
