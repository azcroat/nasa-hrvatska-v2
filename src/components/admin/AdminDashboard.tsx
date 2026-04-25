import React, { useEffect, useState } from 'react';
import { H } from '../../data';
import type { AuthUser } from '../../types/index.js';

const ADMIN_EMAILS = ['jschreiner75@gmail.com'];

interface AdminStats {
  users: Array<{ id: string; name?: string; xp?: number; lc?: number; gc?: number }>;
  totalXP: number;
  totalLc: number;
  count: number;
  error?: string;
}

interface AdminDashboardProps {
  authUser: AuthUser | null;
  goBack?: () => void;
}

export default function AdminDashboard({ authUser, goBack }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = authUser && ADMIN_EMAILS.includes(authUser.u);

  useEffect(() => {
    if (!isAdmin) return;
    async function load() {
      try {
        const { getFirestore, collection, getDocs, orderBy, query, limit } =
          await import('firebase/firestore');
        const db = getFirestore();
        const q = query(collection(db, 'profiles'), orderBy('xp', 'desc'), limit(100));
        const snap = await getDocs(q);
        const users = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Record<string, unknown>),
        })) as AdminStats['users'];
        const totalXP = users.reduce((s, u) => s + ((u.xp as number) || 0), 0);
        const totalLc = users.reduce((s, u) => s + ((u.lc as number) || 0), 0);
        setStats({ users, totalXP, totalLc, count: users.length });
      } catch (e) {
        setStats({ users: [], totalXP: 0, totalLc: 0, count: 0, error: (e as Error).message });
      }
      setLoading(false);
    }
    load();
  }, [isAdmin]);

  if (!isAdmin)
    return (
      <div className="scr-wrap">
        {H('🔒 Admin', 'Access restricted', undefined)}
        <p style={{ color: 'var(--subtext)' }}>You do not have admin access.</p>
        {goBack && (
          <button onClick={goBack} className="btn-primary">
            Back
          </button>
        )}
      </div>
    );

  return (
    <div className="scr-wrap" style={{ paddingBottom: 80 }}>
      {H('🛠️ Admin Dashboard', 'Platform overview', undefined)}
      {goBack && (
        <button
          onClick={goBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--subtext)',
            padding: '4px 0 16px',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          ‹ Back
        </button>
      )}

      {loading && <p style={{ color: 'var(--subtext)' }}>Loading…</p>}
      {stats && stats.error && <p style={{ color: '#ef4444' }}>Error: {stats.error}</p>}

      {stats && !stats.error && (
        <React.Fragment>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))',
              gap: 12,
              marginBottom: 28,
            }}
          >
            {[
              { label: 'Total Users', value: stats.count },
              { label: 'Total XP Earned', value: stats.totalXP.toLocaleString() },
              { label: 'Total Lessons', value: stats.totalLc.toLocaleString() },
              {
                label: 'Avg XP / User',
                value: stats.count ? Math.round(stats.totalXP / stats.count).toLocaleString() : 0,
              },
            ].map(({ label, value }) => (
              <div key={label} className="c" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--heading)' }}>
                  {value}
                </div>
                <div
                  style={{ fontSize: 11, color: 'var(--subtext)', fontWeight: 600, marginTop: 4 }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Top Users by XP</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stats.users.slice(0, 20).map((u, i) => (
              <div
                key={u.id}
                className="c"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px' }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: 'var(--subtext)',
                    width: 28,
                    flexShrink: 0,
                  }}
                >
                  #{i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--heading)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {u.name || u.id}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--subtext)' }}>
                    {u.lc || 0} lessons · {u.gc || 0} grammar
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0e7490', flexShrink: 0 }}>
                  {(u.xp || 0).toLocaleString()} XP
                </div>
              </div>
            ))}
          </div>
        </React.Fragment>
      )}
    </div>
  );
}
