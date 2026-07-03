// Client-facing department registry — single source of truth for the
// "two-layered" mobile nav (2026-07-03):
//   Layer 1: bottom nav — always the same 4 department icons, lets a client
//            jump straight to any department from anywhere in the app.
//   Layer 2: once inside a department's pages, the sidebar/drawer becomes
//            scoped to that department's own sub-pages instead of the flat
//            global menu — like walking into that department's own "mini
//            app". AppLayout.jsx reads this to decide what to render.
//
// Add a new department page by adding it to the right department's subNav
// here — don't hardcode nav arrays elsewhere.

import { Megaphone, Facebook, Users, Target, Palette, Clapperboard, Code2 } from 'lucide-react';

export const CLIENT_DEPARTMENTS = [
  {
    key: 'ads',
    label: 'Ads',
    icon: Megaphone,
    homePath: '/campaigns',
    // Any pathname starting with one of these belongs to the Ads department.
    matchPaths: ['/campaigns', '/pages', '/audiences', '/leads'],
    subNav: [
      { path: '/campaigns', label: 'Campaigns',               icon: Megaphone },
      { path: '/pages',     label: 'Facebook Pages',          icon: Facebook },
      { path: '/audiences', label: 'Audiences',               icon: Users },
      { path: '/leads',     label: 'Leads (Coming Soon)',     icon: Target, disabled: true },
    ],
  },
  {
    key: 'designs',
    label: 'Designs',
    icon: Palette,
    homePath: '/designs',
    matchPaths: ['/designs'],
    subNav: [
      { path: '/designs', label: 'My Designs', icon: Palette },
    ],
  },
  {
    key: 'studios',
    label: 'Studios',
    icon: Clapperboard,
    homePath: '/studios',
    matchPaths: ['/studios', '/ugc-ads'],
    subNav: [
      { path: '/studios', label: 'My Orders', icon: Clapperboard },
    ],
  },
  {
    key: 'dev_studio',
    label: 'Dev Studio',
    icon: Code2,
    homePath: '/dev-studio',
    matchPaths: ['/dev-studio'],
    subNav: [
      { path: '/dev-studio', label: 'My Projects', icon: Code2 },
    ],
  },
];

// Returns the department object whose matchPaths cover the given pathname,
// or undefined if the pathname isn't inside any department (e.g. /dashboard).
export function findActiveDepartment(pathname) {
  return CLIENT_DEPARTMENTS.find(d =>
    d.matchPaths.some(p => pathname === p || pathname.startsWith(p + '/'))
  );
}
