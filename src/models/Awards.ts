export interface Award {
  name: string;
  title?: string;
  issuer?: string;
  summary?: string;
  year?: number;
}

export interface AwardsData {
  items: Award[];
}

export default Award;
