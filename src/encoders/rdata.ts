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

import { A } from './rdata/a';
import { NS } from './rdata/ns';
import { CNAME } from './rdata/cname';
import { SOA } from './rdata/soa';
import { PTR } from './rdata/ptr';
import { HINFO } from './rdata/hinfo';
import { MX } from './rdata/mx';
import { TXT } from './rdata/txt';
import { RP } from './rdata/rp';
import { AFSDB } from './rdata/afsdb';
import { AAAA } from './rdata/aaaa';
import { LOC } from './rdata/loc';
import { SRV } from './rdata/srv';
import { NAPTR } from './rdata/naptr';
import { KX } from './rdata/kx';
import { CERT } from './rdata/cert';
import { DNAME } from './rdata/dname';
import { OPT } from './rdata/opt';
import { DS } from './rdata/ds';
import { SSHFP } from './rdata/sshfp';
import { IPSECKEY } from './rdata/ipseckey';
import { RRSIG } from './rdata/rrsig';
import { NSEC } from './rdata/nsec';
import { DNSKEY } from './rdata/dnskey';
import { DHCID } from './rdata/dhcid';
import { NSEC3 } from './rdata/nsec3';
import { NSEC3PARAM } from './rdata/nsec3param';
import { TLSA } from './rdata/tlsa';
import { SMIMEA } from './rdata/smimea';
import { HIP } from './rdata/hip';
import { CDS } from './rdata/cds';
import { CDNSKEY } from './rdata/cdnskey';
import { OPENPGPKEY } from './rdata/openpgpkey';
import { CSYNC } from './rdata/csync';
import { ZONEMD } from './rdata/zonemd';
import { SVCB } from './rdata/svcb';
import { HTTPS } from './rdata/https';
import { EUI48 } from './rdata/eui48';
import { EUI64 } from './rdata/eui64';
import { TKEY } from './rdata/tkey';
import { TSIG } from './rdata/tsig';
import { URI } from './rdata/uri';
import { CAA } from './rdata/caa';
import { AVC } from './rdata/avc';
import { DOA } from './rdata/doa';
import { AMTRELAY } from './rdata/amtrelay';
import type { Reader, Writer } from '@gibme/bytepack';
import type { Name } from './name';
import { Unsupported } from './rdata/unsupported';

/**
 * Describes the interface for an RRDataEncoder
 */
export type RRDataEncoder<RRDATA = any> = {
    type: Readonly<number>;
    decode: (reader: Reader) => RRDATA;
    encode: (writer: Writer, data: RRDATA, index: Name.CompressionIndex) => void;
}

export const RRDataMap: Map<number, RRDataEncoder> = new Map<number, RRDataEncoder>([
    [1, A],
    [2, NS],
    [5, CNAME],
    [6, SOA],
    [12, PTR],
    [13, HINFO],
    [15, MX],
    [16, TXT],
    [17, RP],
    [18, AFSDB],
    [28, AAAA],
    [29, LOC],
    [33, SRV],
    [35, NAPTR],
    [36, KX],
    [37, CERT],
    [39, DNAME],
    [41, OPT],
    [43, DS],
    [44, SSHFP],
    [45, IPSECKEY],
    [46, RRSIG],
    [47, NSEC],
    [48, DNSKEY],
    [49, DHCID],
    [50, NSEC3],
    [51, NSEC3PARAM],
    [52, TLSA],
    [53, SMIMEA],
    [51, HIP],
    [59, CDS],
    [60, CDNSKEY],
    [61, OPENPGPKEY],
    [62, CSYNC],
    [63, ZONEMD],
    [64, SVCB],
    [64, HTTPS],
    [108, EUI48],
    [109, EUI64],
    [249, TKEY],
    [250, TSIG],
    [256, URI],
    [257, CAA],
    [258, AVC],
    [259, DOA],
    [260, AMTRELAY]
]);

export class RDATA {
    /**
     * Decodes the RDATA based upon the type supplied
     * @param type
     * @param reader
     */
    public static decode (type: number, reader: Reader) {
        return RDATA.select_encoder(type).decode(reader);
    }

    /**
     * Encodes the RDATA based upon the type supplied
     * @param type
     * @param data
     * @param writer
     * @param index
     */
    public static encode (type: number, data: any, writer: Writer, index: Name.CompressionIndex) {
        return RDATA.select_encoder(type).encode(writer, data, index);
    }

    /**
     * Selects the appropriate encoder for the specified resource record type
     * @param type
     * @protected
     */
    protected static select_encoder (type: number): RRDataEncoder {
        return RRDataMap.get(type) ?? {
            type,
            decode: (reader: Reader) => Unsupported.decode(reader, type),
            encode: (writer: Writer, data: any) => Unsupported.encode(writer, data)
        };
    }
}
