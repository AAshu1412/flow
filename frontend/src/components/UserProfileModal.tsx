import { createPortal } from 'react-dom';
import { X, UserCircle2, Mail, CheckCircle2 } from 'lucide-react';
import type { UserProfile } from '../types/userType';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

export default function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
  if (!isOpen || !user) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] relative animate-in fade-in zoom-in duration-300">
        
        {/* Cute Top Banner */}
        <div className="h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-90"></div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black/20 text-white hover:bg-black/40 rounded-full backdrop-blur-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 pb-6 relative -mt-12 flex-1 overflow-y-auto">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-4 border-gray-900 bg-gray-800 overflow-hidden flex items-center justify-center shadow-lg">
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold tracking-widest text-white uppercase">
                  {user.name ? user.name.slice(0, 2) : 'ME'}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mt-3">{user.name || 'User Profile'}</h2>
            <div className="flex items-center gap-2 text-gray-400 text-sm mt-1 bg-gray-950 px-3 py-1 rounded-full border border-gray-800 shadow-inner">
              <Mail className="w-3.5 h-3.5" />
              <span>{user.email || 'No email provided'}</span>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            <h3 className="text-xs font-bold tracking-wider text-gray-500 uppercase px-1 pb-1">Authorized Connections</h3>
            
            {/* Google */}
            {user.google_connections && user.google_connections.length > 0 && (
              <div className="p-4 rounded-2xl bg-gray-950/40 border border-gray-800 hover:border-gray-700 transition-colors shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 flex items-center justify-center shrink-0 bg-white rounded-lg p-1.5 shadow-sm">
                    <svg viewBox="0 0 24 24" className="w-full h-full">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-200">Google Workspace</h4>
                </div>
                <div className="space-y-2">
                  {user.google_connections.map(conn => (
                    <div key={conn._id} className="flex items-center justify-between bg-gray-900 border border-gray-800 px-3 py-2 rounded-xl text-sm">
                       <span className="text-gray-300 font-medium truncate pr-2">{conn.email}</span>
                       <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notion */}
            {user.notion_connections && user.notion_connections.length > 0 && (
              <div className="p-4 rounded-2xl bg-gray-950/40 border border-gray-800 hover:border-gray-700 transition-colors shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 flex items-center justify-center shrink-0 bg-gray-100 rounded-lg shadow-sm">
                    <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .467.28.42.607l-1.4 14.502c-.046.606-.373.886-1.073.98l-13.448.792c-.28.047-.513-.186-.466-.466L5.53 5.421C5.578 4.768 5.111 4.535 4.459 4.208zM14.908 19.125l.84-12.775c.046-.466-.14-.653-.606-.606l-2.006.186c-.466.047-.653.28-.7.747h-.046l-4.2-6.155c-.233-.326-.046-.513.373-.56l1.633-.14c.466-.046.7-.28.653-.7l-.093-1.073c-.047-.28-.28-.466-.607-.42l-4.524.373c-.326.047-.56.28-.513.606l.14 1.4c.046.467.233.654.7.607l1.772-.14c.42-.047.56.093.84.466l4.29 6.201H9.982l-.84 12.822c-.046.466.14.653.606.606l2.1-.186c.466-.047.653-.28.7-.747h.047l4.383 6.435c.233.326.046.513-.374.56l-1.632.14c-.466.046-.7.28-.653.7l.093 1.073c.047.28.28.466.607.42l4.897-.42c.326-.047.56-.28.513-.606l-.14-1.4c-.046-.467-.233-.654-.7-.607l-2.005.14c-.42.046-.606-.093-.886-.466l-4.477-6.388z"/>
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-200">Notion</h4>
                </div>
                <div className="space-y-2">
                  {user.notion_connections.map(conn => (
                    <div key={conn._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-900 border border-gray-800 px-3 py-2 rounded-xl text-sm">
                       <div className="flex flex-col pr-2 min-w-0">
                         <span className="text-gray-300 font-medium truncate">{conn.workspace_name || "Workspace"}</span>
                         <span className="text-gray-500 text-xs truncate">{conn.name || conn.email}</span>
                       </div>
                       <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discord */}
            {user.discord_connections && user.discord_connections.length > 0 && (
              <div className="p-4 rounded-2xl bg-gray-950/40 border border-gray-800 hover:border-gray-700 transition-colors shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 flex items-center justify-center shrink-0 bg-[#5865F2]/10 rounded-lg shadow-sm">
                    <svg className="w-5 h-5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-200">Discord</h4>
                </div>
                <div className="space-y-2">
                  {user.discord_connections.map(conn => (
                    <div key={conn._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-900 border border-gray-800 px-3 py-2 rounded-xl text-sm">
                       <div className="flex flex-col pr-2 min-w-0">
                         <span className="text-gray-300 font-medium truncate">{conn.guild_name}</span>
                         <span className="text-gray-500 text-xs truncate">@{conn.username}</span>
                       </div>
                       <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state if nothing connected */}
            {(!user.google_connections?.length && !user.notion_connections?.length && !user.discord_connections?.length) && (
              <div className="p-6 rounded-2xl bg-gray-950/30 border border-gray-800 border-dashed flex flex-col items-center text-center">
                <div className="bg-gray-900 p-3 rounded-full mb-3">
                  <UserCircle2 className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-gray-300 font-semibold text-sm">No connections yet</p>
                <p className="text-gray-500 text-xs mt-1">Visit Integrations to connect your accounts.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
