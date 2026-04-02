import type { PublisherProfile } from "@/types";

type PublisherRow = {
  id: string;
  name: string;
  walletAddress: string;
  description: string | null;
  createdAt: Date;
};

export function toPublisherProfile(publisher: PublisherRow): PublisherProfile {
  return {
    id: publisher.id,
    name: publisher.name,
    walletAddress: publisher.walletAddress,
    description: publisher.description,
    createdAt: publisher.createdAt.toISOString(),
  };
}
