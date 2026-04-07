import { useState, useEffect, useCallback } from 'react';
import { useReactFlow, useOnSelectionChange, useStore } from '@xyflow/react';
import { useUserStore } from '../store/userStore';
import { useNodeTestStore } from '../store/nodeTestStore';
import { Loader2, Play, X, ChevronDown, ChevronUp, PanelRightOpen } from 'lucide-react';
import VariablePicker from './VariablePicker';

const getIconForService = (serviceName: string) => {
  const customLogos: Record<string, string> = {
    discord: "https://img.icons8.com/?size=100&id=30998&format=png&color=000000",
    gemini: "https://img.icons8.com/?size=100&id=eoxMN35Z6JKg&format=png&color=000000",
    gmail: "https://img.icons8.com/?size=100&id=P7UIlhbpWzZm&format=png&color=000000",
    google_drive: "https://img.icons8.com/?size=100&id=ya4CrqO7PgnY&format=png&color=000000",
    google_docs: "https://img.icons8.com/?size=100&id=30464&format=png&color=000000",
    google_forms: "https://img.icons8.com/?size=100&id=E4VmOrv6BZqd&format=png&color=000000",
    google_meet: "https://img.icons8.com/?size=100&id=pE97I4t7Il9M&format=png&color=000000",
    google_sheets: "https://img.icons8.com/?size=100&id=30461&format=png&color=000000",
    notion: "https://img.icons8.com/?size=100&id=F6H2fsqXKBwH&format=png&color=000000",
  };
  return customLogos[serviceName?.toLowerCase()] || `https://api.dicebear.com/7.x/initials/svg?seed=${serviceName}&backgroundColor=2563eb`;
};

