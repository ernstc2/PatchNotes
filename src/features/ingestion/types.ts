export type ItemType = 'executive_order' | 'bill' | 'rule' | 'proposed_rule';
export type SourceName = 'federal_register_eo' | 'congress_bill' | 'federal_register_rule';

export interface RawItem {
  sourceId: string;
  source: SourceName;
  type: ItemType;
  title: string;
  date: Date;
  sourceUrl: string;
  status?: string;
}

export interface AdapterResult {
  source: SourceName;
  items: RawItem[];
  fetchedAt: Date;
  error?: string;
}
