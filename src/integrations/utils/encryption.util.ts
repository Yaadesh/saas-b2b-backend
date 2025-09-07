import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export class EncryptionUtil {
  private static readonly algorithm = 'aes-256-cbc';

  /**
   * Encrypt sensitive data for storage
   */
  static encrypt(text: string, configService: ConfigService): string {
    const secretKey = configService.get<string>('ENCRYPTION_KEY') || 'default-key-32-chars-long-needed!!';
    const key = crypto.scryptSync(secretKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedText: string, configService: ConfigService): string {
    const secretKey = configService.get<string>('ENCRYPTION_KEY') || 'default-key-32-chars-long-needed!!';
    const key = crypto.scryptSync(secretKey, 'salt', 32);
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Encrypt an object with sensitive fields
   */
  static encryptObject(obj: Record<string, any>, sensitiveFields: string[], configService: ConfigService): Record<string, any> {
    const encrypted = { ...obj };
    
    for (const field of sensitiveFields) {
      if (encrypted[field]) {
        encrypted[field] = this.encrypt(encrypted[field], configService);
      }
    }
    
    return encrypted;
  }

  /**
   * Decrypt an object with sensitive fields
   */
  static decryptObject(obj: Record<string, any>, sensitiveFields: string[], configService: ConfigService): Record<string, any> {
    const decrypted = { ...obj };
    
    for (const field of sensitiveFields) {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        try {
          decrypted[field] = this.decrypt(decrypted[field], configService);
        } catch (error) {
          // Field might not be encrypted, leave as is
        }
      }
    }
    
    return decrypted;
  }
}