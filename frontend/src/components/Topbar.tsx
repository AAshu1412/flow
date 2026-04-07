import { useState, useEffect } from 'react';
import { Play, Save, Loader2, Workflow, Link as LinkIcon, FolderOpen, UserCircle2, MoreVertical, CheckCircle2 } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import { useUserStore } from '../store/userStore';
import AccountsModal from './AccountsModal';
import SaveWorkflowModal from './SaveWorkflowModal';
import SavedWorkflowsModal from './SavedWorkflowsModal';
import UserProfileModal from './UserProfileModal';
import { useReactFlow } from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';

const generateWorkflowId = () => `wf_${uuidv4()}`;

export default function Topbar() {
  const { isExecuting, execute_workflow, saveWorkflow } = useWorkflowStore();
  const { user, getUser } = useUserStore();
  const { getNodes, getEdges, setNodes } = useReactFlow();
  
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSavedWorkflowsModalOpen, setIsSavedWorkflowsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [workflowId, setWorkflowId] = useState(() => generateWorkflowId());
  
  const [workflowName, setWorkflowName] = useState<string>('');
  const [workflowDescription, setWorkflowDescription] = useState<string>('');
  const [isExistingWorkflow, setIsExistingWorkflow] = useState(false);
  const [isQuickSaving, setIsQuickSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      getUser().catch(console.error);
    }
  }, [user, getUser]);

  const buildPayload = () => {
    const rawNodes = getNodes();
    const rawEdges = getEdges();
    
    const nodesRecord: Record<string, any> = {};
    rawNodes.forEach(rn => {
      nodesRecord[rn.id] = {
        ...rn.data,
        id: rn.id,
        position: rn.position
      };
    });

    const triggerNodeId = Object.keys(nodesRecord).find(
      id => nodesRecord[id].service === 'core' && nodesRecord[id].operation === 'manual_input'
    ) || Object.keys(nodesRecord)[0];

    return {
      workflowId,
      triggerNodeId,
      nodes: nodesRecord,
      edges: rawEdges.map(e => ({
        ...e,
        sourceHandle: e.sourceHandle ?? undefined,
        targetHandle: e.targetHandle ?? undefined,
      })),
    };
  };

  const handleRun = async () => {
    const payload = buildPayload();
    console.log('[DEBUG] <Topbar> Run workflow:', payload.workflowId);

    try {
      const result = await execute_workflow(payload);

      const envelope = result.data;
      if (envelope && typeof envelope === 'object') {
        setNodes((nds: any) => nds.map((n: any) => {
          if (envelope[n.id] !== undefined) {
            return { ...n, data: { ...n.data, lastRunOutput: envelope[n.id] } };
          }
          return n;
        }));
      }
    } catch (err) {
      console.error('[DEBUG] <Topbar> Error during execute_workflow:', err);
    }
  };

  const handleSave = async (saveData: { workflowId: string; name: string; description: string }) => {
    const payload = buildPayload();

    await saveWorkflow({
      workflowId: saveData.workflowId,
      name: saveData.name,
      description: saveData.description,
      triggerNodeId: payload.triggerNodeId,
      nodes: payload.nodes,
      edges: payload.edges,
    });
    
    setWorkflowName(saveData.name);
    setWorkflowDescription(saveData.description);
    setIsExistingWorkflow(true);
  };

  const handleQuickSave = async () => {
    setIsQuickSaving(true);
    try {
      const payload = buildPayload();
      await saveWorkflow({
        workflowId: payload.workflowId,
        name: workflowName,
        description: workflowDescription,
        triggerNodeId: payload.triggerNodeId,
        nodes: payload.nodes,
        edges: payload.edges,
      });
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (err) {
      console.error("[DEBUG] <Topbar> Failed to quick save:", err);
    } finally {
      setIsQuickSaving(false);
    }
  };

  return (
    <div className="h-16 border-b border-gray-800 bg-gray-950/95 backdrop-blur-md flex items-center justify-between px-6 z-10 sticky top-0 shadow-sm">
      <div className="flex items-center gap-4">
         <div className="flex items-center gap-2 pr-4 border-r border-gray-800">
             <Workflow className="w-5 h-5 text-blue-500" />
             <h1 className="font-bold text-gray-100 tracking-wide">Flow</h1>
         </div>
         {/* Workflow ID display (read-only) */}
         <div className="flex items-center gap-2">
           <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">ID:</span>
           <span className="bg-gray-900 border border-gray-800 rounded-md px-2.5 py-1 text-[11px] text-gray-400 font-mono select-all cursor-default max-w-[220px] truncate" title={workflowId}>
             {workflowId}
           </span>
         </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
           onClick={() => setIsAccountsModalOpen(true)}
           className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-700 hover:border-gray-600 text-gray-200 rounded-lg text-sm font-medium transition-all shadow-sm focus:ring-2 focus:ring-gray-700 outline-none"
        >
          <LinkIcon className="w-4 h-4 text-blue-400" />
          <span>Integrations</span>
        </button>

        <button
          onClick={() => setIsSavedWorkflowsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-700 hover:border-gray-600 text-gray-200 rounded-lg text-sm font-medium transition-all shadow-sm focus:ring-2 focus:ring-gray-700 outline-none"
        >
          <FolderOpen className="w-4 h-4 text-purple-400" />
          <span>Browse</span>
        </button>

        {isExistingWorkflow ? (
           <div className="flex items-center rounded-lg bg-gray-900 border border-gray-700 divide-x divide-gray-700 shadow-sm transition-all focus-within:ring-2 focus-within:ring-gray-700 relative group overflow-hidden">
             {/* Invisible Tooltip for preventing auto-save assumptions */}
             <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-800 border border-gray-700 rounded-md text-[10px] text-gray-300 font-medium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-lg">
                Manual Update
             </div>
             
             <button
               onClick={handleQuickSave}
               disabled={isQuickSaving}
               className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 text-gray-200 text-sm font-medium transition-colors disabled:opacity-50"
             >
               {isQuickSaving ? (
                 <Loader2 className="w-4 h-4 text-purple-400 font-bold animate-spin" />
               ) : showSaveSuccess ? (
                 <CheckCircle2 className="w-4 h-4 text-emerald-500 font-bold" />
               ) : (
                 <Save className="w-4 h-4 text-purple-400 font-bold" />
               )}
               <span className="pr-1">{showSaveSuccess ? 'Saved' : 'Update'}</span>
             </button>
             <button
               onClick={() => setIsSaveModalOpen(true)}
               title="Edit details or Save As"
               className="flex items-center px-2 py-2 hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
             >
               <MoreVertical className="w-4 h-4" />
             </button>
           </div>
        ) : (
          <button
            onClick={() => setIsSaveModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm font-medium transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
        )}

        <button 
          onClick={handleRun}
          disabled={isExecuting}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          <span>Run Workflow</span>
        </button>

        {/* Profile Avatar / Button */}
        <div className="relative group ml-2">
           <button 
             onClick={() => setIsProfileModalOpen(true)}
             className="w-9 h-9 rounded-full border border-gray-700 hover:border-gray-500 bg-gray-800 flex items-center justify-center overflow-hidden transition-all outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
           >
              {user?.picture ? (
                 <img src={user.picture} alt={user.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                 <UserCircle2 className="w-5 h-5 text-gray-400" />
              )}
           </button>
           
           {user?.name && (
             <div className="absolute top-12 right-0 mt-1 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-md text-xs font-semibold text-gray-200 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                {user.name}
             </div>
           )}
        </div>
      </div>

      <AccountsModal isOpen={isAccountsModalOpen} onClose={() => setIsAccountsModalOpen(false)} />
      <SaveWorkflowModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        workflowId={workflowId}
        onSave={handleSave}
      />
      <SavedWorkflowsModal
        isOpen={isSavedWorkflowsModalOpen}
        onClose={() => setIsSavedWorkflowsModalOpen(false)}
        onLoadWorkflow={(id, name, desc) => {
          setWorkflowId(id);
          setWorkflowName(name || '');
          setWorkflowDescription(desc || '');
          setIsExistingWorkflow(true);
        }}
      />
      <UserProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
      />
    </div>
  );
}
