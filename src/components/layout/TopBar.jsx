import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, User, Settings, LogOut, Wallet, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { base44 } from '@/api/base44Client';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import BrandLogo from '@/components/BrandLogo';

export default function TopBar({ onMenuToggle, currentUser, isStaff }) {
  const initials = currentUser?.full_name
    ? currentUser.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (currentUser?.email?.[0] || 'U').toUpperCase();

  return (
    <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-border bg-card flex-shrink-0 z-30">
      {/* Left: hamburger + logo (mobile) */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="lg:hidden">
          <img
            src="https://media.base44.com/images/public/6a1df082a0de66cf554f8fdd/eeb543716_file_0000000024d0722fa20034e2dedcbc9e.png"
            alt="Brandfletch Ads"
            className="w-7 h-7 rounded-xl object-contain"
          />
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1 ml-auto">
        {/* New campaign CTA for clients */}
        {!isStaff && (
          <Link to="/campaigns/new" className="hidden sm:block mr-2">
            <Button size="sm" className="bg-[hsl(var(--accent))] hover:bg-[hsl(217,91%,48%)] text-white font-semibold text-xs h-8 px-3 gap-1.5">
              + New Campaign
            </Button>
          </Link>
        )}

        {/* Notifications */}
        <NotificationDropdown />

        {/* Profile menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-secondary transition-colors ml-1">
              <div className="w-7 h-7 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="hidden sm:block text-left max-w-[120px]">
                <p className="text-xs font-semibold truncate leading-tight">{currentUser?.full_name || 'Account'}</p>
                <p className="text-[10px] text-muted-foreground truncate leading-tight">{currentUser?.email}</p>
              </div>
              <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="pb-1">
              <p className="font-semibold text-sm truncate">{currentUser?.full_name || 'Account'}</p>
              <p className="text-xs text-muted-foreground font-normal truncate">{currentUser?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings className="w-4 h-4 text-muted-foreground" /> Profile & Settings
              </Link>
            </DropdownMenuItem>
            {!isStaff && (
              <DropdownMenuItem asChild>
                <Link to="/wallet" className="flex items-center gap-2 cursor-pointer">
                  <Wallet className="w-4 h-4 text-muted-foreground" /> Wallet
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive gap-2 cursor-pointer"
              onClick={() => base44.auth.logout()}
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}