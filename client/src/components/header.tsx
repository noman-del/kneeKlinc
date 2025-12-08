import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Stethoscope, User, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  return (
    <header className="bg-slate-900/95 backdrop-blur-lg shadow-2xl border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-xl group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-110">
              <Stethoscope className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors duration-300">JointSense AI</h1>
              <p className="text-xs text-slate-300">Knee Osteoarthritis Management</p>
            </div>
          </Link>

          <nav className="flex items-center space-x-6">
            {!isAuthenticated ? (
              <>
                <button onClick={() => setLocation("/about")} className="relative px-4 py-2 text-slate-300 hover:text-white transition-all duration-300 group">
                  <span className="relative z-10">About</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-emerald-400 group-hover:w-full group-hover:left-0 transition-all duration-300"></div>
                </button>
                <button onClick={() => setLocation("/features")} className="relative px-4 py-2 text-slate-300 hover:text-white transition-all duration-300 group">
                  <span className="relative z-10">Features</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-emerald-400 group-hover:w-full group-hover:left-0 transition-all duration-300"></div>
                </button>
                <button onClick={() => setLocation("/contact")} className="relative px-4 py-2 text-slate-300 hover:text-white transition-all duration-300 group">
                  <span className="relative z-10">Contact</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-emerald-400 group-hover:w-full group-hover:left-0 transition-all duration-300"></div>
                </button>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    onClick={() => setLocation("/login")}
                    data-testid="button-signin"
                    className="relative px-6 py-2 text-white font-semibold bg-gradient-to-r from-slate-700 to-slate-600 hover:from-emerald-600 hover:to-blue-600 border-2 border-emerald-400/60 hover:border-emerald-300 backdrop-blur-sm transition-all duration-300 group overflow-hidden shadow-xl hover:shadow-emerald-400/50 transform hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-all duration-300"></div>
                    <span className="relative z-10 drop-shadow-lg group-hover:text-white transition-colors duration-300">Sign In</span>
                  </Button>
                  <Button onClick={() => setLocation("/signup")} data-testid="button-signup" className="relative px-6 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-semibold shadow-xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105 group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10">Sign Up</span>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-6">
                  {/* For non-admin users, show full navigation */}
                  {user?.userType !== "admin" && (
                    <>
                      <button onClick={() => setLocation("/about")} className="relative px-4 py-2 text-slate-300 hover:text-white transition-all duration-300 group hidden md:block">
                        <span className="relative z-10">About</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-600/20 to-emerald-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-slate-400 to-emerald-400 group-hover:w-full group-hover:left-0 transition-all duration-300"></div>
                      </button>
                      <button onClick={() => setLocation("/features")} className="relative px-4 py-2 text-slate-300 hover:text-white transition-all duration-300 group hidden md:block">
                        <span className="relative z-10">Features</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-600/20 to-emerald-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-slate-400 to-emerald-400 group-hover:w-full group-hover:left-0 transition-all duration-300"></div>
                      </button>
                      <button onClick={() => setLocation("/contact")} className="relative px-4 py-2 text-slate-300 hover:text-white transition-all duration-300 group hidden md:block">
                        <span className="relative z-10">Contact</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-600/20 to-emerald-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-slate-400 to-emerald-400 group-hover:w-full group-hover:left-0 transition-all duration-300"></div>
                      </button>
                      <button onClick={() => setLocation("/community")} className="relative px-4 py-2 text-slate-300 hover:text-white transition-all duration-300 group hidden md:block">
                        <span className="relative z-10">Community</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-600/20 to-emerald-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-slate-400 to-emerald-400 group-hover:w-full group-hover:left-0 transition-all duration-300"></div>
                      </button>
                    </>
                  )}

                  {/* Profile dropdown - always shown for authenticated users, including admin */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-3 px-4 py-2 text-slate-300 hover:text-white border border-white/20 hover:border-emerald-400/40 backdrop-blur-sm transition-all duration-300 group overflow-hidden rounded-xl">
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/30 transition-all duration-300 relative z-10 overflow-hidden ${user?.profileImageUrl ? "bg-transparent" : "bg-gradient-to-r from-slate-600 to-emerald-500"}`}>
                          {user?.profileImageUrl ? <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover rounded-full" /> : <User className="w-5 h-5 text-white" />}
                        </div>
                        <div className="relative z-10 text-left hidden sm:block">
                          <div className="font-medium text-white text-sm">{user?.firstName || "User"}</div>
                          <div className="text-xs text-emerald-400 capitalize">{user?.userType}</div>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={13} className="w-64 bg-slate-800/95 backdrop-blur-lg border border-slate-600/50 shadow-2xl rounded-xl z-[60]">
                      <DropdownMenuLabel className="p-4 hover:bg-transparent">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-semibold leading-none text-white">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email}</p>
                          <p className="text-xs leading-none text-slate-300">{user?.email}</p>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                            <p className="text-xs leading-none text-emerald-400 capitalize font-medium">{user?.userType}</p>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-slate-600/50" />
                      {/* For non-admin users, show Profile + Logout; for admin, only Logout */}
                      {user?.userType !== "admin" && (
                        <>
                          <DropdownMenuItem onClick={() => setLocation("/profile")} className="text-slate-300 hover:text-white hover:bg-slate-700/50 focus:bg-slate-700/50 transition-colors duration-200 mx-2 rounded-lg cursor-pointer">
                            <User className="mr-3 h-4 w-4 text-emerald-400" />
                            <span className="font-medium">Profile</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-600/50 mx-2" />
                        </>
                      )}
                      <DropdownMenuItem onClick={logout} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 transition-colors duration-200 mx-2 rounded-lg cursor-pointer">
                        <LogOut className="mr-3 h-4 w-4" />
                        <span className="font-medium">Logout</span>
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
