import type { MessageCode } from './message-codes';

export const ru: Record<MessageCode, string> = {
  AUTH_EMAIL_TAKEN: 'Этот email уже зарегистрирован',
  AUTH_INVALID_CREDENTIALS: 'Неверный email или пароль',
  AUTH_ACCOUNT_INACTIVE: 'Этот аккаунт неактивен',
  AUTH_USER_NOT_FOUND: 'Пользователь не найден',
  AUTH_UNAUTHORIZED: 'Нет доступа',
  AUTH_SIGNED_UP: 'Регистрация прошла успешно',
  AUTH_SIGNED_OUT: 'Вы вышли из системы',
  VALIDATION_PASSWORD_SHORT: 'Пароль слишком короткий',
  VALIDATION_PASSWORD_LONG: 'Пароль слишком длинный',
  VALIDATION_PASSWORD_PERSONAL: 'Пароль не должен содержать ваше имя или email',
  VALIDATION_FAILED: 'Проверка не пройдена',
  RATE_LIMITED: 'Слишком много запросов, подождите немного',
  UPLOAD_MIME_NOT_ALLOWED_FOR_FOLDER: 'Этот тип файла не разрешён для данной папки',
  ADMIN_CANNOT_MODIFY_SELF: 'Вы не можете изменить роль или активность своей учётной записи',
};
