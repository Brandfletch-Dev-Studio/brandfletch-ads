import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mobile bottom nav for the AUTHENTICATED app shell — shown to business
// clients, admins, and every staff role (designer, COD, ads manager, etc).
// AppLayout already computes the correct role-scoped `navItems` for the
// desktop sidebar; this just surfaces the first 4 as quick-access icons and
// opens the full sidebar for everything else via "More".
export default function AppBottomNav({ navItems, activePath, onMore }) {
  const items = (navItems || []).filter(item => !item.disabled).slice(0, 4);

  // Department items carry `matchPaths` (see clientDepartments.js) so the
  // icon stays highlighted across every page inside that department, not
  // just its literal home path — e.g. Ads stays active while on Facebook
  // Pages or Audiences, both "inside" the Ads department.
  const isActive = (item) =>
    item.path === '/admin'
      ? activePath === '/admin'
      : (item.matchPaths || [item.path]).some(p => activePath === p || activePath.startsWith(p + '/'));

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[hsl(var(--sidebar-background))] border-t border-[hsl(var(--sidebar-border))] safe-area-bottom z-50">
      <nav className="grid h-16" style={{ gridTemplateColumns: `repeat(${items.length + 1}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const { path, label, icon: Icon } = item;
          const active = isActive(item);
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                active
                  ? "text-[hsl(var(--sidebar-primary))]"
                  : "text-[hsl(var(--sidebar-foreground))]/50 hover:text-[hsl(var(--sidebar-foreground))]/80"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium truncate max-w-[64px]">{label}</span>
            </Link>
          );
        })}

        <button
          onClick={onMore}
          className="flex flex-col items-center justify-center gap-1 text-[hsl(var(--sidebar-foreground))]/50 hover:text-[hsl(var(--sidebar-foreground))]/80 transition-colors"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </div>
  );
}
