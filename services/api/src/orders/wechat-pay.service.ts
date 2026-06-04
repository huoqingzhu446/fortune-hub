import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  KeyObject,
  X509Certificate,
  createDecipheriv,
  createPrivateKey,
  createSign,
  createVerify,
  randomBytes,
} from 'node:crypto';
import { readFileSync } from 'node:fs';

interface CreateWechatTransactionInput {
  orderNo: string;
  description: string;
  amountFen: number;
  openid: string;
  attach?: string;
}

interface WechatCreateTransactionResponse {
  prepay_id?: string;
}

interface WechatQueryTransactionResponse {
  out_trade_no?: string;
  transaction_id?: string;
  trade_state?: string;
  trade_state_desc?: string;
  success_time?: string;
  payer?: {
    openid?: string;
  };
  amount?: {
    total?: number;
  };
}

interface WechatPayNotificationEnvelope {
  id?: string;
  event_type?: string;
  resource?: {
    algorithm?: string;
    ciphertext?: string;
    associated_data?: string;
    nonce?: string;
  };
}

interface WechatTransactionResource {
  out_trade_no?: string;
  transaction_id?: string;
  trade_state?: string;
  trade_state_desc?: string;
  success_time?: string;
  payer?: {
    openid?: string;
  };
  amount?: {
    total?: number;
  };
}

export interface WechatMiniProgramPaymentParams {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  packageValue: string;
  signType: 'RSA';
  paySign: string;
  prepayId: string;
}

export interface WechatPayTransaction {
  orderNo: string;
  transactionNo: string | null;
  tradeState: string;
  tradeStateDesc: string | null;
  successTime: Date | null;
  amountFen: number | null;
  payerOpenid: string | null;
  notifyId: string | null;
  eventType: string | null;
  raw: unknown;
}

type WechatRequestOptions = {
  method: 'GET' | 'POST';
  path: string;
  body?: Record<string, unknown>;
};

@Injectable()
export class WechatPayService {
  private merchantPrivateKey?: KeyObject;
  private platformCertificate?: X509Certificate;

  constructor(private readonly configService: ConfigService) {}

  async createMiniProgramPayment(
    input: CreateWechatTransactionInput,
  ): Promise<WechatMiniProgramPaymentParams> {
    const response = await this.requestWechatPay<WechatCreateTransactionResponse>({
      method: 'POST',
      path: '/v3/pay/transactions/jsapi',
      body: {
        appid: this.getWechatAppId(),
        mchid: this.getMerchantId(),
        description: input.description,
        out_trade_no: input.orderNo,
        notify_url: this.getNotifyUrl(),
        attach: input.attach,
        amount: {
          total: input.amountFen,
          currency: 'CNY',
        },
        payer: {
          openid: input.openid,
        },
      },
    });

    if (!response.prepay_id) {
      throw new BadGatewayException('微信支付预下单失败，未返回 prepay_id');
    }

    return this.buildMiniProgramPaymentParams(response.prepay_id);
  }

  async queryTransactionByOrderNo(orderNo: string): Promise<WechatPayTransaction> {
    const response = await this.requestWechatPay<WechatQueryTransactionResponse>({
      method: 'GET',
      path: `/v3/pay/transactions/out-trade-no/${encodeURIComponent(
        orderNo,
      )}?mchid=${encodeURIComponent(this.getMerchantId())}`,
    });

    return this.normalizeTransaction({
      orderNo: response.out_trade_no ?? orderNo,
      transactionId: response.transaction_id,
      tradeState: response.trade_state,
      tradeStateDesc: response.trade_state_desc,
      successTime: response.success_time,
      payerOpenid: response.payer?.openid,
      amountFen: response.amount?.total,
      notifyId: null,
      eventType: null,
      raw: response,
    });
  }

