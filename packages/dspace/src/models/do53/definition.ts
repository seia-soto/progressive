/* eslint-disable no-unused-vars */
export type TFlag = 0 | 1

export type TPart = readonly [number, number]

// Header: https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.1
export const enum EQueryOrResponse {
  Query = 0,
  Response
}

// Reference: https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml
export const enum EOperationCode {
  Query = 0,
  InverseQuery,
  ServerStatus,
  Notify = 4,
  Update
}

export const enum EResponseCode {
  NoError = 0,
  FormatError,
  ServerFailure,
  NameError,
  NotImplemented,
  Refused,
  YxDomain = 6,
  YxRrSet,
  NxRrSet,
  NotAuthorized,
  NotZone
}

export interface IOptions {
  isAuthoritativeAnswer: TFlag,
  isTruncated: TFlag,
  isRecursionDesired: TFlag,
  isRecursionAvailable: TFlag
}

export interface ICounts {
  question: number,
  answer: number,
  nameserver: number,
  additional: number
}

export interface IHeader {
  id: number,
  isQueryOrResponse: EQueryOrResponse,
  operationCode: EOperationCode,
  responseCode: EResponseCode,
  options: IOptions,
  counts: ICounts
}

// Question: https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.2
export const enum ERecord {
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
  DS = 43,
  RRSIG = 46,
  NSEC,
  DNSKEY
}

export const enum EQuestionRecord {
  IXFR = 251,
  AXFR,
  MAILB,
  MAILA,
  Any
}

export const enum EClass {
  Internet = 1,
  Chaos = 3,
  Hesiod,
  None = 254,
  Any
}

export interface IQuestion {
  name: string,
  type: ERecord | EQuestionRecord,
  class: EClass
}

// Resource: https://datatracker.ietf.org/doc/html/rfc1035#section-4.1.3
export const enum EResourceOrder {
  Answer,
  Authority,
  Additional
}

export interface IResource {
  order: EResourceOrder,
  name: string,
  type: ERecord,
  class: EClass,
  ttl: number,
  data: {
    size: number,
    source: unknown
  }
}

// Standard Resource Records: https://datatracker.ietf.org/doc/html/rfc1035#section-3.3
export interface IResourceOfCname extends IResource {
  type: ERecord.CNAME,
  data: {
    size: number,
    source: string
  }
}

export interface IResourceOfHinfo extends IResource {
  type: ERecord.HINFO,
  data: {
    size: number,
    source: {
      cpu: string,
      os: string
    }
  }
}

export interface IResourceOfMx extends IResource {
  type: ERecord.MX,
  data: {
    size: number,
    source: {
      preference: number,
      exchange: string
    }
  }
}

export interface IResourceOfNs extends IResource {
  type: ERecord.NS,
  data: {
    size: number,
    source: string
  }
}

export interface IResourceOfPtr extends IResource {
  type: ERecord.PTR,
  data: {
    size: number,
    source: string
  }
}

export interface IResourceOfSoa extends IResource {
  type: ERecord.SOA,
  data: {
    size: number,
    source: {
      name: string,
      representative: string,
      serial: number,
      refreshIn: number,
      retryIn: number,
      expireIn: number,
      ttl: number
    }
  }
}

export interface IResourceOfTxt extends IResource {
  type: ERecord.TXT,
  data: {
    size: number,
    source: string
  }
}

// Internet specific Resource Records: https://datatracker.ietf.org/doc/html/rfc1035#section-3.4
export type TInternetAddress = readonly [number, number, number, number]

export interface IResourceOfA extends IResource {
  type: ERecord.A,
  data: {
    size: 4,
    source: TInternetAddress
  }
}

export interface IResourceOfWks extends IResource {
  type: ERecord.WKS,
  data: {
    size: number,
    source: {
      address: TInternetAddress,
      protocol: number,
      ports: number[]
    }
  }
}

// NULL Resource Record: https://datatracker.ietf.org/doc/html/rfc1035#section-3.3.10
export interface IResourceOfNull extends IResource {
  type: ERecord.NULL,
  data: {
    size: number,
    source: null
  }
}

// DNSKEY Resource Record: https://datatracker.ietf.org/doc/html/rfc4034#section-2
export const enum EKeyAlgorithm {
  RSAMD5 = 1,
  DH,
  DSA,
  ECC,
  RSASHA1,
  INDIRECT = 252,
  PRIVATEDNS,
  PRIVATEOID
}

export interface IResourceOfDnskey extends IResource {
  type: ERecord.DNSKEY,
  data: {
    size: number,
    source: {
      flags: {
        isZoneKey: TFlag, // 7th bit
        isSecureEntryPoint: TFlag // 15th bit
      },
      protocol: 3,
      algorithm: EKeyAlgorithm,
      publicKey: string
    }
  }
}

export interface IResourceOfRrsig extends IResource {
  type: ERecord.RRSIG,
  data: {
    size: number,
    source: {
      typeCovered: ERecord,
      algorithm: EKeyAlgorithm,
      labels: number,
      originalTtl: number,
      signatureExpiration: number,
      signatureInception: number,
      keyTag: number,
      signerName: string,
      signature: string
    }
  }
}

export interface IResourceOfNsec extends IResource {
  type: ERecord.NSEC,
  data: {
    size: number,
    source: {
      nextName: string,
      typeBitMap: ERecord[]
    }
  }
}

// DS Resource Record: https://datatracker.ietf.org/doc/html/rfc4034#appendix-A.2
export const enum EDigestType {
  SHA1 = 1
}

export interface IResourceOfDs extends IResource {
  type: ERecord.DS,
  data: {
    size: number,
    source: {
      keyTag: number,
      algorithm: EKeyAlgorithm,
      digestType: EDigestType,
      digest: string
    }
  }
}

export type TResources = IResourceOfCname
  | IResourceOfHinfo
  | IResourceOfMx
  | IResourceOfNs
  | IResourceOfPtr
  | IResourceOfSoa
  | IResourceOfTxt
  | IResourceOfA
  | IResourceOfWks
  | IResourceOfNull
  | IResourceOfDnskey
  | IResourceOfRrsig
  | IResourceOfNsec
  | IResourceOfDs

export type TInternetResources = IResourceOfA
  | IResourceOfWks

// Packet (Composed)
export interface IPacket extends IHeader {
  questions: IQuestion[],
  resources: TResources[]
}

export interface IUpdatePacket extends Omit<IPacket, 'options'> {
  questions: (Omit<IQuestion, 'type'> & {type: ERecord.SOA})[],
}

// Parameters
export type TOptionalResourcesClassField = Partial<{ class: EClass }>

export type TBuildableQuestion = Omit<IQuestion, 'class'> & TOptionalResourcesClassField

export type TBuildableResource = Omit<TResources, 'class'> & TOptionalResourcesClassField

export type TBuildablePacketOverridingParameters = 'options' | 'questions' | 'resources'

export interface IBuildablePacketOverrides extends Omit<IPacket, TBuildablePacketOverridingParameters> {
  options: Partial<IOptions>,
  questions: TBuildableQuestion[],
  resources: TBuildableResource[]
}

export type TNecessaryPacketParameters = 'isQueryOrResponse'

export type TBuildablePacket = Pick<IBuildablePacketOverrides, TNecessaryPacketParameters> & Partial<Omit<IBuildablePacketOverrides, TNecessaryPacketParameters>>

// External notion
export type TCompressionMap = Record<string, number> & { __offset: number }
