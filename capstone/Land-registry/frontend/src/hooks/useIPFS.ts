import { useQuery } from "@tanstack/react-query";

export interface IPFSMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: { trait_type: string; value: string | number }[];
}

export function useIPFS(metadataURI?: string) {
  return useQuery<IPFSMetadata | null>({
    queryKey: ["ipfs", metadataURI],
    queryFn: async () => {
      if (!metadataURI) return null;
      
      // We only try to fetch if it's a valid IPFS link
      if (!metadataURI.startsWith("ipfs://")) {
        console.warn("Invalid IPFS URI:", metadataURI);
        return null;
      }

      const gatewayUrl = metadataURI.replace("ipfs://", "https://ipfs.io/ipfs/");
      const response = await fetch(gatewayUrl);
      
      if (!response.ok) {
        throw new Error("Failed to fetch IPFS metadata");
      }
      
      const data: IPFSMetadata = await response.json();
      return data;
    },
    enabled: !!metadataURI,
    staleTime: Infinity, // IPFS data is immutable, no need to refetch
  });
}
