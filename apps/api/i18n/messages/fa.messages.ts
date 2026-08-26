import type { MessageCode } from './message-codes';

export const fa: Record<MessageCode, string> = {
  AUTH_EMAIL_TAKEN: 'این ایمیل قبلاً ثبت‌نام شده است',
  AUTH_INVALID_CREDENTIALS: 'ایمیل یا رمز عبور نادرست است',
  AUTH_ACCOUNT_INACTIVE: 'این حساب فعال نیست',
  AUTH_USER_NOT_FOUND: 'کاربر یافت نشد',
  AUTH_UNAUTHORIZED: 'اجازه دسترسی ندارید',
  AUTH_SIGNED_UP: 'ثبت‌نام با موفقیت انجام شد',
  AUTH_SIGNED_OUT: 'از سیستم خارج شدید',
  VALIDATION_PASSWORD_SHORT: 'رمز عبور بسیار کوتاه است',
  VALIDATION_PASSWORD_LONG: 'رمز عبور بسیار طولانی است',
  VALIDATION_PASSWORD_PERSONAL: 'رمز عبور نباید نام یا ایمیل شما را شامل شود',
  VALIDATION_FAILED: 'اعتبارسنجی ناموفق بود',
  RATE_LIMITED: 'درخواست‌های زیاد ارسال شد، کمی صبر کنید',
  UPLOAD_MIME_NOT_ALLOWED_FOR_FOLDER: 'این نوع فایل برای این پوشه مجاز نیست',
  ADMIN_CANNOT_MODIFY_SELF: 'نمی‌توانید نقش یا وضعیت فعال بودن حساب خودتان را تغییر دهید',
};
