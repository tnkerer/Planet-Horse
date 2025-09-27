import { BrowserProvider, Contract, getAddress } from 'ethers';

export const BURN_ADDR = getAddress('0x000000000000000000000000000000000000dEaD');
const ERC721_V1 = getAddress('0x66eeb20a1957c4b3743ecad19d0c2dbcf56b683f'); // 1..2202
const ERC721_V2 = getAddress('0x1296ffefc43ff7eb4b7617c02ef80253db905215'); // 2203+

export function getRoninProvider(): BrowserProvider {
  const ronin = (window as any).ronin;
  if (!ronin?.provider) {
    throw new Error('Ronin wallet not detected. Please install & connect your Ronin wallet.');
  }
  return new BrowserProvider(ronin.provider);
}

export async function burnHorseToken(tokenId: number) {
  const provider = getRoninProvider();
  const signer = await provider.getSigner();
  const from = await signer.getAddress();

  const nftAddress = tokenId >= 1 && tokenId <= 2202 ? ERC721_V1 : ERC721_V2;
  const ERC721_ABI = ['function safeTransferFrom(address from, address to, uint256 tokenId)'];
  const nft = new Contract(nftAddress, ERC721_ABI, signer);

  const tx = await nft.safeTransferFrom(from, BURN_ADDR, tokenId);
  await tx.wait();
  return tx.hash as string;
}
