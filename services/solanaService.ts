
// Lightweight RPC wrapper for Helius
const RPC_URL = "https://mainnet.helius-rpc.com/?api-key=d9624bda-9e10-4529-ba1d-b1c01710799f";

export interface OnChainData {
  exists: boolean;
  owner?: string;
  executable?: boolean;
  lamports?: number;
  program?: string;
}

export const checkAddressOnChain = async (address: string): Promise<OnChainData> => {
  try {
    const response = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getAccountInfo",
        params: [
          address,
          { encoding: "jsonParsed" }
        ]
      })
    });

    const data = await response.json();

    if (!data.result || !data.result.value) {
      return { exists: false };
    }

    const info = data.result.value;
    
    return {
      exists: true,
      owner: info.owner,
      executable: info.executable,
      lamports: info.lamports,
      program: info.owner === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" ? "SPL Token" : "Unknown Program"
    };

  } catch (error) {
    console.error("RPC Error:", error);
    return { exists: false };
  }
};