  parseNotification(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>,
  ): WechatPayTransaction {
    const timestamp = this.requireHeader(headers, 'wechatpay-timestamp');
    const nonce = this.requireHeader(headers, 'wechatpay-nonce');
    const signature = this.requireHeader(headers, 'wechatpay-signature');
    const message = `${timestamp}\n${nonce}\n${rawBody}\n`;

    if (!this.verifySignature(message, signature)) {
      throw new BadGatewayException('微信支付回调验签失败');
    }

    let payload: WechatPayNotificationEnvelope;
    try {
      payload = JSON.parse(rawBody) as WechatPayNotificationEnvelope;
    } catch {
      throw new BadGatewayException('微信支付回调报文格式错误');
    }

    const resource = payload.resource;
    if (!resource?.ciphertext || !resource?.nonce || !resource.algorithm) {
      throw new BadGatewayException('微信支付回调缺少加密资源');
    }

    if (resource.algorithm !== 'AEAD_AES_256_GCM') {
      throw new BadGatewayException('微信支付回调加密算法不受支持');
    }

    const decrypted = this.decryptNotificationResource({
      ciphertext: resource.ciphertext,
      associated_data: resource.associated_data,
      nonce: resource.nonce,
    });
    let transaction: WechatTransactionResource;
    try {
      transaction = JSON.parse(decrypted) as WechatTransactionResource;
    } catch {
      throw new BadGatewayException('微信支付回调解密内容格式错误');
    }

    return this.normalizeTransaction({
      orderNo: transaction.out_trade_no,
      transactionId: transaction.transaction_id,
      tradeState: transaction.trade_state,
      tradeStateDesc: transaction.trade_state_desc,
      successTime: transaction.success_time,
      payerOpenid: transaction.payer?.openid,
      amountFen: transaction.amount?.total,
      notifyId: payload.id ?? null,
      eventType: payload.event_type ?? null,
      raw: transaction,
    });
  }

  private buildMiniProgramPaymentParams(
    prepayId: string,
  ): WechatMiniProgramPaymentParams {
    const appId = this.getWechatAppId();
    const timeStamp = `${Math.floor(Date.now() / 1000)}`;
    const nonceStr = randomBytes(16).toString('hex');
    const packageValue = `prepay_id=${prepayId}`;
    const signType = 'RSA' as const;
    const paySign = this.signMessage(
      `${appId}\n${timeStamp}\n${nonceStr}\n${packageValue}\n`,
    );

    return {
      appId,
      timeStamp,
      nonceStr,
      packageValue,
      signType,
      paySign,
      prepayId,
    };
  }

  private normalizeTransaction(input: {
    orderNo?: string;
    transactionId?: string;
    tradeState?: string;
    tradeStateDesc?: string;
    successTime?: string;
    payerOpenid?: string;
    amountFen?: number;
    notifyId: string | null;
    eventType: string | null;
    raw: unknown;
  }): WechatPayTransaction {
    if (!input.orderNo?.trim()) {
      throw new BadGatewayException('微信支付结果缺少商户订单号');
    }

    return {
      orderNo: input.orderNo.trim(),
      transactionNo: input.transactionId?.trim() || null,
      tradeState: input.tradeState?.trim() || 'UNKNOWN',
      tradeStateDesc: input.tradeStateDesc?.trim() || null,
      successTime: input.successTime ? new Date(input.successTime) : null,
      amountFen:
        typeof input.amountFen === 'number' && Number.isFinite(input.amountFen)
          ? input.amountFen
          : null,
      payerOpenid: input.payerOpenid?.trim() || null,
      notifyId: input.notifyId,
      eventType: input.eventType,
      raw: input.raw,
    };
  }

  private async requestWechatPay<T>(
    options: WechatRequestOptions,
  ): Promise<T> {
    const bodyText = options.body ? JSON.stringify(options.body) : '';
    const response = await fetch(`https://api.mch.weixin.qq.com${options.path}`, {
      method: options.method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: this.buildAuthorization(
          options.method,
          options.path,
          bodyText,
        ),
        'User-Agent': 'fortune-hub/1.0',
      },
      body: options.method === 'POST' ? bodyText : undefined,
      signal: AbortSignal.timeout(this.getRequestTimeoutMs()),
    });
    const responseText = await response.text();
    const payload = responseText
      ? (this.parseJsonSafely(responseText) as
          | Record<string, unknown>
          | undefined)
      : undefined;

    if (!response.ok) {
      const message =
        this.pickErrorMessage(payload) ||
        `微信支付接口调用失败（HTTP ${response.status}）`;
      throw new BadGatewayException(message);
    }

