import { useState, useRef, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Braces } from 'lucide-react';

interface VariablePickerProps {
  currentNodeId: string;
  onInsert: (variable: string) => void;
}

interface UpstreamVariable {
  nodeId: string;
  nodeLabel: string;
  key: string;
  sampleValue: any;
}

/**
 * Walks edges backwards from currentNodeId to find all upstream nodes.
 */
function getUpstreamNodeIds(currentNodeId: string, allEdges: any[]): string[] {
  const upstream: string[] = [];
  const queue = [currentNodeId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    for (const edge of allEdges) {
      if (edge.target === nodeId && !visited.has(edge.source)) {
        visited.add(edge.source);
        upstream.push(edge.source);
        queue.push(edge.source);
      }
    }
  }

  return upstream;
}

/**
 * Extracts available variables from a node's lastRunOutput or sampleOutput.
 */
function extractVariables(nodeId: string, nodeLabel: string, output: any): UpstreamVariable[] {
  if (output === null || output === undefined) return [];

  // If output is a primitive, show it as a single "value" variable
  if (typeof output !== 'object') {
    return [{ nodeId, nodeLabel, key: '', sampleValue: output }];
  }

  // If output is an object, list each key
  return Object.entries(output).map(([key, val]) => ({
    nodeId,
    nodeLabel,
    key,
    sampleValue: val,
  }));
}

export default function VariablePicker({ currentNodeId, onInsert }: VariablePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { getNodes, getEdges } = useReactFlow();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const allNodes = getNodes();
  const allEdges = getEdges();
  const upstreamIds = getUpstreamNodeIds(currentNodeId, allEdges);

  // Build list of available variables
  const variables: UpstreamVariable[] = [];
  for (const uid of upstreamIds) {
    const node = allNodes.find(n => n.id === uid);
    if (!node) continue;

    const label = (node.data as any).label || (node.data as any).service || uid;
    const output = (node.data as any).lastRunOutput ?? (node.data as any).sampleOutput;

    if (output !== undefined) {
      variables.push(...extractVariables(uid, label, output));
    } else {
      // Even if no output yet, show the node as available (raw reference)
      variables.push({ nodeId: uid, nodeLabel: label, key: '', sampleValue: '(run pipeline first)' });
    }
  }

  // Filter by search
  const filtered = variables.filter(v => {
    const text = `${v.nodeLabel} ${v.key}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const handleSelect = (v: UpstreamVariable) => {
    // If key is empty, insert just {{nodeId}}, otherwise {{nodeId.key}}
    const variable = v.key ? `{{${v.nodeId}.${v.key}}}` : `{{${v.nodeId}}}`;
    onInsert(variable);
    setIsOpen(false);
    setSearch('');
  };

  const formatSample = (val: any): string => {
    if (val === null || val === undefined) return 'null';
    if (typeof val === 'object') return JSON.stringify(val).slice(0, 40) + '…';
    return String(val).slice(0, 50);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="p-1 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
        title="Insert variable from upstream node"
      >
        <Braces className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl shadow-black/50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-800">
            <input
              type="text"
              placeholder="Search variables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500 placeholder-gray-600"
              autoFocus
            />
          </div>

          {/* Variable list */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-gray-500 text-[10px]">
                {upstreamIds.length === 0
                  ? 'No upstream nodes connected'
                  : 'No variables found. Run pipeline first to discover outputs.'}
              </div>
            ) : (
              filtered.map((v, i) => (
                <button
                  key={`${v.nodeId}-${v.key}-${i}`}
                  onClick={() => handleSelect(v)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-800 border-b border-gray-800/50 last:border-0 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider truncate">
                      {v.nodeLabel}
                    </span>
                    {v.key && (
                      <span className="text-[10px] font-mono text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded shrink-0">
                        .{v.key}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5 truncate font-mono">
                    {formatSample(v.sampleValue)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
