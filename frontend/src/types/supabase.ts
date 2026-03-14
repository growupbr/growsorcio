export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          user_id: string;
          organization_id: string;
          full_name: string | null;
          role: 'owner' | 'admin' | 'member';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          organization_id: string;
          full_name?: string | null;
          role?: 'owner' | 'admin' | 'member';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          organization_id?: string;
          full_name?: string | null;
          role?: 'owner' | 'admin' | 'member';
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: number;
          organization_id: string;
          nome: string;
          whatsapp: string | null;
          email: string | null;
          instagram: string | null;
          tipo_de_bem: string | null;
          valor_da_carta: number | null;
          recurso_para_lance: number | null;
          restricao_cpf: boolean;
          urgencia: string | null;
          temperatura: 'frio' | 'morno' | 'quente';
          etapa_funil: string;
          motivo_descarte: string | null;
          snooze_ate: string | null;
          data_proxima_acao: string | null;
          tipo_proxima_acao: string | null;
          observacoes: string | null;
          origem: 'prospeccao' | 'anuncio';
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: number;
          organization_id: string;
          nome: string;
          whatsapp?: string | null;
          email?: string | null;
          instagram?: string | null;
          tipo_de_bem?: string | null;
          valor_da_carta?: number | null;
          recurso_para_lance?: number | null;
          restricao_cpf?: boolean;
          urgencia?: string | null;
          temperatura?: 'frio' | 'morno' | 'quente';
          etapa_funil?: string;
          motivo_descarte?: string | null;
          snooze_ate?: string | null;
          data_proxima_acao?: string | null;
          tipo_proxima_acao?: string | null;
          observacoes?: string | null;
          origem?: 'prospeccao' | 'anuncio';
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: {
          id?: number;
          organization_id?: string;
          nome?: string;
          whatsapp?: string | null;
          email?: string | null;
          instagram?: string | null;
          tipo_de_bem?: string | null;
          valor_da_carta?: number | null;
          recurso_para_lance?: number | null;
          restricao_cpf?: boolean;
          urgencia?: string | null;
          temperatura?: 'frio' | 'morno' | 'quente';
          etapa_funil?: string;
          motivo_descarte?: string | null;
          snooze_ate?: string | null;
          data_proxima_acao?: string | null;
          tipo_proxima_acao?: string | null;
          observacoes?: string | null;
          origem?: 'prospeccao' | 'anuncio';
          criado_em?: string;
          atualizado_em?: string;
        };
      };
      interacoes: {
        Row: {
          id: number;
          organization_id: string;
          lead_id: number;
          data: string;
          tipo: string;
          descricao: string;
          proxima_acao: string | null;
          criado_em: string;
        };
        Insert: {
          id?: number;
          organization_id: string;
          lead_id: number;
          data: string;
          tipo: string;
          descricao: string;
          proxima_acao?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: number;
          organization_id?: string;
          lead_id?: number;
          data?: string;
          tipo?: string;
          descricao?: string;
          proxima_acao?: string | null;
          criado_em?: string;
        };
      };
      cadencia_itens: {
        Row: {
          id: number;
          organization_id: string;
          lead_id: number;
          descricao: string;
          data_prevista: string | null;
          concluido: boolean;
          etapa_relacionada: string | null;
          criado_em: string;
        };
        Insert: {
          id?: number;
          organization_id: string;
          lead_id: number;
          descricao: string;
          data_prevista?: string | null;
          concluido?: boolean;
          etapa_relacionada?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: number;
          organization_id?: string;
          lead_id?: number;
          descricao?: string;
          data_prevista?: string | null;
          concluido?: boolean;
          etapa_relacionada?: string | null;
          criado_em?: string;
        };
      };
    };
    Functions: {
      is_org_member: {
        Args: { org_id: string };
        Returns: boolean;
      };
      user_role: {
        Args: { org_id: string };
        Returns: string;
      };
      reset_identity_sequences: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
  };
};
