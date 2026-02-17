export type ComercializadoresGOrganizadoresRow = {
	interno?: number | string;
	cuil: string;
	descripcion?: string;
	email: string;
	telefono: string;
	razonSocial?: string;
	fechaNacimiento?: string;
	domocilioCalle?: string;
	domicilioNumero?: string;
	domicilioPiso?: string;
	domicilioEntreCalle?: string;
	domicilioYCalle?: string;
	codLocalidad?: string;
	codPostal?: number;
	accion?: unknown;
	estado?: string;
	id?: string;
};

export type ComercializadoresOrganizadoresRow = {
	interno: number;
	cuil: string;
	observacion?: string;
	email: string;
	telefono: string;
	srtComercializadorGOrganizadorInterno?: number;
	observaciones?: string;
	razonSocial?: string;
	fechaNacimiento?: string;
	domicilioCalle?: string;
	domicilioNro?: string;
	domocilioCalle?: string;
	domicilioNumero?: string;
	domicilioPiso?: string;
	domicilioEntreCalle1?: string;
	domicilioEntreCalle2?: string;
	domicilioEntreCalle?: string;
	domicilioYCalle?: string;
	codLocalidadSrt?: string;
	codLocalidadPostal?: number;
	codLocalidad?: string;
	codPostal?: number;
	accion?: unknown;
	estado?: string;
};

export type VComercializadorRow = {
	interno?: number;
	cuil: string;
	referenteRazonSocial?: string;
	matricula?: string | number;
	email?: string;
	telefono?: string;
	movil?: string;
	referenteDatosInterno?: number;
	canalInterviniente?: string;
	inicioFecha?: string;
	bajaFecha?: string | null;
	comision?: number;
	aplicaIva?: number;
	serviciosAdicionales?: number;
	srtComercializadorOrganizadorInterno?: number;
	accion?: unknown;
	estado?: string;
};

export type FormMethod = "create" | "edit" | "view" | "delete";
export type EditKind = "grupo" | "organizador" | "comercializador";



export type ComercializadorPostRequest = {
    cuil: number;
    matricula: string;
    email: string;
    telefono: string;
    movil: string;
    canalInterviniente: string;
    inicioFecha: string;
    bajaFecha: string | null;
    comision: number;
    aplicaIva: number;
    serviciosAdicionales: number;
    srtComercializadorOrganizadorInterno: number;

    razonSocial: string,
    fechaNacimiento: string,
    domocilioCalle: string,
    domicilioNumero: string,
    domicilioPiso: string,
    domicilioEntreCalle: string,
    domicilioYCalle: string,
    codLocalidad: string,
    codPostal: number
}

export type ComercializadorPostResponse = unknown;

export type ComercializadorPutRequest = {
    interno: number;
    cuil: number;
    matricula: string;
    email: string;
    telefono: string;
    movil: string;
    referenteDatosInterno: number;
    canalInterviniente: string;
    inicioFecha: string; 
    bajaFecha: string | null;
    comision: number;
    aplicaIva: number;
    serviciosAdicionales: number;
    srtComercializadorOrganizadorInterno: number;
}

export type ComercializadorPutResponse = unknown;

export type ComercializadorDeleteParams = {
    id: number | string;
};

export type ComercializadorDeleteResponse = unknown;


export type ComercializadorOrganizadoresPostRequest = {
  srtComercializadorGOrganizadorInterno: number,
  observaciones: string,
  cuil: number,
  email: string,
  telefono: string,
  razonSocial: string,
  fechaNacimiento: string,
  domocilioCalle: string,
  domicilioNumero: string,
  domicilioPiso: string,
  domicilioEntreCalle: string,
  domicilioYCalle: string,
  codLocalidad: string,
  codPostal: number;
}

export type ComercializadorOrganizadoresPutRequest = {
  interno: number,
  srtComercializadorGOrganizadorInterno: number,
  observaciones: string,
  cuil: number,
  email: string,
  telefono: string,
  razonSocial: string,
  fechaNacimiento: string,
  domocilioCalle: string,
  domicilioNumero: string,
  domicilioPiso: string,
  domicilioEntreCalle: string,
  domicilioYCalle: string,
  codLocalidad: string,
  codPostal: number;
}


export type ComercializadorGOrganizadoresPostRequest = {
  descripcion: string,
  cuil: number,
  email: string,
  telefono: string,
  razonSocial: string,
  fechaNacimiento: string,
  domocilioCalle: string,
  domicilioNumero: string,
  domicilioPiso: string,
  domicilioEntreCalle: string,
  domicilioYCalle: string,
  codLocalidad: string,
  codPostal: number;
}

export type ComercializadorGOrganizadoresPutRequest = {
  interno: number,
  descripcion: string,
  cuil: number,
  email: string,
  telefono: string,
  razonSocial: string,
  fechaNacimiento: string,
  domocilioCalle: string,
  domicilioNumero: string,
  domicilioPiso: string,
  domicilioEntreCalle: string,
  domicilioYCalle: string,
  codLocalidad: string,
  codPostal: number;
}

export type ComercializadorGOrganizadorById = {
  id: number;
} 

export type ComercializadorOrganizadorById = {
  id: number;
} 

export type ComercializadorById = {
  id: number;
} 