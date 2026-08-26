'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { AdminUserListItem, UserRole } from '@repo/contracts';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { useAdminUsers, useSetUserActive, useUpdateUserRole } from '@/hooks/use-user';
import { useSession } from '@/hooks/use-auth';

const ROLES: UserRole[] = ['ADMIN', 'TEACHER', 'STUDENT'];

export function AdminUserListView() {
  const t = useTranslations('admin.users');
  const { user: currentUser } = useSession();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [page, setPage] = useState(1);
  const { data } = useAdminUsers({ search: search || undefined, role: role || undefined, page });
  const updateRole = useUpdateUserRole();
  const setActive = useSetUserActive();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder={t('search')}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <Select
          value={role}
          onChange={(event) => {
            /* `<option value>` ro'yxati pastda `ROLES`dan generatsiya qilinadi, shuning uchun qiymat doim shu union'ga mos. */
            setRole(event.target.value as UserRole | '');
            setPage(1);
          }}
          className="max-w-48"
        >
          <option value="">{t('allRoles')}</option>
          {ROLES.map((item) => (
            <option key={item} value={item}>
              {t(`role.${item}`)}
            </option>
          ))}
        </Select>
      </div>

      {!data?.data.length ? (
        <p className="text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {data.data.map((item) => (
            <UserRow
              key={item.id}
              user={item}
              isSelf={item.id === currentUser?.id}
              onRoleChange={(nextRole) => updateRole.mutate({ userId: item.id, input: { role: nextRole } })}
              onActiveToggle={() => setActive.mutate({ userId: item.id, input: { active: !item.active } })}
            />
          ))}
        </div>
      )}

      {data && <Pagination page={page} total={data.meta.total} limit={data.meta.limit} onPageChange={setPage} />}
    </div>
  );
}

// interfaces

interface UserRowProps {
  user: AdminUserListItem;
  isSelf: boolean;
  onRoleChange: (role: UserRole) => void;
  onActiveToggle: () => void;
}

function UserRow({ user, isSelf, onRoleChange, onActiveToggle }: UserRowProps) {
  const t = useTranslations('admin.users');

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate font-medium">{user.fullName}</p>
        <p className="truncate text-sm text-muted-foreground">{user.email}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {/* `<option value>` ro'yxati pastda `ROLES`dan generatsiya qilinadi, shuning uchun qiymat doim shu union'ga mos. */}
        <Select value={user.role} disabled={isSelf} onChange={(event) => onRoleChange(event.target.value as UserRole)} className="w-36">
          {ROLES.map((item) => (
            <option key={item} value={item}>
              {t(`role.${item}`)}
            </option>
          ))}
        </Select>
        <Badge variant={user.active ? 'success' : 'danger'}>{user.active ? t('active') : t('inactive')}</Badge>
        <Button size="sm" variant="outline" disabled={isSelf} onClick={onActiveToggle}>
          {user.active ? t('deactivate') : t('activate')}
        </Button>
      </div>
    </div>
  );
}
