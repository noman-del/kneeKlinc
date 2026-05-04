import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Stethoscope, User, LogOut, Sun, Moon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-surface/90 backdrop-blur-md border-b border-bd sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 bg-ac rounded-lg flex items-center justify-center transition-colors duration-200 group-hover:bg-ac-hover">
              <Stethoscope className="text-primary-foreground w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-th tracking-tight">KneeKlinic</h1>
              <p className="text-[11px] text-tm leading-none">AI-Powered Knee Care</p>
            </div>
          </Link>

          <nav className="flex items-center space-x-1">
            {!isAuthenticated ? (
              <>
                <button onClick={() => setLocation("/about")} className="px-3 py-2 text-sm text-tm hover:text-th transition-colors duration-200 rounded-md hover:bg-surface-alt">
                  About
                </button>
                <button onClick={() => setLocation("/features")} className="px-3 py-2 text-sm text-tm hover:text-th transition-colors duration-200 rounded-md hover:bg-surface-alt">
                  Features
                </button>
                <button onClick={() => setLocation("/contact")} className="px-3 py-2 text-sm text-tm hover:text-th transition-colors duration-200 rounded-md hover:bg-surface-alt">
                  Contact
                </button>
                <button onClick={toggleTheme} className="p-2 text-tm hover:text-th transition-colors duration-200 rounded-md hover:bg-surface-alt ml-1" aria-label="Toggle theme">
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <div className="flex items-center space-x-2 ml-3">
                  <Button variant="ghost" onClick={() => setLocation("/login")} data-testid="button-signin" className="px-4 py-2 text-sm text-ts hover:text-th border border-bd hover:border-bs transition-colors duration-200">
                    Sign In
                  </Button>
                  <Button onClick={() => setLocation("/signup")} data-testid="button-signup" className="px-4 py-2 text-sm bg-ac hover:bg-ac-hover text-primary-foreground font-medium transition-colors duration-200">
                    Sign Up
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-1">
                  {user?.userType !== "admin" && (
                    <>
                      <button onClick={() => setLocation("/about")} className="px-3 py-2 text-sm text-tm hover:text-th transition-colors duration-200 rounded-md hover:bg-surface-alt hidden md:block">
                        About
                      </button>
                      <button onClick={() => setLocation("/features")} className="px-3 py-2 text-sm text-tm hover:text-th transition-colors duration-200 rounded-md hover:bg-surface-alt hidden md:block">
                        Features
                      </button>
                      <button onClick={() => setLocation("/contact")} className="px-3 py-2 text-sm text-tm hover:text-th transition-colors duration-200 rounded-md hover:bg-surface-alt hidden md:block">
                        Contact
                      </button>
                      <button onClick={() => setLocation("/community")} className="px-3 py-2 text-sm text-tm hover:text-th transition-colors duration-200 rounded-md hover:bg-surface-alt hidden md:block">
                        Community
                      </button>
                    </>
                  )}

                  <button onClick={toggleTheme} className="p-2 text-tm hover:text-th transition-colors duration-200 rounded-md hover:bg-surface-alt ml-1" aria-label="Toggle theme">
                    {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2 text-ts hover:text-th border border-bd hover:border-bs transition-colors duration-200 ml-2 rounded-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${user?.profileImageUrl ? "bg-transparent" : "bg-surface-alt"}`}>{user?.profileImageUrl ? <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover rounded-full" /> : <User className="w-4 h-4 text-ts" />}</div>
                        <div className="text-left hidden sm:block">
                          <div className="font-medium text-th text-sm leading-tight">{user?.firstName || "User"}</div>
                          <div className="text-xs text-ac-text capitalize leading-tight">{user?.userType}</div>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={8} className="w-56 bg-surface border border-bd shadow-xl rounded-lg z-[60]">
                      <DropdownMenuLabel className="p-3">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium text-th">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email}</p>
                          <p className="text-xs text-tm">{user?.email}</p>
                          <div className="flex items-center space-x-1.5 pt-0.5">
                            <div className="w-1.5 h-1.5 bg-ac rounded-full"></div>
                            <p className="text-xs text-ac-text capitalize font-medium">{user?.userType}</p>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-bd" />
                      {user?.userType !== "admin" && (
                        <>
                          <DropdownMenuItem onClick={() => setLocation("/profile")} className="text-ts hover:text-th hover:bg-surface-alt focus:bg-surface-alt transition-colors duration-150 mx-1 rounded-md cursor-pointer">
                            <User className="mr-2 h-4 w-4 text-ac" />
                            <span>Profile</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-bd mx-1" />
                        </>
                      )}
                      <DropdownMenuItem onClick={logout} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 transition-colors duration-150 mx-1 rounded-md cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
