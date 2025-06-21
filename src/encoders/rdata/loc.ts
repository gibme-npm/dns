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

export class LOC {
    public static readonly type: number = 29;

    public static decode (reader: Reader): LOC.Record {
        const length = reader.uint16_t(true).toJSNumber();

        const temp = new Reader(reader.bytes(length));

        const version = temp.uint8_t().toJSNumber();

        const size = temp.uint8_t().toJSNumber();

        const horizontalPrecision = temp.uint8_t().toJSNumber();

        const verticalPrecision = temp.uint8_t().toJSNumber();

        const latitude = temp.uint32_t().toJSNumber();

        const longitude = temp.uint32_t().toJSNumber();

        const altitude = temp.uint32_t().toJSNumber();

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

        return Math.round((seconds * (1 << 31)) / (180 * 3600));
    }

    protected static encode_longitude (longitude: number): number {
        longitude = Math.max(-180, Math.min(180, longitude));

        const seconds = (longitude * 3600) + (180 * 3600);

        return Math.round((seconds * (1 << 31)) / (360 * 3600));
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
        const seconds = (value * (180 * 3600)) / (1 << 31);

        return (seconds - (90 * 3600)) / 3600;
    }

    protected static decode_longitude (value: number): number {
        const seconds = (value * (360 * 3600)) / (1 << 31);

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
        version: number;
        size: number;
        horizontalPrecision: number;
        verticalPrecision: number;
        latitude: number;
        longitude: number;
        altitude: number;
    }
}
