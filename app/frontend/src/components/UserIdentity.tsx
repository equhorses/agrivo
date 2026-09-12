import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import { createClient } from '@/lib/atomsClient';

const client = createClient();

interface UserIdentityProps {
  userId: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Muestra el avatar (o icono por defecto) y el nombre de cualquier usuario a
 * partir de su id — usado para "publicado por" en un trabajo, o el nombre de
 * quien puja. Si esa persona tiene un perfil profesional público, todo el
 * bloque enlaza a su página de perfil; si no (por ejemplo, un cliente que
 * solo publica trabajos y no tiene perfil profesional), se muestra igual
 * pero sin enlace, porque no hay a dónde llevar todavía.
 */
export default function UserIdentity({ userId, size = 'md', className = '' }: UserIdentityProps) {
  const [info, setInfo] = useState<{ name?: string; avatar_url?: string } | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    client.apiCall.invoke(`/api/v1/users/${userId}/public`, {}, 'GET')
      .then((res) => { if (!cancelled) setInfo(res?.data || null); })
      .catch(() => {});

    client.entities.profiles.queryAll({ query: { user_id: userId }, limit: 1 })
      .then((res) => {
        const profile = res?.data?.items?.[0];
        if (!cancelled && profile) setProfileId(profile.id);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [userId]);

  const avatarSize = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';
  const textSize = size === 'sm' ? 'text-sm' : 'text-sm font-medium';
  const name = info?.name || 'Usuario';

  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      {info?.avatar_url ? (
        <img src={info.avatar_url} alt={name} className={`${avatarSize} rounded-full object-cover shrink-0`} />
      ) : (
        <div className={`${avatarSize} rounded-full bg-emerald-100 flex items-center justify-center shrink-0`}>
          <User className="h-4 w-4 text-emerald-700" />
        </div>
      )}
      <span className={textSize}>{name}</span>
    </div>
  );

  if (profileId) {
    return (
      <Link to={`/pros/${profileId}`} className="hover:opacity-80 transition-opacity cursor-pointer">
        {content}
      </Link>
    );
  }
  return content;
}
