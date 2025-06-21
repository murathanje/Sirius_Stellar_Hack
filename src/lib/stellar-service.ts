import { Horizon, TransactionBuilder, Operation, Networks, Asset, Keypair } from '@stellar/stellar-sdk';

const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const server = new Horizon.Server(HORIZON_URL);

export interface BalanceInfo {
  balance: string;
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
}

export interface TransferResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export class StellarService {
  static async getBalance(publicKey: string): Promise<BalanceInfo[]> {
    try {
      const account = await server.loadAccount(publicKey);
      return account.balances.map(balance => ({
        balance: balance.balance,
        asset_type: balance.asset_type,
        asset_code: balance.asset_code,
        asset_issuer: balance.asset_issuer,
      }));
    } catch (error) {
      console.error('Balance fetch error:', error);
      throw new Error('Bakiye alınamadı. Geçerli bir Stellar adres girdiğinizden emin olun.');
    }
  }

  static formatBalance(balances: BalanceInfo[]): string {
    if (balances.length === 0) {
      return 'Bu hesapta bakiye bulunamadı.';
    }

    return balances.map(balance => {
      if (balance.asset_type === 'native') {
        return `${parseFloat(balance.balance).toLocaleString()} XLM`;
      } else {
        return `${parseFloat(balance.balance).toLocaleString()} ${balance.asset_code}`;
      }
    }).join(', ');
  }

  static isValidStellarAddress(address: string): boolean {
    try {
      // Basic validation for Stellar public key format
      return address.length === 56 && address.startsWith('G');
    } catch {
      return false;
    }
  }

  static async transferToken(
    sourceSecretKey: string,
    destinationAddress: string,
    amount: string,
    assetCode?: string,
    assetIssuer?: string
  ): Promise<TransferResult> {
    try {
      if (!this.isValidStellarAddress(destinationAddress)) {
        throw new Error('Geçersiz Stellar adresi');
      }

      const sourceKeyPair = Keypair.fromSecret(sourceSecretKey);
      const sourceAccount = await server.loadAccount(sourceKeyPair.publicKey());

      const asset = assetCode && assetIssuer 
        ? new Asset(assetCode, assetIssuer)
        : Asset.native();

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: await server.fetchBaseFee().then(fee => fee.toString()),
        networkPassphrase: Networks.TESTNET,
      })
      .addOperation(Operation.payment({
        destination: destinationAddress,
        asset: asset,
        amount: amount,
      }))
      .setTimeout(30)
      .build();

      transaction.sign(sourceKeyPair);
      const result = await server.submitTransaction(transaction);

      return {
        success: true,
        transactionHash: result.hash
      };
    } catch (error: any) {
      console.error('Transfer error:', error);
      return {
        success: false,
        error: error.message || 'Transfer işlemi başarısız oldu'
      };
    }
  }
} 