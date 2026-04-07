import { memo, useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { useUserStore } from '../store/userStore';
import { useNodeTestStore } from '../store/nodeTestStore';
import { Loader2, Play, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

const getIconForService = (serviceName: string) => {
  const customLogos: Record<string, string> = {
    discord: "https://img.icons8.com/?size=100&id=30998&format=png&color=000000",
    gemini: "https://img.icons8.com/?size=100&id=eoxMN35Z6JKg&format=png&color=000000",
    gmail: "https://img.icons8.com/?size=100&id=P7UIlhbpWzZm&format=png&color=000000"
  };
  return customLogos[serviceName.toLowerCase()] || `https://api.dicebear.com/7.x/initials/svg?seed=${serviceName}&backgroundColor=2563eb`;
};

const DynamicNode = memo(({ id, data, selected }: { id: string; data: any; selected: boolean }) => {
  const { setNodes } = useReactFlow();
  const { nodeProfilesCache, getNodeProfile, isProfileLoading } = useUserStore();
  const { node_test } = useNodeTestStore();

  const [expanded, setExpanded] = useState(false);
  const [localTestResult, setLocalTestResult] = useState<any>(null);
  const [isLocalTesting, setIsLocalTesting] = useState(false);

  const { service, operation, inputs = {}, selectedAccounts = '' } = data;
  const isRouter = operation === 'router';
  
  const cacheKey = `${service}_${operation}`;
  const profile = nodeProfilesCache[cacheKey];

  useEffect(() => {
    if (expanded && !profile && !isRouter) {
      getNodeProfile(service, operation).catch(err => console.error(err));
    }
  }, [expanded, profile, isRouter, service, operation, getNodeProfile, id, cacheKey]);

  const runTestNodeLocally = async () => {
      setIsLocalTesting(true);
      setLocalTestResult(null);
      try {
          const res = await node_test(service, operation, selectedAccounts, inputs);
          setLocalTestResult(res?.data || res);
      } catch (err: any) {
          setLocalTestResult({ error: err.message });
      }
      setIsLocalTesting(false);
  };

  const handleInputChange = (key: string, value: any) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return { ...n, data: { ...n.data, inputs: { ...((n.data as any).inputs || {}), [key]: value } } };
        }
        return n;
      })
    );
  };

  // Universal generic updater block
  const commitDataUpdate = (partialDataPatch: any) => {
    setNodes((nds) => nds.map(n => {
      if (n.id === id) return { ...n, data: { ...n.data, ...partialDataPatch } };
      return n;
    }));
  };

  const addRule = () => {
    const currentRules = inputs.rules || [];
    const newHandle = `path_${currentRules.length + 1}`;
    commitDataUpdate({ inputs: { ...inputs, rules: [...currentRules, { handle: newHandle, condition: '' }] } });
  };

  const removeRule = (idx: number) => {
    const currentRules = [...(inputs.rules || [])];
    currentRules.splice(idx, 1);
    commitDataUpdate({ inputs: { ...inputs, rules: currentRules } });
  };

  const updateRule = (idx: number, key: 'handle' | 'condition', value: string) => {
      const currentRules = [...(inputs.rules || [])];
      currentRules[idx][key] = value;
      commitDataUpdate({ inputs: { ...inputs, rules: currentRules } });
  };
  
  const fallbackHandle = inputs.fallbackHandle || 'path_fallback';

  const renderConfiguration = () => {
     if (isRouter) {
         const rules = inputs.rules || [];
         
         return (
             <div className="flex flex-col gap-3">
                 <div className="flex items-center justify-between text-xs font-semibold text-gray-400">
                     <span>Routing Rules</span>
                     <button onClick={addRule} className="text-blue-400 hover:text-blue-300 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Rule</button>
                 </div>
                 
                 {rules.map((rule: any, index: number) => (
                     <div key={index} className="relative bg-gray-900 border border-gray-700 p-2 rounded-lg flex flex-col gap-2">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Rule {index + 1}</span>
                            <button onClick={() => removeRule(index)} className="text-gray-500 hover:text-red-400"><X className="w-3 h-3" /></button>
                         </div>
                         <input 
                            type="text"
                            placeholder="Condition (e.g. {{node_1.score}} > 50)"
                            value={rule.condition}
                            onChange={(e) => updateRule(index, 'condition', e.target.value)}
                            className="w-full bg-black border border-gray-800 rounded p-1.5 text-xs text-white outline-none focus:border-blue-500"
                         />
                         <input 
                            type="text"
                            placeholder="Handle ID"
                            value={rule.handle}
                            onChange={(e) => updateRule(index, 'handle', e.target.value)}
                            className="w-full bg-black border border-gray-800 rounded p-1.5 text-xs text-blue-400 font-mono outline-none focus:border-blue-500"
                         />
                         
                         <Handle 
                            type="source" 
                            position={Position.Right} 
                            id={rule.handle}
                            className={`!w-3 !h-3 !border-2 transition-colors !translate-x-[20px] ${rule.condition ? '!bg-green-500 !border-green-800' : '!bg-gray-800 !border-gray-600' }`}
                         />
                     </div>
                 ))}

                 <div className="relative bg-gray-900/50 border border-gray-800 border-dashed p-2 rounded-lg flex flex-col gap-2 mt-2">
                     <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Fallback (Else)</span>
                     <input 
                         type="text"
                         value={inputs.fallbackHandle || 'fallback_path'}
                         onChange={(e) => commitDataUpdate({ inputs: { ...inputs, fallbackHandle: e.target.value } })}
                         className="w-full bg-gray-900/50 border border-gray-700/50 rounded-md px-3 py-1.5 text-xs focus:ring-1 focus:ring-gray-500 whitespace-pre"
                     />
                     <Handle 
                        type="source" 
                        position={Position.Right} 
                        id={fallbackHandle}
                        className="!w-3 !h-3 !bg-orange-500 !border-2 !border-orange-800 !translate-x-[20px]"
                     />
                 </div>
             </div>
         );
     }

     if (!profile) {
         return (
             <div className="flex flex-col items-center justify-center py-4 text-gray-500">
                 {isProfileLoading ? <Loader2 className="w-4 h-4 animate-spin mb-1" /> : <p className="text-xs">Profile unavailable</p>}
             </div>
         );
     }

     return (
         <div className="flex flex-col gap-4 text-xs">
            {profile.availableAccounts && profile.availableAccounts.length > 0 && (
                 <div>
                    <label className="block text-gray-400 mb-1 font-medium text-[10px] uppercase tracking-wider">Connection</label>
                    <select 
                        className="w-full bg-gray-900 border border-gray-700 rounded-md p-1.5 text-white outline-none focus:border-blue-500"
                        value={selectedAccounts}
                        onChange={(e) => commitDataUpdate({ selectedAccounts: e.target.value })}
                    >
                        <option value="">-- No Account --</option>
                        {profile.availableAccounts.map(acc => (
                            <option key={acc.connectionId} value={acc.identifier}>{acc.label}</option>
                        ))}
                    </select>
                 </div>
            )}

            {profile.inputs.map((input) => {
                const value = inputs[input.key] !== undefined ? inputs[input.key] : (input.defaultValue || '');

                return (
                    <div key={input.key}>
                        <label className="block text-gray-400 mb-1 flex items-center justify-between">
                            <span className="font-semibold text-gray-300">{input.label}</span>
                            {input.mandatory && <span className="text-red-400 text-[9px] uppercase font-bold px-1.5 py-0.5 bg-red-400/10 rounded">Req</span>}
                        </label>
                        {input.description && <p className="text-[10px] text-gray-500 mb-1.5">{input.description}</p>}

                        {input.type === 'select' ? (
                            <select 
                                className="w-full bg-gray-900 border border-gray-700 rounded-md p-1.5 text-white outline-none focus:border-blue-500"
                                value={value}
                                onChange={(e) => handleInputChange(input.key, e.target.value)}
                            >
                                <option value="">-- Select option --</option>
                                {input.options?.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        ) : input.type === 'boolean' ? (
                            <label className="flex items-center gap-2 cursor-pointer pt-1">
                                <input 
                                    type="checkbox" 
                                    className="w-3.5 h-3.5 rounded border-gray-700 bg-gray-900 text-blue-500"
                                    checked={!!value}
                                    onChange={(e) => handleInputChange(input.key, e.target.checked)}
                                />
                                <span className="text-gray-300">Enable</span>
                            </label>
                        ) : input.type === 'number' ? (
                             <input 
                                type="number" 
                                className="w-full bg-gray-900 border border-gray-700 rounded-md p-1.5 text-white outline-none focus:border-blue-500"
                                value={value}
                                onChange={(e) => handleInputChange(input.key, parseFloat(e.target.value))}
                                placeholder={`Enter amount...`}
                            />
                        ) : (
                            <textarea 
                                className="w-full min-h-16 bg-gray-900 border border-gray-700 rounded-md p-1.5 text-white outline-none focus:border-blue-500 font-mono text-[10px] resize-y"
                                placeholder={`...`}
                                value={value}
                                onChange={(e) => handleInputChange(input.key, e.target.value)}
                            />
                        )}
                    </div>
                );
            })}
         </div>
     );
  };

  return (
    <div className={`
       relative min-w-[280px] w-[320px] rounded-xl border border-gray-800 bg-gray-950/95 backdrop-blur-xl shadow-2xl transition-[border-color,box-shadow] duration-200
       ${selected ? 'ring-2 ring-blue-500 border-blue-500 shadow-blue-500/20' : 'hover:border-gray-700 hover:shadow-xl'}
    `}>
      <Handle 
        type="target" 
        position={Position.Left} 
        id="target"
        className="!w-3 !h-3 !bg-gray-800 !border-2 !border-gray-600 hover:!bg-blue-500 hover:!border-blue-400 transition-colors"
      />
      
      <div className="flex flex-col">
        <div 
           className="flex items-center gap-3 p-3 border-b border-gray-800/80 bg-gray-900/50 rounded-t-xl cursor-default"
           onDoubleClick={() => setExpanded(!expanded)}
        >
          <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shadow-inner shrink-0 pointer-events-none">
             <img 
                 src={getIconForService(data.service)} 
                 alt={data.label}
                 draggable={false}
                 className="w-full h-full object-contain filter drop-shadow-sm pointer-events-none" 
             />
          </div>
          <div className="flex flex-col flex-1 overflow-hidden">
            <span className="text-sm font-bold text-gray-100 truncate">{data.label || data.service}</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold truncate">{data.operation?.replace(/_/g, ' ')}</span>
          </div>
          <button 
             onClick={() => setExpanded(!expanded)}
             className="p-1.5 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
          >
             {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {expanded && (
           <div className="p-3 bg-gray-950 flex flex-col gap-4 nodrag cursor-auto">
               
               <div className="custom-config-area max-h-[300px] overflow-y-auto pr-1 stylish-scrollbar">
                  {renderConfiguration()}
               </div>

               <div className="pt-3 border-t border-gray-800">
                    <button 
                        onClick={runTestNodeLocally}
                        disabled={isLocalTesting || (!profile && !isRouter)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-md hover:shadow-indigo-500/20 disabled:opacity-50 text-xs"
                    >
                        {isLocalTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        {isRouter ? 'Skip Test' : 'Test Node'}
                    </button>
                    
                    {localTestResult && (
                        <div className="mt-3 bg-black border border-gray-800 rounded-md p-2 max-h-40 overflow-y-auto">
                            <span className="text-[10px] text-green-400 font-semibold uppercase block mb-1">Result</span>
                            <pre className="text-[10px] text-green-300 font-mono whitespace-pre-wrap">{JSON.stringify(localTestResult, null, 2)}</pre>
                        </div>
                    )}
               </div>
           </div>
        )}

        {!expanded && (
            <div className="p-3 bg-gray-950 rounded-b-xl flex flex-col gap-2 border-t border-transparent">
                {data.selectedAccounts ? (
                   <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      <span className="text-xs text-gray-300 font-mono truncate max-w-[180px]">Connected</span>
                   </div>
                ) : isRouter ? (
                   <div className="flex items-center justify-between text-xs text-blue-400 font-mono bg-blue-500/10 px-2 py-1 rounded">
                      <span>{(inputs.rules || []).length} Rules</span>
                      <span>Branching Logic</span>
                   </div>
                ) : (
                   <div className="flex items-center gap-2 opacity-50">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500/50"></span>
                      <span className="text-[10px] text-gray-500 italic">Unconfigured</span>
                   </div>
                )}
            </div>
        )}
      </div>

      {!isRouter && (
          <Handle 
            type="source" 
            position={Position.Right} 
            id="default"
            className="!w-3 !h-3 !bg-gray-800 !border-2 !border-gray-600 hover:!bg-blue-500 hover:!border-blue-400 transition-colors"
          />
      )}
    </div>
  );
});

export default DynamicNode;
