import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FolderOpen, Loader2, Workflow, Clock } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import { useReactFlow } from '@xyflow/react';

interface SavedWorkflowsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadWorkflow: (workflowId: string) => void;
}

export default function SavedWorkflowsModal({ isOpen, onClose, onLoadWorkflow }: SavedWorkflowsModalProps) {
  const { getAllWorkflowIds, getWorkflowById } = useWorkflowStore();
  const { setNodes, setEdges } = useReactFlow();
  
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [loadingWorkflowId, setLoadingWorkflowId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadWorkflows();
    }
  }, [isOpen]);

  const loadWorkflows = async () => {
    setIsLoadingList(true);
    setError(null);
    try {
      const response = await getAllWorkflowIds();
      if (response.data) {
        setWorkflows(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workflows.');
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleSelectWorkflow = async (workflowId: string) => {
    setLoadingWorkflowId(workflowId);
    setError(null);
    try {
      const response = await getWorkflowById(workflowId);
      const data = response.data;
      if (data) {
        // Map nodes
        const mappedNodes = Object.entries(data.nodes || {}).map(([id, nodeData]: [string, any]) => ({
          id: id,
          type: 'dynamic',
          position: nodeData.position || { x: 0, y: 0 },
          data: {
            ...nodeData,
            service: nodeData.service,
            operation: nodeData.operation,
            selectedAccounts: nodeData.selectedAccounts,
            inputs: nodeData.inputs || {}
          }
        }));

        // Map edges
        const mappedEdges = (data.edges || []).map((edge: any) => ({
          ...edge,
          id: edge.id || `edge-${edge.source}-${edge.target}-${Date.now()}`
        }));

        setNodes(mappedNodes);
        setEdges(mappedEdges);
        
        onLoadWorkflow(data.workflowId || workflowId);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workflow details');
    } finally {
      setLoadingWorkflowId(null);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <FolderOpen className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-100">Saved Workflows</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {isLoadingList ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-400">Loading workflows...</p>
            </div>
          ) : workflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Workflow className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-lg font-medium text-gray-300">No workflows found</p>
              <p className="text-gray-500 text-sm mt-1">Create and save a workflow to see it here.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {workflows.map((wf) => (
               <div 
                  key={wf.workflowId || wf._id}
                  onClick={() => !loadingWorkflowId && handleSelectWorkflow(wf.workflowId)}
                  className={`flex flex-col p-4 rounded-xl border transition-all cursor-pointer ${
                    loadingWorkflowId === wf.workflowId 
                      ? 'border-blue-500/50 bg-blue-500/5' 
                      : 'border-gray-800 bg-gray-950 hover:border-gray-600 hover:bg-gray-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between pointer-events-none">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {wf.name || 'Untitled Workflow'}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {wf.description || 'No description provided'}
                      </p>
                    </div>
                    {loadingWorkflowId === wf.workflowId ? (
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0 ml-4" />
                    ) : (
                      <div className="shrink-0 ml-4 hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-gray-900 rounded-md border border-gray-800">
                         <Clock className="w-3 h-3 text-gray-500" />
                         <span className="text-[10px] text-gray-400 font-mono">{wf.workflowId}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
