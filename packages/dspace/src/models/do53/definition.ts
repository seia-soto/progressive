/* eslint-disable no-unused-vars */
export const enum EQueryOrResponse {
  Query = 0,
  Response
}

export const enum EOperationCode {
  Query = 0,
  InverseQuery,
  Status,
  Notify = 4,
  Update,
  DNSStatefulOperations
}

export const enum EFlag {
  Disabled = 0,
  Enabled
}

export const enum EResponseCode {
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

// Reference: http://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml
export const enum EResourceRecord {
  A = 1,
  NS,
  CNAME = 5,
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
}

export const enum EClass {
  Internet = 1,
  Chaos = 3,
  Hesiod,
}

// https://datatracker.ietf.org/doc/html/rfc1010
export const enum EProtocol {
  ICMP = 0,
  IGMP,
  GGP,
  ST = 5,
  TCP,
  UCL,
  EGP,
  IGP,
  BBNRCCMON,
  NVPII,
  PUP,
  ARGUS,
  EMON,
  XNET,
  CHAOS,
  UDP,
  MUX,
  CDNMEAS,
  HMP,
  PRM,
  XNSIDP,
  TRUNK1,
  TRUNK2,
  LEAF1,
  LEAF2,
  RDP,
  IRTP,
  ISOTP4,
  NETBLT,
  MFENSP,
  SEP,
  CFTP = 62,
  LOCALNET,
  SATEXPAK,
  MITSUBMIT,
  RVD,
  IPPC,
  SATMON = 69,
  IPCV,
  BRSATMON = 76,
  WBMON = 78,
  WBEXPAK
}
