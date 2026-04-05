export type ArticleSummary = {
  id: string;
  title: string;
  preview: string;
  price: number;
  currency: string;
  issuer?: string;
  publisherName: string;
  publisherId: string;
  createdAt: string;
};

export type ArticleFull = ArticleSummary & {
  content: string;
};

export type PublisherProfile = {
  id: string;
  name: string;
  walletAddress: string;
  description: string | null;
  createdAt: string;
};

export type PaymentRecord = {
  id: string;
  txHash: string;
  amount: number;
  currency: string;
  articleId: string;
  articleTitle: string;
  readerAddress: string;
  createdAt: string;
};
