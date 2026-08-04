import { ClientProfile } from '../types';

export const INITIAL_CLIENT_PROFILES: ClientProfile[] = [
  {
    id: 'client-bandesal',
    canonical_name: 'Banco de Desarrollo de la República de El Salvador (BANDESAL)',
    aliases: [
      'BANDESAL',
      'Banco de Desarrollo',
      'Bandesal El Salvador',
      'BANCO DE DESARROLLO DE LA REPUBLICA DE EL SALVADOR',
      'BANCO DE DESARROLLO DE LA REPÚBLICA DE EL SALVADOR'
    ],
    contact_person: 'Edgar Chacón / Manuel Vásquez',
    email: 'edgar.chacon@bandesal.gob.sv',
    phone: '2592-1066'
  },
  {
    id: 'client-bolpros',
    canonical_name: 'Bolsa de Productos de El Salvador (BOLPROS, S.A. DE C.V.)',
    aliases: [
      'BOLPROS',
      'Bolsa de Productos',
      'BOLPROS, S.A. DE C.V.',
      'BOLPROS S.A. DE C.V.',
      'Bolsa de Productos y Servicios'
    ],
    contact_person: 'Mauricio Campos Huezo / Kelvin Farfán Argujo',
    email: 'kfarfan@bolpros.com.sv',
    phone: '2248-7000'
  },
  {
    id: 'client-serfinsa',
    canonical_name: 'Servicios Financieros, S.A. de C.V. (SERFINSA)',
    aliases: [
      'SERFINSA',
      'Servicios Financieros',
      'SERFINSA, S.A. DE C.V.',
      'SERVICIOS FINANCIEROS, SOCIEDAD ANÓNIMA DE CAPITAL VARIABLE'
    ],
    contact_person: 'Leandro Martín Guini',
    email: 'lguini@serfinsa.com.sv',
    phone: '2211-5000'
  },
  {
    id: 'client-alsasa',
    canonical_name: 'Aluminio de El Salvador, S.A. (ALSASA)',
    aliases: [
      'ALSASA',
      'ALUMINIO DE EL SALVADOR',
      'ALUMINIO DEL EL SALVADOR S.A.',
      'ALUMINIO DE EL SALVADOR, S.A. DE C.V.'
    ],
    contact_person: 'José Francisco Durán Frixione',
    email: 'jduran@alsasa.com.sv',
    phone: '2311-2000'
  },
  {
    id: 'client-esa',
    canonical_name: 'Enterprise Solutions América, S.A. de C.V. (ESA)',
    aliases: [
      'Enterprise Solutions América',
      'ENTERPRISE SOLUTIONS AMERICA, S.A. DE C.V.',
      'ESA',
      'Enterprise Solutions'
    ],
    contact_person: 'Jessica Marily Portillo de Reyes',
    email: 'jportillo@enterprisesolutions.com.sv',
    phone: '2288-4000'
  },
  {
    id: 'client-ssp',
    canonical_name: 'Servicio Salvadoreño de Protección, S.A. de C.V. (SSP)',
    aliases: [
      'SSP',
      'Servicio Salvadoreño de Protección',
      'SERVICIO SALVADORENO DE PROTECCION S.A. DE C.V.'
    ],
    contact_person: 'Gerencia Operaciones',
    email: 'contacto@ssp.com.sv',
    phone: '2250-9000'
  },
  {
    id: 'client-telefonica',
    canonical_name: 'Telefónica Móviles El Salvador, S.A. de C.V.',
    aliases: [
      'TELEFONICA',
      'TELEFÓNICA',
      'TELEFONICA MOVILES',
      'TELEFÓNICA MÓVILES EL SALVADOR',
      'TELEFONIcA vIÓvILES EL SALVADOR, SOcTEDAD ANóN',
      'TELEFONIcA vIÓvILES EL SALVADOR',
      'TELEFONICA MOVILES EL SALVADOR, SOCIEDAD ANONIMA'
    ],
    contact_person: 'Gerencia de Compras / Redes',
    email: 'proveedores@telefonica.com.sv',
    phone: '2244-0000'
  }
];

export function findCanonicalClient(rawName: string, clientList: ClientProfile[] = INITIAL_CLIENT_PROFILES): { canonicalName: string; clientProfile?: ClientProfile } {
  if (!rawName || !rawName.trim()) {
    return { canonicalName: 'Cliente Sin Especificar' };
  }

  const cleanRaw = rawName.trim().toLowerCase();

  // Search exact or alias match
  for (const client of clientList) {
    if (client.canonical_name.toLowerCase() === cleanRaw) {
      return { canonicalName: client.canonical_name, clientProfile: client };
    }

    for (const alias of client.aliases) {
      const cleanAlias = alias.toLowerCase();
      if (cleanRaw === cleanAlias || cleanRaw.includes(cleanAlias) || cleanAlias.includes(cleanRaw)) {
        return { canonicalName: client.canonical_name, clientProfile: client };
      }
    }
  }

  return { canonicalName: rawName.trim() };
}

export function normalizeSearchTerm(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
