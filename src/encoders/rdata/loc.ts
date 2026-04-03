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
import { validateBufferLength, createBoundedReader } from '../../utils/validation';

/**
 * Encoder for DNS LOC (Location) resource records (Type 29).
 *
 * Expresses geographic location information for a domain name.
 *
 * @see RFC 1876
 */
export class LOC {
    /** IANA resource record type identifier */
    public static readonly type: number = 29;

    /**
     * Decodes a LOC record from the byte stream.
     *
     * @param reader - the byte stream reader
     * @returns the decoded LOC record
     */
    public static decode (reader: Reader): LOC.Record {
        // Validate and read RDATA length
        validateBufferLength(reader, 2, 'LOC RDATA length');
        const rdataLength = reader.uint16_t(true).toJSNumber();

        // Create bounded reader for RDATA payload
        const rdataReader = createBoundedReader(reader, rdataLength, 'LOC RDATA payload');

        const version = rdataReader.uint8_t().toJSNumber();

        const size = rdataReader.uint8_t().toJSNumber();

        const horizontalPrecision = rdataReader.uint8_t().toJSNumber();

        const verticalPrecision = rdataReader.uint8_t().toJSNumber();

        const latitude = rdataReader.uint32_t().toJSNumber();

        const longitude = rdataReader.uint32_t().toJSNumber();

        const altitude = rdataReader.uint32_t().toJSNumber();

        return {
            version,
            size: LOC.decode_precision(size),
            horizontalPrecision: LOC.decode_precision(horizontalPrecision),
            verticalPrecision: LOC.decode_precision(verticalPrecision),
            latitude: LOC.decode_latitude(latitude),
            longitude: LOC.decode_longitude(longitude),
            altitude: LOC.decode_altitude(altitude)
        };
    }

    /**
     * Encodes a LOC record into the byte stream.
     *
     * @param writer - the byte stream writer
     * @param data - the LOC record to encode
     */
    public static encode (writer: Writer, data: LOC.Record): void {
        const temp = new Writer();

        temp.uint8_t(data.version ?? 0);

        temp.uint8_t(LOC.encode_precision(data.size ?? 0));

        temp.uint8_t(LOC.encode_precision(data.horizontalPrecision ?? 0));

        temp.uint8_t(LOC.encode_precision(data.verticalPrecision ?? 0));

        temp.uint32_t(LOC.encode_latitude(data.latitude ?? 0));

        temp.uint32_t(LOC.encode_longitude(data.longitude ?? 0));

        temp.uint32_t(LOC.encode_altitude(data.altitude ?? 0));

        writer.uint16_t(temp.length, true);

        writer.bytes(temp.buffer);
    }

    protected static encode_latitude (latitude: number): number {
        latitude = Math.max(-90, Math.min(90, latitude));

        const seconds = (latitude * 3600) + (90 * 3600);

        return Math.round((seconds * 2147483648) / (180 * 3600));
    }

    protected static encode_longitude (longitude: number): number {
        longitude = Math.max(-180, Math.min(180, longitude));

        const seconds = (longitude * 3600) + (180 * 3600);

        return Math.round((seconds * 2147483648) / (360 * 3600));
    }

    protected static encode_altitude (altitude: number): number {
        return Math.round((altitude + 100000) * 100);
    }

    protected static encode_precision (precisionInMeters: number): number {
        const precisionInCm = Math.round(precisionInMeters * 100);

        for (let exponent = 0; exponent <= 9; exponent++) {
            for (let mantissa = 1; mantissa <= 9; mantissa++) {
                if (mantissa * Math.pow(10, exponent) >= precisionInCm) {
                    return (mantissa << 4) | exponent;
                }
            }
        }

        return 0x99;
    }

    protected static decode_latitude (value: number): number {
        const seconds = (value * (180 * 3600)) / 2147483648;

        return (seconds - (90 * 3600)) / 3600;
    }

    protected static decode_longitude (value: number): number {
        const seconds = (value * (360 * 3600)) / 2147483648;

        return (seconds - (180 * 3600)) / 3600;
    }

    protected static decode_altitude (value: number): number {
        return (value / 100) - 100000;
    }

    protected static decode_precision (value: number): number {
        const mantissa = (value >> 4) & 0x0F;

        const exponent = value & 0x0F;

        return mantissa * Math.pow(10, exponent) / 100;
    }
}

export namespace LOC {
    export type Record = {
        /** LOC version (must be 0) */
        version: number;
        /** Diameter of the sphere of uncertainty in centimeters */
        size: number;
        /** Horizontal precision in centimeters */
        horizontalPrecision: number;
        /** Vertical precision in centimeters */
        verticalPrecision: number;
        /** Latitude in thousandths of arc-seconds (offset from 2^31) */
        latitude: number;
        /** Longitude in thousandths of arc-seconds (offset from 2^31) */
        longitude: number;
        /** Altitude in centimeters (offset from 100000m below sea level) */
        altitude: number;
    }
}
