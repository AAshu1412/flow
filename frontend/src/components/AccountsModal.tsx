import { createPortal } from 'react-dom';
import { X, Link2, CheckCircle2 } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useOAuthStore } from '../store/oAuthStore';

interface AccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountsModal({ isOpen, onClose }: AccountsModalProps) {
  const { user } = useUserStore();
  const { linkGoogleAccount, linkNotionAccount, linkDiscordAccount } = useOAuthStore();

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-gray-950/50">
          <div>
            <h2 className="text-lg font-semibold text-white">Integrations & Accounts</h2>
            <p className="text-sm text-gray-400">Connect external services to use them in your workflows.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Discord Integration */}
          <div className="p-4 rounded-xl border border-gray-800 bg-gray-950/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#5865F2]/10 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                    </svg>
                </div>
                <div>
                   <h3 className="text-sm font-semibold text-white">Discord</h3>
                   <p className="text-xs text-gray-400 mt-0.5">Automate messages and manage roles across guided servers.</p>
                   
                   {user?.discord_connections && user.discord_connections.length > 0 && (
                       <div className="mt-3 space-y-2">
                           {user.discord_connections.map((conn) => (
                               <div key={conn._id} className="flex items-center gap-2 text-xs bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg">
                                   <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                   <span className="text-gray-300 font-medium">{conn.guild_name}</span>
                                   <span className="text-gray-500">(@{conn.username})</span>
                               </div>
                           ))}
                       </div>
                   )}
                </div>
             </div>
             
             <button 
                onClick={linkDiscordAccount}
                className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-[#5865F2] hover:text-white text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                  <Link2 className="w-4 h-4" /> Add Server
              </button>
          </div>

          {/* Notion Integration */}
          <div className="p-4 rounded-xl border border-gray-800 bg-gray-950/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                   <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .467.28.42.607l-1.4 14.502c-.046.606-.373.886-1.073.98l-13.448.792c-.28.047-.513-.186-.466-.466L5.53 5.421C5.578 4.768 5.111 4.535 4.459 4.208zM14.908 19.125l.84-12.775c.046-.466-.14-.653-.606-.606l-2.006.186c-.466.047-.653.28-.7.747h-.046l-4.2-6.155c-.233-.326-.046-.513.373-.56l1.633-.14c.466-.046.7-.28.653-.7l-.093-1.073c-.047-.28-.28-.466-.607-.42l-4.524.373c-.326.047-.56.28-.513.606l.14 1.4c.046.467.233.654.7.607l1.772-.14c.42-.047.56.093.84.466l4.29 6.201H9.982l-.84 12.822c-.046.466.14.653.606.606l2.1-.186c.466-.047.653-.28.7-.747h.047l4.383 6.435c.233.326.046.513-.374.56l-1.632.14c-.466.046-.7.28-.653.7l.093 1.073c.047.28.28.466.607.42l4.897-.42c.326-.047.56-.28.513-.606l-.14-1.4c-.046-.467-.233-.654-.7-.607l-2.005.14c-.42.046-.606-.093-.886-.466l-4.477-6.388z"/>
                   </svg>
                </div>
                <div>
                   <h3 className="text-sm font-semibold text-white">Notion</h3>
                   <p className="text-xs text-gray-400 mt-0.5">Connect your workspaces to automate page creations and syncs.</p>

                   {user?.notion_connections && user.notion_connections.length > 0 && (
                       <div className="mt-3 space-y-2">
                           {user.notion_connections.map((conn) => (
                               <div key={conn._id} className="flex items-center gap-2 text-xs bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg">
                                   <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                   <span className="text-gray-300 font-medium">{conn.workspace_name || "Workspace"}</span>
                                   <span className="text-gray-500">({conn.name || conn.email || "Connected"})</span>
                               </div>
                           ))}
                       </div>
                   )}
                </div>
             </div>
             
             <button 
                onClick={linkNotionAccount}
                className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-100 hover:text-black text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                  <Link2 className="w-4 h-4" /> Add Workspace
              </button>
          </div>
          
          {/* Google Integration */}
          <div className="p-4 rounded-xl border border-gray-800 bg-gray-950/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                </div>
                <div>
                   <h3 className="text-sm font-semibold text-white">Google Workspace</h3>
                   <p className="text-xs text-gray-400 mt-0.5">Connect Drive, Sheets, Gmail, and Docs to your automation flows.</p>
                   
                   {user?.google_connections && user.google_connections.length > 0 && (
                       <div className="mt-3 space-y-2">
                           {user.google_connections.map((conn) => (
                               <div key={conn._id} className="flex items-center gap-2 text-xs bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg">
                                   <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                   <span className="text-gray-300 font-medium">{conn.email}</span>
                               </div>
                           ))}
                       </div>
                   )}
                </div>
             </div>
             
             <button 
                onClick={linkGoogleAccount}
                className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-100 hover:text-black text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                  <Link2 className="w-4 h-4" /> Link Google
              </button>
          </div>

        </div>
        
        <div className="p-4 border-t border-gray-800 bg-gray-950 flex justify-end">
             <button onClick={onClose} className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors">
                Done
             </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
