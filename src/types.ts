export interface Contract {
  id: string;
  client_id?: string | null;
  client_name: string;
  raw_client_name?: string | null;
  client_aliases?: string[];
  contract_type: 'cliente' | 'proveedor' | 'interno';
  brand: 'datared' | 'red';
  title: string;
  service_name?: string | null;
  service_category: 'radiocomunicacion' | 'colocation' | 'conectividad' | 'otro';
  units_quantity?: number | null;
  bandwidth_mbps?: number | null;
  monthly_fee?: number | null;
  contract_value?: number | null;
  currency: string;
  duration_months?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  renewal_date?: string | null;
  status: 'vigente' | 'en_revision' | 'vencido' | 'cancelado';
  summary?: string | null;
  key_terms?: string | null;
  file_name?: string | null;
  file_path?: string | null;
  file_size?: number | null;
  notion_page_id?: string | null;
  created_at: string;
  updated_at?: string;
  // Sub-document or batch contract references
  parent_contract_id?: string | null;
  folder_name?: string | null;
}

export interface ClientProfile {
  id: string;
  canonical_name: string;
  aliases: string[];
  contact_person?: string;
  email?: string;
  phone?: string;
  contracts_count?: number;
}

export interface ExtractionResult {
  client_name?: string | null;
  raw_client_name?: string | null;
  aliases?: string[];
  contract_type?: 'cliente' | 'proveedor' | 'interno';
  brand?: 'datared' | 'red';
  title?: string;
  service_name?: string | null;
  service_category?: 'radiocomunicacion' | 'colocation' | 'conectividad' | 'otro';
  units_quantity?: number | null;
  bandwidth_mbps?: number | null;
  monthly_fee?: number | null;
  contract_value?: number | null;
  currency?: string;
  duration_months?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  summary?: string | null;
  key_terms?: string | null;
}