    return (payload ?? {}) as T;
  }

  private buildAuthorization(
    method: 'GET' | 'POST',
    path: string,
    bodyText: string,
  ) {
    const nonceStr = randomBytes(16).toString('hex');
    const timestamp = `${Math.floor(Date.now() / 1000)}`;
    const message = `${method}\n${path}\n${timestamp}\n${nonceStr}\n${bodyText}\n`;
    const signature = this.signMessage(message);

    return `WECHATPAY2-SHA256-RSA2048 mchid="${this.getMerchantId()}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${this.getMerchantSerialNo()}",signature="${signature}"`;
  }

  private signMessage(message: string) {
    const signer = createSign('RSA-SHA256');
    signer.update(message);
    signer.end();
    return signer.sign(this.getMerchantPrivateKey(), 'base64');
  }

  private verifySignature(message: string, signature: string) {
    const verifier = createVerify('RSA-SHA256');
    verifier.update(message);
    verifier.end();
    return verifier.verify(this.getPlatformCertificate().publicKey, signature, 'base64');
  }

  private decryptNotificationResource(resource: {
    ciphertext: string;
    associated_data?: string;
    nonce: string;
  }) {
    const key = Buffer.from(this.getApiV3Key(), 'utf8');
    if (key.length !== 32) {
      throw new InternalServerErrorException('微信支付 API v3 key 长度必须为 32 字节');
    }

    const ciphertext = Buffer.from(resource.ciphertext, 'base64');
    const authTag = ciphertext.subarray(ciphertext.length - 16);
    const encrypted = ciphertext.subarray(0, ciphertext.length - 16);
    const decipher = createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(resource.nonce, 'utf8'),
    );

    if (resource.associated_data) {
      decipher.setAAD(Buffer.from(resource.associated_data, 'utf8'));
    }
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
  }

  private getMerchantPrivateKey() {
    if (!this.merchantPrivateKey) {
      this.merchantPrivateKey = createPrivateKey(
        this.readPem('WECHAT_PAY_PRIVATE_KEY', 'WECHAT_PAY_PRIVATE_KEY_PATH'),
      );
    }

    return this.merchantPrivateKey;
  }

  private getPlatformCertificate() {
    if (!this.platformCertificate) {
      this.platformCertificate = new X509Certificate(
        this.readPem(
          'WECHAT_PAY_PLATFORM_CERT',
          'WECHAT_PAY_PLATFORM_CERT_PATH',
        ),
      );
    }

    return this.platformCertificate;
  }

  private readPem(valueKey: string, pathKey: string) {
    const inlinePem = this.configService.get<string>(valueKey)?.trim();
    if (inlinePem) {
      return this.normalizePem(inlinePem);
    }

    const pemPath = this.configService.get<string>(pathKey)?.trim();
    if (pemPath) {
      return readFileSync(pemPath, 'utf8');
    }

    throw new InternalServerErrorException(`${valueKey} / ${pathKey} 未配置`);
  }

  private normalizePem(value: string) {
    return value.replace(/\\n/g, '\n');
  }

  private requireHeader(
    headers: Record<string, string | string[] | undefined>,
    key: string,
  ) {
    const value = headers[key];
    if (Array.isArray(value)) {
      const first = value.find(
        (item) => typeof item === 'string' && item.trim().length > 0,
      );
      if (first) {
        return first.trim();
      }
    }

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    throw new BadGatewayException(`微信支付回调缺少请求头 ${key}`);
  }

  private parseJsonSafely(text: string) {
    try {
      return JSON.parse(text);
    } catch {
      return undefined;
    }
  }

  private pickErrorMessage(payload?: Record<string, unknown>) {
    const candidates = [
      payload?.message,
      payload?.errmsg,
      payload?.detail,
      payload?.code,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }

    return '';
  }

  private getWechatAppId() {
    return this.requireConfig('WECHAT_APP_ID');
  }

  private getMerchantId() {
    return this.requireConfig('WECHAT_PAY_MCH_ID');
  }

  private getMerchantSerialNo() {
    return this.requireConfig('WECHAT_PAY_SERIAL_NO');
  }

  private getNotifyUrl() {
    return this.requireConfig('WECHAT_PAY_NOTIFY_URL');
  }

  private getApiV3Key() {
    return this.requireConfig('WECHAT_PAY_API_V3_KEY');
  }

  private getRequestTimeoutMs() {
    const value = Number(
      this.configService.get<string>('WECHAT_PAY_TIMEOUT_MS', '10000'),
    );
    return Number.isFinite(value) && value > 0 ? value : 10000;
  }

  private requireConfig(key: string) {
    const value = this.configService.get<string>(key)?.trim();
    if (!value) {
      throw new InternalServerErrorException(`${key} 未配置`);
    }
    return value;
  }
}
