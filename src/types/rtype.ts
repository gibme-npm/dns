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

/**
 * The Resource Record Type
 */
export type RTYPE =
    'A'
    | 'NS'
    | 'CNAME'
    | 'SOA'
    | 'PTR'
    | 'HINFO'
    | 'MX'
    | 'TXT'
    | 'RP'
    | 'AFSDB'
    | 'AAAA'
    | 'LOC'
    | 'SRV'
    | 'NAPTR'
    | 'KX'
    | 'CERT'
    | 'DNAME'
    | 'OPT'
    | 'DS'
    | 'SSHFP'
    | 'IPSECKEY'
    | 'RRSIG'
    | 'NSEC'
    | 'DNSKEY'
    | 'DHCID'
    | 'NSEC3'
    | 'NSEC3PARAM'
    | 'TLSA'
    | 'SMIMEA'
    | 'HIP'
    | 'CDS'
    | 'CDNSKEY'
    | 'OPENPGPKEY'
    | 'CSYNC'
    | 'ZONEMD'
    | 'SVCB'
    | 'HTTPS'
    | 'EUI48'
    | 'EUI64'
    | 'TKEY'
    | 'TSIG'
    | 'IXFR'
    | 'AXFR'
    | 'URI'
    | 'CAA'
    | 'AVC'
    | 'DOA'
    | 'AMTRELAY'
    | 'MD'
    | 'MF'
    | 'MB'
    | 'MG'
    | 'MR'
    | 'NULL'
    | 'WKS'
    | 'MINFO'
    | 'X25'
    | 'ISDN'
    | 'RT'
    | 'NSAP'
    | 'NSAP-PTR'
    | 'SIG'
    | 'KEY'
    | 'PX'
    | 'GPOS'
    | 'NXT'
    | 'EID'
    | 'NIMLOC'
    | 'ATMA'
    | 'A6'
    | 'SINK'
    | 'APL'
    | 'NINFO'
    | 'RKEY'
    | 'TALINK'
    | 'SPF'
    | 'UINFO'
    | 'UID'
    | 'GID'
    | 'UNSPEC'
    | 'NID'
    | 'L32'
    | 'L64'
    | 'LP'
    | 'MAILB'
    | 'MAILA'
    | 'ANY'
    | 'TA'
    | 'DLV';

/**
 * @internal
 */
export class RType {
    /**
     * A Map of the Resource Record Type ID to its string name
     */
    public static readonly ID_TO_NAME: Map<number, RTYPE> = new Map<number, RTYPE>([
        [1, 'A'],
        [2, 'NS'],
        [5, 'CNAME'],
        [6, 'SOA'],
        [12, 'PTR'],
        [13, 'HINFO'],
        [15, 'MX'],
        [16, 'TXT'],
        [17, 'RP'],
        [18, 'AFSDB'],
        [28, 'AAAA'],
        [29, 'LOC'],
        [33, 'SRV'],
        [35, 'NAPTR'],
        [36, 'KX'],
        [37, 'CERT'],
        [39, 'DNAME'],
        [41, 'OPT'],
        [43, 'DS'],
        [44, 'SSHFP'],
        [45, 'IPSECKEY'],
        [46, 'RRSIG'],
        [47, 'NSEC'],
        [48, 'DNSKEY'],
        [49, 'DHCID'],
        [50, 'NSEC3'],
        [51, 'NSEC3PARAM'],
        [52, 'TLSA'],
        [53, 'SMIMEA'],
        [55, 'HIP'],
        [59, 'CDS'],
        [60, 'CDNSKEY'],
        [61, 'OPENPGPKEY'],
        [62, 'CSYNC'],
        [63, 'ZONEMD'],
        [64, 'SVCB'],
        [65, 'HTTPS'],
        [108, 'EUI48'],
        [109, 'EUI64'],
        [249, 'TKEY'],
        [250, 'TSIG'],
        [251, 'IXFR'],
        [252, 'AXFR'],
        [256, 'URI'],
        [257, 'CAA'],
        [258, 'AVC'],
        [259, 'DOA'],
        [260, 'AMTRELAY'],
        [3, 'MD'],
        [4, 'MF'],
        [7, 'MB'],
        [8, 'MG'],
        [9, 'MR'],
        [10, 'NULL'],
        [11, 'WKS'],
        [14, 'MINFO'],
        [19, 'X25'],
        [20, 'ISDN'],
        [21, 'RT'],
        [22, 'NSAP'],
        [23, 'NSAP-PTR'],
        [24, 'SIG'],
        [25, 'KEY'],
        [26, 'PX'],
        [27, 'GPOS'],
        [30, 'NXT'],
        [31, 'EID'],
        [32, 'NIMLOC'],
        [34, 'ATMA'],
        [38, 'A6'],
        [40, 'SINK'],
        [42, 'APL'],
        [56, 'NINFO'],
        [57, 'RKEY'],
        [58, 'TALINK'],
        [99, 'SPF'],
        [100, 'UINFO'],
        [101, 'UID'],
        [102, 'GID'],
        [103, 'UNSPEC'],
        [104, 'NID'],
        [105, 'L32'],
        [106, 'L64'],
        [107, 'LP'],
        [253, 'MAILB'],
        [254, 'MAILA'],
        [255, 'ANY'], // this is special
        [32768, 'TA'],
        [32769, 'DLV']
    ]);

    /**
     * A Map of the Resource Record Types from name to type ID
     */
    public static readonly NAME_TO_ID: Map<RTYPE, number> = new Map(Array.from(RType.ID_TO_NAME.entries())
        .map(([id, name]) => [name, id]));

    public readonly id: number;
    public readonly name: RTYPE;

    /**
     * Constructs a new Resource Record Type
     * @param nameOrId
     */
    constructor (nameOrId: RTYPE | number) {
        if (typeof nameOrId === 'string') {
            this.name = nameOrId.toUpperCase() as RTYPE;

            this.id = RType.nameToId(nameOrId);
        } else {
            this.name = RType.idToName(nameOrId);

            this.id = nameOrId;
        }
    }

    /**
     * Returns the Resource Record Type as a Buffer
     */
    public get buffer (): Buffer {
        const buffer = Buffer.alloc(2);

        buffer.writeUInt16BE(this.id, 0);

        return buffer;
    }

    /**
     * Decodes a Resource Record from a buffer
     * @param buffer
     */
    public static from (buffer: Reader | Buffer): RType {
        if (Buffer.isBuffer(buffer)) {
            buffer = new Reader(buffer);
        }

        const type = buffer.uint16_t(true).toJSNumber();

        return new RType(type);
    }

    /**
     * Converts a resource record from its name to its type ID
     * @param name
     */
    public static nameToId (name: RTYPE): number {
        name = name.toUpperCase() as RTYPE;

        if (RType.NAME_TO_ID.has(name)) return RType.NAME_TO_ID.get(name)!;

        if (name.startsWith('UNKNOWN.')) {
            const [, id] = name.split('.');

            return parseInt(id, 10) || 0;
        }

        return 0;
    }

    /**
     * Converts a resource record type ID to its name
     * @param type
     */
    public static idToName (type: number): RTYPE {
        return RType.ID_TO_NAME.get(type) ?? `UNKNOWN.${type}` as RTYPE;
    }

    /**
     * Returns the Resource Record Type Name
     */
    public toString (): RTYPE {
        return this.name;
    }
}
