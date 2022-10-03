import dgram from 'node:dgram';

// TODO: API will change for better use
export const createServer = () => {
	const controller = new AbortController();
	const server = dgram.createSocket({
		type: 'udp4',
		signal: controller.signal,
	});

	return {
		server,
		stop: controller.abort,
	};
};

// Reference: http://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml#dns-parameters-2
/* eslint-disable no-unused-vars */
export const enum EResourceRecordType {
	A = 1,
	NS,
	MD,
	MF,
	CNAME,
	SOA,
	MB,
	MG,
	MR,
	NULL,
	WKS,
	PTR,
	HINFO,
	MINFO,
	MX,
	TXT,
	PR,
	AFSDB,
	X25,
	ISDN,
	RT,
	NSAP,
	NSAP_PTR,
	SIG,
	KEY,
	PX,
	GPOS,
	AAAA,
	LOC,
	NXT,
	EID,
	NIMLOC,
	SRV,
	ATMA,
	NAPTR,
	KX,
	CERT,
	A6,
	DNAME,
	SINK,
	OPT,
	APL,
	DS,
	SSHFP,
	IPSECKEY,
	RRSIG,
	NSEC,
	DNSKEY,
	DHCID,
	NSEC3,
	NSEC3PARAM,
	TLSA,
	SMIMEA,
	HIP = 55,
	NINFO,
	RKEY,
	TALINK,
	CDS,
	CDNSKEY,
	OPENPGPKEY,
	CSYNC,
	ZONEMD,
	SVCB,
	HTTPS,
	SPF = 99,
	UINFO,
	UID,
	GID,
	UNSPEC,
	NID,
	L32,
	L64,
	LP,
	EUI48,
	EUI64,
	TKEY = 249,
	TSIG,
	IXFR,
	AXFR,
	MAILB,
	MAILA,
	Asterisk,
	URI,
	CAA,
	AVC,
	DOA,
	AMTRELAY,
	TA = 32768,
	DLV
}

export const enum EQueryType {
	Query = 0,
	Response
}

export const enum EClassType {
	Internet = 1,
	Chaos = 3,
	Hesiod,
	None = 254,
	Any
}

export const enum EOperationType {
	Query = 0,
	InverseQuery,
	Status,
	Notify = 4,
	Update,
	DNSStatefulOperations
}

export const enum EResponseType {
	NoError = 0,
	FormErr,
	ServFail,
	NXDomain,
	NotImp,
	Refused,
	YXDomain,
	YXRRSet,
	NXRRSet,
	NotAuthoritative,
	NotAuthorized,
	NotZone,
	DSOTYPENI,
	BADVERS = 16,
	BADSIG = 16,
	BADKEY,
	BADTIME,
	BADMODE,
	BADNAME,
	BADALG,
	BADTRUNC,
	BADCOOKIE
}

export const enum EFlagType {
	Disabled = 0,
	Enabled
}
/* eslint-enable no-unused-vars */

/**
 * Read a single bit from buffer
 * @param buffer The buffer object
 * @param offset The offset in bits
 */
export const pick = (buffer: Buffer, offset: number): number => (buffer[offset >> 3] >> (7 - offset & 7)) & 1;

export const range = (buffer: Buffer, offset: number, size: number): number => {
	let value = 0x0;

	for (let i = 0; i < size; i++) {
		if (pick(buffer, offset + i)) {
			value |= 2 ** i;
		}
	}

	return value;
};

// Reference: https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.1
export const header = (buffer: Buffer) => {
	let index = 0;

	const identifier = buffer.readUInt16BE(index);
	index += 16;

	const type: EQueryType = pick(buffer, index++);

	const operation: EOperationType = range(buffer, index, 4);
	index += 4;

	const authorized: EFlagType = pick(buffer, index++);

	const truncated: EFlagType = pick(buffer, index++);

	const recursionDesired: EFlagType = pick(buffer, index++);

	const recursionAvailable: EFlagType = pick(buffer, index++);

	// Z: Reserved for future
	index += 1;

	const authenticData: EFlagType = pick(buffer, index++);

	const checkingDisabled: EFlagType = pick(buffer, index++);

	const responseCode: EResponseType = range(buffer, index, 4);
	index += 4;

	const queries = buffer.readUInt16BE(index / 8);
	index += 16;

	const answers = buffer.readUint16BE(index / 8);
	index += 16;

	const nameservers = buffer.readUint16BE(index / 8);
	index += 16;

	const additionals = buffer.readUint16BE(index / 8);
	index += 16;

	const request = {
		identifier,
		type,
		operation,
		flag: {
			authorized,
			truncated,
			recursionDesired,
			recursionAvailable,
			authenticData,
			checkingDisabled,
		},
		responseCode,
		count: {
			queries,
			answers,
			nameservers,
			additionals,
		},
	};

	return [index, request] as const;
};

// Reference: https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.2
export const questionSection = (buffer: Buffer, offset: number) => {
	let index = Math.floor(offset / 8);

	const specials: Record<number, string> = {
		3: '.',
	};
	let domain = '';

	// ACK
	if (buffer.readUint8(index) !== 6) {
		throw new Error('ACK not found!');
	}

	index += 1;

	for (; ;) {
		const charCode = buffer.readUint8(index);
		index += 1;

		if (!charCode) {
			break;
		}

		domain += specials[charCode] ?? String.fromCharCode(charCode);
	}

	const record: EResourceRecordType = buffer.readUint16BE(index);
	index += 2;

	const unit: EClassType = buffer.readUint16BE(index);
	index += 2;

	const question = {
		record,
		domain,
		unit,
	};

	return [index * 8, question] as const;
};
