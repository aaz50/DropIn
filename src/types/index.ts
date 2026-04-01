export type ArticleSummary = {
  id: string;
  title: string;
  preview: string;
  priceXrp: number;
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
  articleId: string;
  articleTitle: string;
  readerAddress: string;
  createdAt: string;
};
