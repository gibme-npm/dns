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
import { ValidationErrors } from '../constants/validation';

/**
 * Validates that a Reader has sufficient bytes remaining
 * @param reader The Reader to validate
 * @param requiredBytes Number of bytes required
 * @param context Descriptive context for error messages
 * @throws Error if insufficient bytes available
 */
export const validateBufferLength = (reader: Reader, requiredBytes: number, context: string): void => {
    const available = reader.unreadBytes;

    if (available < requiredBytes) {
        throw new Error(ValidationErrors.INSUFFICIENT_BUFFER(context, requiredBytes, available));
    }
};

/**
 * Validates that a length value is non-negative
 * @param length The length value to validate
 * @param context Descriptive context for error messages
 * @throws Error if length is negative
 */
export const validateNonNegativeLength = (length: number, context: string): void => {
    if (length < 0) {
        throw new Error(ValidationErrors.NEGATIVE_LENGTH(context, length));
    }
};

/**
 * Validates a DNS name compression pointer offset
 * @param offset The pointer offset to validate
 * @param bufferStart Starting offset of the buffer
 * @param currentOffset Current read position
 * @param bufferSize Total buffer size
 * @param context Descriptive context for error messages
 * @throws Error if pointer is invalid
 */
export const validatePointerOffset = (
    offset: number,
    bufferStart: number,
    currentOffset: number,
    bufferSize: number,
    context: string
): void => {
    // Pointer must point within buffer bounds
    if (offset < bufferStart || offset >= bufferSize) {
        throw new Error(ValidationErrors.INVALID_POINTER(context, offset, bufferSize));
    }

    // Pointer must point backward to prevent infinite loops
    if (offset >= currentOffset) {
        throw new Error(ValidationErrors.FORWARD_POINTER(context, offset, currentOffset));
    }
};

/**
 * Calculates the actual UTF-8 byte length of a string
 * This is critical because JavaScript's .length returns character count, not byte count
 * @param str The string to measure
 * @returns The number of bytes when encoded as UTF-8
 */
export const getUtf8ByteLength = (str: string): number => {
    return Buffer.byteLength(str, 'utf8');
};

/**
 * Validates that a value is within a specified range
 * @param value The value to validate
 * @param min Minimum allowed value (inclusive)
 * @param max Maximum allowed value (inclusive)
 * @param context Descriptive context for error messages
 * @throws Error if value is out of range
 */
export const validateRange = (value: number, min: number, max: number, context: string): void => {
    if (value < min || value > max) {
        throw new Error(`${context}: value ${value} out of range (must be ${min}-${max})`);
    }
};

/**
 * Creates a bounded Reader from a subset of another Reader's data
 * This prevents reading beyond the specified length
 * @param reader The source Reader
 * @param length Number of bytes to read
 * @param context Descriptive context for error messages
 * @returns A new Reader containing exactly 'length' bytes
 * @throws Error if insufficient bytes available
 */
export const createBoundedReader = (reader: Reader, length: number, context: string): Reader => {
    validateNonNegativeLength(length, context);
    validateBufferLength(reader, length, context);
    return new Reader(reader.bytes(length));
};