export default function NodeDetailPanel() {
  const { setNodes } = useReactFlow();
  const { nodeProfilesCache, getNodeProfile, isProfileLoading } = useUserStore();
  const { node_test } = useNodeTestStore();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isLocalTesting, setIsLocalTesting] = useState(false);
  const [showTestResult, setShowTestResult] = useState(true);
  const [showPipelineOutput, setShowPipelineOutput] = useState(true);

  // REACTIVE: Subscribe to the internal store for the selected node's data
  // This re-renders the panel whenever the node data changes (from ANY source - node UI, panel, etc.)
  const selectedNode = useStore(
    useCallback(
      (state: any) => {
        if (!selectedNodeId) return null;
        return state.nodes.find((n: any) => n.id === selectedNodeId) || null;
      },
      [selectedNodeId]
    )
  );

  const nodeData = selectedNode?.data as any;

  // REACTIVE: Detect node selection changes via React Flow's hook
  useOnSelectionChange({
    onChange: useCallback(({ nodes }: { nodes: any[] }) => {
      if (nodes.length === 1) {
        setSelectedNodeId(nodes[0].id);
        setIsOpen(true);
        setShowTestResult(true);
        setShowPipelineOutput(true);
      } else if (nodes.length === 0) {
        // Don't close panel, just stop tracking
      }
    }, []),
  });

  // Load profile when panel opens for a node
  const service = nodeData?.service;
  const operation = nodeData?.operation;
  const cacheKey = service && operation ? `${service}_${operation}` : '';
  const profile = cacheKey ? nodeProfilesCache[cacheKey] : null;
  const isRouter = operation === 'router';

  useEffect(() => {
    if (isOpen && selectedNodeId && service && operation && !profile && !isRouter) {
      getNodeProfile(service, operation).catch(console.error);
    }
  }, [isOpen, selectedNodeId, service, operation, profile, isRouter, getNodeProfile]);

  // Handlers — these write to the same React Flow state, so changes instantly sync with DynamicNode
  const handleInputChange = (key: string, value: any) => {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNodeId) {
          return { ...n, data: { ...n.data, inputs: { ...((n.data as any).inputs || {}), [key]: value } } };
        }
        return n;
      })
    );
  };

  const commitDataUpdate = (partialDataPatch: any) => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.map(n => {
      if (n.id === selectedNodeId) return { ...n, data: { ...n.data, ...partialDataPatch } };
      return n;
    }));
  };

  const runTestNodeLocally = async () => {
    if (!nodeData || !selectedNodeId) return;
    setIsLocalTesting(true);
    try {
      const res = await node_test(nodeData.service, nodeData.operation, nodeData.selectedAccounts || '', nodeData.inputs || {});
      const result = res?.data || res;
      // Store in node data so DynamicNode can also see it
      setNodes((nds) => nds.map(n => {
        if (n.id === selectedNodeId) return { ...n, data: { ...n.data, testResult: result } };
        return n;
      }));
    } catch (err: any) {
      setNodes((nds) => nds.map(n => {
        if (n.id === selectedNodeId) return { ...n, data: { ...n.data, testResult: { error: err.message } } };
        return n;
      }));
    }
    setIsLocalTesting(false);
  };

  // Floating open button when panel is closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 top-20 z-20 p-2.5 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300 rounded-lg shadow-lg transition-all"
        title="Open detail panel"
      >
        <PanelRightOpen className="w-5 h-5" />
      </button>
    );
  }

  if (!selectedNode || !nodeData) {
    return (
      <div className="w-96 border-l border-gray-800 bg-gray-950/95 backdrop-blur-md flex flex-col h-full">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <span className="text-sm text-gray-400 font-medium">Node Details</span>
          <button onClick={() => setIsOpen(false)} className="p-1.5 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm text-gray-500 text-center">Select a node on the canvas to view its configuration</p>
        </div>
      </div>
    );
  }

  const inputs = nodeData.inputs || {};
  const selectedAccounts = nodeData.selectedAccounts || '';

  return (
    <div className="w-96 border-l border-gray-800 bg-gray-950/95 backdrop-blur-md flex flex-col h-full overflow-hidden shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shadow-inner shrink-0">
          <img src={getIconForService(service)} alt={nodeData.label} draggable={false} className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col flex-1 overflow-hidden">
          <span className="text-sm font-bold text-gray-100 truncate">{nodeData.label || service}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold truncate">{operation?.replace(/_/g, ' ')}</span>
        </div>
        <span className="text-[9px] text-gray-600 font-mono bg-gray-900 px-1.5 py-0.5 rounded shrink-0">{selectedNodeId?.slice(-8)}</span>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1.5 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Configuration */}
        {isRouter ? (
          <div className="text-xs text-gray-500 italic p-3 bg-gray-900 rounded-lg">Router configuration is only available on the node canvas.</div>
        ) : !profile ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            {isProfileLoading ? <Loader2 className="w-5 h-5 animate-spin mb-2" /> : <p className="text-xs">Profile unavailable</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-4 text-xs">
            {/* Account selector */}
            {profile.availableAccounts && profile.availableAccounts.length > 0 && (
              <div>
                <label className="block text-gray-400 mb-1.5 font-medium text-[10px] uppercase tracking-wider">Connection</label>
                <select
                  className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white outline-none focus:border-blue-500"
                  value={selectedAccounts}
                  onChange={(e) => commitDataUpdate({ selectedAccounts: e.target.value })}
                >
                  <option value="">-- No Account --</option>
                  {profile.availableAccounts.map((acc: any) => (
                    <option key={acc.connectionId} value={acc.identifier}>{acc.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Inputs */}
            {profile.inputs.map((input: any) => {
              const value = inputs[input.key] !== undefined ? inputs[input.key] : (input.defaultValue || '');

              return (
                <div key={input.key}>
                  <label className="block text-gray-400 mb-1.5 flex items-center justify-between">
                    <span className="font-semibold text-gray-300">{input.label}</span>
                    {input.mandatory && <span className="text-red-400 text-[9px] uppercase font-bold px-1.5 py-0.5 bg-red-400/10 rounded">Req</span>}
                  </label>
                  {input.description && <p className="text-[10px] text-gray-500 mb-2">{input.description}</p>}

                  {input.type === 'select' ? (
                    <select
                      className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white outline-none focus:border-blue-500"
                      value={value}
                      onChange={(e) => handleInputChange(input.key, e.target.value)}
                    >
                      <option value="">-- Select option --</option>
                      {input.options?.map((opt: any) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : input.type === 'boolean' ? (
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-blue-500"
                        checked={!!value}
                        onChange={(e) => handleInputChange(input.key, e.target.checked)}
                      />
                      <span className="text-gray-300">Enable</span>
                    </label>
                  ) : input.type === 'number' ? (
                    <input
                      type="number"
                      className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white outline-none focus:border-blue-500"
                      value={value}
                      onChange={(e) => handleInputChange(input.key, parseFloat(e.target.value))}
                      placeholder="Enter amount..."
                    />
                  ) : (
                    <div className="relative">
                      <textarea
                        id={`panel-textarea-${selectedNodeId}-${input.key}`}
                        className="w-full min-h-24 bg-gray-900 border border-gray-700 rounded-md p-2 text-white outline-none focus:border-blue-500 font-mono text-xs resize-y"
                        placeholder="..."
                        value={value}
                        onChange={(e) => handleInputChange(input.key, e.target.value)}
                      />
                      <div className="absolute top-0 right-0 mt-1 mr-1">
                        <VariablePicker
                          currentNodeId={selectedNodeId!}
                          onInsert={(variable) => {
                            const el = document.getElementById(`panel-textarea-${selectedNodeId}-${input.key}`) as HTMLTextAreaElement | null;
                            if (el) {
                              const start = el.selectionStart ?? value.length;
                              const end = el.selectionEnd ?? value.length;
                              const newValue = value.slice(0, start) + variable + value.slice(end);
                              handleInputChange(input.key, newValue);
                            } else {
                              handleInputChange(input.key, value + variable);
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Test Button */}
        <div className="pt-3 border-t border-gray-800">
          <button
            onClick={runTestNodeLocally}
            disabled={isLocalTesting || (!profile && !isRouter)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-md hover:shadow-indigo-500/20 disabled:opacity-50 text-sm"
          >
            {isLocalTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            {isRouter ? 'Skip Test' : 'Test Node'}
          </button>

          {/* Test Result (collapsible) — reads from node data for sync */}
          {nodeData.testResult && (
            <div className="mt-3 bg-black border border-gray-800 rounded-md overflow-hidden">
              <button
                onClick={() => setShowTestResult(!showTestResult)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-900 transition-colors"
              >
                <span className="text-xs text-green-400 font-semibold uppercase">Test Result</span>
                {showTestResult ? <ChevronUp className="w-3.5 h-3.5 text-green-400" /> : <ChevronDown className="w-3.5 h-3.5 text-green-400" />}
              </button>
              {showTestResult && (
                <div className="px-3 pb-3 max-h-60 overflow-y-auto">
                  <pre className="text-xs text-green-300 font-mono whitespace-pre-wrap">{JSON.stringify(nodeData.testResult, null, 2)}</pre>
                </div>
              )}
            </div>
          )}

          {/* Pipeline Output (collapsible) — reads from node data for sync */}
          {nodeData.lastRunOutput !== undefined && (
            <div className="mt-3 bg-gray-950 border border-blue-500/30 rounded-md overflow-hidden">
              <button
                onClick={() => setShowPipelineOutput(!showPipelineOutput)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-900 transition-colors"
              >
                <span className="text-xs text-blue-400 font-semibold uppercase">Pipeline Output</span>
                {showPipelineOutput ? <ChevronUp className="w-3.5 h-3.5 text-blue-400" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-400" />}
              </button>
              {showPipelineOutput && (
                <div className="px-3 pb-3 max-h-60 overflow-y-auto">
                  <pre className="text-xs text-blue-300 font-mono whitespace-pre-wrap">{JSON.stringify(nodeData.lastRunOutput, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
