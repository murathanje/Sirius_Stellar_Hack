import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { StellarService } from '@/lib/stellar-service';
import PasskeyWallet from '@yuesth/passkey-wallet-stellar';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, activeWallet } = await req.json();

  const result = await streamText({
    model: google('models/gemini-2.0-flash'),
    messages,
    tools: {
      checkBalance: tool({
        description: 'Bir Stellar adresinin bakiyesini kontrol et',
        parameters: z.object({
          stellarAddress: z.string().describe('Kontrol edilecek Stellar adresi (G ile başlayan 56 karakter)'),
        }),
        execute: async ({ stellarAddress }) => {
          try {
            if (!StellarService.isValidStellarAddress(stellarAddress)) {
              return { error: 'Geçersiz Stellar adresi formatı. Adres G ile başlamalı ve 56 karakter olmalı.' };
            }

            const balances = await StellarService.getBalance(stellarAddress);
            const formattedBalance = StellarService.formatBalance(balances);
            
            return {
              success: true,
              address: stellarAddress,
              balances: formattedBalance,
              details: balances
            };
          } catch (error: any) {
            return { 
              error: error.message || 'Bakiye sorgulanırken hata oluştu',
              address: stellarAddress 
            };
          }
        },
      }),
      
      transferToken: tool({
        description: 'Bir Stellar adresine token transfer et. Dikkat: Bu işlem gerçek bir transfer yapar ve passkey onayı gerektirir!',
        parameters: z.object({
          recipientAddress: z.string().describe('Alıcının Stellar adresi'),
          amount: z.string().describe('Transfer edilecek miktar'),
          assetCode: z.string().optional().describe('Token kodu (XLM için boş bırak)'),
          assetIssuer: z.string().optional().describe('Token çıkarıcısı (XLM için boş bırak)'),
          confirmTransfer: z.boolean().describe('Transfer onayı (kullanıcı onayladıysa true)'),
        }),
        execute: async ({ recipientAddress, amount, assetCode, assetIssuer, confirmTransfer }) => {
          if (!confirmTransfer) {
            return {
              requiresConfirmation: true,
              message: `⚠️ ONAY GEREKLİ: ${amount} ${assetCode || 'XLM'} transferini ${recipientAddress} adresine yapmak istediğinizi onaylıyor musunuz? Bu işlem gerçek para transferidir ve geri alınamaz!`,
              details: {
                recipient: recipientAddress,
                amount,
                asset: assetCode || 'XLM',
                warning: 'Bu işlem gerçek bir blockchain transferidir. Onayladıktan sonra passkey doğrulaması yapılacaktır.'
              }
            };
          }

          // Transfer işlemini gerçekleştir
          if (!activeWallet) {
            return {
              error: 'Transfer yapabilmek için giriş yapmış olmanız gerekiyor.',
              message: 'Lütfen önce wallet\'ınızla giriş yapın.'
            };
          }

          try {
            if (!StellarService.isValidStellarAddress(recipientAddress)) {
              return {
                error: 'Geçersiz Stellar adresi formatı.',
                message: 'Lütfen geçerli bir Stellar adresi girin (G ile başlayan 56 karakter).'
              };
            }

            // Passkey authentication için wallet oluştur
            const PARENT_SECRET_KEY = process.env.NEXT_PUBLIC_PARENT_SECRET_KEY;
            if (!PARENT_SECRET_KEY) {
              return {
                error: 'Sistem yapılandırma hatası.',
                message: 'Parent secret key bulunamadı.'
              };
            }

            const wallet = new PasskeyWallet('testnet', PARENT_SECRET_KEY, 'base-phrase-for-app');
            
            // Bu kısım client-side'da çalışması gerekiyor çünkü passkey browser API'si gerekiyor
            return {
              requiresPasskeyAuth: true,
              message: `🔐 Transfer işlemi için passkey doğrulaması gerekiyor. Bu işlem browser'da gerçekleştirilecek.`,
              transferDetails: {
                from: activeWallet.address,
                to: recipientAddress,
                amount: amount,
                asset: assetCode || 'XLM',
                walletName: activeWallet.name
              },
              instructions: 'Ana sayfadaki transfer formunu kullanarak bu işlemi güvenli şekilde tamamlayabilirsiniz.'
            };

          } catch (error: any) {
            console.error('Transfer preparation error:', error);
            return {
              error: 'Transfer hazırlığında hata oluştu.',
              message: error.message || 'Bilinmeyen bir hata oluştu.',
              suggestion: 'Ana sayfadaki transfer formunu kullanmayı deneyin.'
            };
          }
        },
      }),
    },
    system: `Sen Stellar blockchain ağında çalışan bir AI asistanısın. Kullanıcılara Stellar token'ları ile ilgili yardım ediyorsun.

${activeWallet ? `
KULLANICI BİLGİLERİ:
- Kullanıcının Wallet Adı: ${activeWallet.name}
- Kullanıcının Stellar Adresi: ${activeWallet.address}

Kullanıcı "benim adresim", "hesabım", "cüzdanım", "bakiyem" gibi ifadeler kullandığında yukarıdaki bilgileri kullan.
` : ''}

Yeteneklerin:
1. Stellar adreslerinin bakiyesini kontrol etmek
2. Token transfer işlemlerinde rehberlik etmek
3. Stellar blockchain hakkında bilgi vermek

Kurallar:
- Stellar adresleri G ile başlar ve 56 karakter uzunluğundadır
- Transfer işlemleri gerçek para işlemleridir, dikkatli ol
- Kullanıcıdan private key isteme, güvenlik nedeniyle ana sayfadaki wallet arayüzünü öner
- Türkçe cevap ver
- Dostça ve yardımsever ol
- Kullanıcı kendi wallet'ını kastederken yukarıdaki bilgileri kullan

Örnek Stellar adresi formatı: GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
  });

  return result.toDataStreamResponse();
} 