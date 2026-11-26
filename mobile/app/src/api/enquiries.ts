import { api } from './client';

/** MSME challenge / doubt enquiry from the public client screening form (GET /mobile/enquiries). */
export interface Enquiry {
  id: string;
  fullName: string;
  phone: string;
  natureOfBusiness: string;
  establishmentStage: string;
  topics: string[];
  otherText: string;
  rawMaterialText: string;
  machineryText: string;
  scheme: string;
  source: string;
  submittedAt?: string;
}

export interface EnquiryPage {
  data: Enquiry[];
  total: number;
  page: number;
  limit: number;
}

export const enquiryKeys = {
  all: ['enquiries'] as const,
  list: (q: string) => ['enquiries', 'list', q] as const,
  detail: (id: string) => ['enquiries', 'detail', id] as const,
};

export async function listEnquiries({ page = 1, q = '' }: { page?: number; q?: string } = {}): Promise<EnquiryPage> {
  const { data } = await api.get<EnquiryPage & { success: boolean }>('/mobile/enquiries', {
    params: { page, limit: 20, ...(q ? { q } : {}) },
  });
  if (!Array.isArray(data?.data)) throw new Error('Unexpected enquiries response');
  return { data: data.data, total: data.total, page: data.page, limit: data.limit };
}

export async function getEnquiry(id: string): Promise<Enquiry> {
  const { data } = await api.get<{ success: boolean; data: Enquiry }>(`/mobile/enquiries/${id}`);
  return data.data;
}
