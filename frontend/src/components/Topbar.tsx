import { useState } from 'react';
import { Play, Save, Loader2, Workflow, Link as LinkIcon } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import AccountsModal from './AccountsModal';
import { useReactFlow } from '@xyflow/react';

export default function Topbar() {
  const { isExecuting, execute_workflow } = useWorkflowStore();
  const { getNodes, getEdges, setNodes } = useReactFlow();
  
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);

  const handleRun = async () => {
    const rawNodes = getNodes();
    const rawEdges = getEdges();
    
    // Quick pseudo-payload format per user instruction to skip strict payload construction for now.
    const nodesRecord: Record<string, any> = {};
    rawNodes.forEach(rn => { nodesRecord[rn.id] = rn.data; });
    const payload = { nodes: nodesRecord, edges: rawEdges };
    
    console.log('[DEBUG] <Topbar> Execution payload schema bypass. Nodes:', payload.nodes);
    
    // find trigger node ideally by checking node schema, here we fallback to first node
    const triggerNodeId = Object.keys(payload.nodes).find(id => payload.nodes[id].service === 'core' && payload.nodes[id].operation === 'manual_input') || Object.keys(payload.nodes)[0];

    try {
      const result = await execute_workflow({
        workflowId: `workflow_${Date.now()}`,
        triggerNodeId: triggerNodeId,
        nodes: payload.nodes,
        edges: payload.edges.map(e => ({ ...e, sourceHandle: e.sourceHandle ?? undefined, targetHandle: e.targetHandle ?? undefined })),
      });

      // Inject pipeline results back into each node's data for UI display & Variable Picker
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

  return (
    <div className="h-16 border-b border-gray-800 bg-gray-950/95 backdrop-blur-md flex items-center justify-between px-6 z-10 sticky top-0 shadow-sm">
      <div className="flex items-center gap-4">
         <div className="flex items-center gap-2 pr-4 border-r border-gray-800">
             <Workflow className="w-5 h-5 text-blue-500" />
             <h1 className="font-bold text-gray-100 tracking-wide">Nexus Flow</h1>
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
    </div>
  );
}
