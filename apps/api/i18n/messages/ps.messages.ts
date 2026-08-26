import type { MessageCode } from './message-codes';

export const ps: Record<MessageCode, string> = {
  AUTH_EMAIL_TAKEN: 'دا بریښنالیک مخکې ثبت شوی دی',
  AUTH_INVALID_CREDENTIALS: 'بریښنالیک یا پټنوم غلط دی',
  AUTH_ACCOUNT_INACTIVE: 'دا حساب فعال نه دی',
  AUTH_USER_NOT_FOUND: 'کارونکی ونه موندل شو',
  AUTH_UNAUTHORIZED: 'تاسو ته اجازه نشته',
  AUTH_SIGNED_UP: 'نوم لیکنه بریالۍ شوه',
  AUTH_SIGNED_OUT: 'له سیسټم څخه ووتلئ',
  VALIDATION_PASSWORD_SHORT: 'پټنوم ډیر لنډ دی',
  VALIDATION_PASSWORD_LONG: 'پټنوم ډیر اوږد دی',
  VALIDATION_PASSWORD_PERSONAL: 'پټنوم باید ستاسو نوم یا بریښنالیک ونه لري',
  VALIDATION_FAILED: 'اعتبار ازموینه پاتې راغله',
  RATE_LIMITED: 'ډیرې غوښتنې ولیږل شوې، لږ صبر وکړئ',
  UPLOAD_MIME_NOT_ALLOWED_FOR_FOLDER: 'دا د فایل ډول د دې پوښې لپاره اجازه نلري',
  ADMIN_CANNOT_MODIFY_SELF: 'تاسو د خپل حساب رول یا فعالیت بدلولی نشئ',
};
