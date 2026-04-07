import { useState, useEffect } from 'react';
import { Play, Save, Loader2, Workflow, Link as LinkIcon } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import AccountsModal from './AccountsModal';
import SaveWorkflowModal from './SaveWorkflowModal';
import { useReactFlow } from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';

const generateWorkflowId = () => `wf_${uuidv4()}`;

export default function Topbar() {
  const { isExecuting, execute_workflow, saveWorkflow } = useWorkflowStore();
  const { getNodes, getEdges, setNodes } = useReactFlow();
  
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [workflowId] = useState(() => generateWorkflowId());

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
  };

  return (
    <div className="h-16 border-b border-gray-800 bg-gray-950/95 backdrop-blur-md flex items-center justify-between px-6 z-10 sticky top-0 shadow-sm">
      <div className="flex items-center gap-4">
         <div className="flex items-center gap-2 pr-4 border-r border-gray-800">
             <Workflow className="w-5 h-5 text-blue-500" />
             <h1 className="font-bold text-gray-100 tracking-wide">Nexus Flow</h1>
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
          onClick={() => setIsSaveModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm font-medium transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save</span>
        </button>

        <button 
          onClick={handleRun}
          disabled={isExecuting}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          <span>Run Workflow</span>
        </button>
      </div>

      <AccountsModal isOpen={isAccountsModalOpen} onClose={() => setIsAccountsModalOpen(false)} />
      <SaveWorkflowModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        workflowId={workflowId}
        onSave={handleSave}
      />
    </div>
  );
}
