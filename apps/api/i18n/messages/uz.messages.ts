import type { MessageCode } from './message-codes';

export const uz: Record<MessageCode, string> = {
  AUTH_EMAIL_TAKEN: 'Bu email allaqachon ro\'yxatdan o\'tgan',
  AUTH_INVALID_CREDENTIALS: 'Email yoki parol noto\'g\'ri',
  AUTH_ACCOUNT_INACTIVE: 'Bu hisob faol emas',
  AUTH_USER_NOT_FOUND: 'Foydalanuvchi topilmadi',
  AUTH_UNAUTHORIZED: 'Ruxsat yo\'q',
  AUTH_SIGNED_UP: 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz',
  AUTH_SIGNED_OUT: 'Tizimdan chiqdingiz',
  VALIDATION_PASSWORD_SHORT: 'Parol juda qisqa',
  VALIDATION_PASSWORD_LONG: 'Parol juda uzun',
  VALIDATION_PASSWORD_PERSONAL: 'Parol ismingiz yoki emailingizni o\'z ichiga olmasligi kerak',
  VALIDATION_FAILED: 'Tekshiruvdan o\'tmadi',
  RATE_LIMITED: 'Juda ko\'p so\'rov yuborildi, biroz kuting',
  UPLOAD_MIME_NOT_ALLOWED_FOR_FOLDER: 'Bu fayl turiga ushbu papkada ruxsat berilmagan',
  ADMIN_CANNOT_MODIFY_SELF: 'O\'z hisobingizning rolini yoki faolligini o\'zgartira olmaysiz',
};
