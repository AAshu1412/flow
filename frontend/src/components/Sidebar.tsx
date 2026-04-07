import React, { useState, useEffect } from 'react';
import { Loader2, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { useUserStore } from '../store/userStore';

import { useReactFlow } from '@xyflow/react';
import { useDnD } from './DnDContext';

const getIconForService = (service: string) => {
    const s = service.toLowerCase();
    if (s.includes('discord')) return "https://img.icons8.com/?size=100&id=30998&format=png&color=000000";
    if (s.includes('gemini')) return "https://img.icons8.com/?size=100&id=eoxMN35Z6JKg&format=png&color=000000";
    if (s.includes('gmail')) return "https://img.icons8.com/?size=100&id=P7UIlhbpWzZm&format=png&color=000000";
    if (s.includes('drive')) return "https://img.icons8.com/?size=100&id=ya4CrqO7PgnY&format=png&color=000000";
    if (s.includes('doc')) return "https://img.icons8.com/?size=100&id=30464&format=png&color=000000";
    if (s.includes('form')) return "https://img.icons8.com/?size=100&id=E4VmOrv6BZqd&format=png&color=000000";
    if (s.includes('meet')) return "https://img.icons8.com/?size=100&id=pE97I4t7Il9M&format=png&color=000000";
    if (s.includes('sheet')) return "https://img.icons8.com/?size=100&id=30461&format=png&color=000000";
    if (s.includes('notion')) return "https://img.icons8.com/?size=100&id=F6H2fsqXKBwH&format=png&color=000000";
    return "https://img.icons8.com/?size=100&id=45557&format=png&color=000000";
};

export default function Sidebar() {
  console.log('[DEBUG] <Sidebar> Rendered');
  const { availableNodesMenu, isMenuLoading, getAvailableNodesMenu } = useUserStore();
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});
  const { setNodes } = useReactFlow();
  const [_, setDraggedType] = useDnD();

  useEffect(() => {
    if (!availableNodesMenu) {
      console.log('[DEBUG] <Sidebar> availableNodesMenu is missing, fetching...');
      getAvailableNodesMenu().catch(err => console.error('[DEBUG] <Sidebar> Error fetching nodes menu:', err));
    } else {
      console.log('[DEBUG] <Sidebar> availableNodesMenu loaded:', availableNodesMenu);
    }
  }, [availableNodesMenu, getAvailableNodesMenu]);

  const toggleService = (service: string) => {
    console.log('[DEBUG] <Sidebar> toggling expand menu for service:', service);
    setExpandedServices(prev => ({ ...prev, [service]: !prev[service] }));
  };

const generateNodeId = () => `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, serviceBlock: any, operation: string) => {
    const payload = {
      service: serviceBlock.service,
      operation: operation,
      label: serviceBlock.label
    };
    console.log('[DEBUG] <Sidebar> onDragStart:', payload);
    setDraggedType(payload);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleAddNodeClick = (serviceBlock: any, operation: string) => {
      console.log(`[DEBUG] <Sidebar> manual click to add node: service=${serviceBlock.service}, operation=${operation}`);
      const newNode = {
        id: generateNodeId(),
        type: 'dynamic',
        position:{x:Math.random()*500,y:Math.random()*500},
        data: {
          service: serviceBlock.service,
          operation: operation,
          label: serviceBlock.label,
          selectedAccounts: '',
          inputs: {},
        },
      };
      setNodes((nds: any) => nds.concat(newNode));
  };
  return (
    <aside className="w-80 border-r border-gray-800 bg-gray-950/95 backdrop-blur-md flex flex-col h-full overflow-y-auto">
      <div className="p-5 border-b border-gray-800 sticky top-0 bg-gray-950/95 backdrop-blur-md z-10 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-200 tracking-wider">INTEGRATIONS</h2>
      </div>
      
      <div className="p-3">
        {isMenuLoading ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-400 gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-xs font-medium">Loading schema...</span>
          </div>
        ) : availableNodesMenu ? (
          <div className="flex flex-col gap-1">
            {availableNodesMenu.map((categoryBlock) => (
              <div key={categoryBlock.category} className="mb-3">
                 <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">{categoryBlock.category}</div>
                 {categoryBlock.services.map((serviceBlock) => {
                    const isExpanded = expandedServices[serviceBlock.service];
                    return (
                        <div key={serviceBlock.service} className="flex flex-col mb-1 border border-transparent hover:border-gray-800 rounded-xl transition-all overflow-hidden bg-gray-900/20">
                          <button 
                            onClick={() => toggleService(serviceBlock.service)}
                            className="flex w-full items-center justify-between p-3 hover:bg-gray-800/80 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-white p-1 flex items-center justify-center shadow-lg">
                                <img 
                                  src={getIconForService(serviceBlock.service)} 
                                  alt={serviceBlock.label}
                                  className="w-full h-full object-contain filter drop-shadow-sm" 
                                />
                              </div>
                              <span className="font-semibold text-gray-200 text-sm tracking-wide">{serviceBlock.label}</span>
                            </div>
                            <div className="text-gray-500">
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="flex flex-col bg-black/40 border-t border-gray-800/50 p-2 gap-1.5">
                              {serviceBlock.operations.map((op: any) => {
                                const opId = typeof op === 'string' ? op : (op.id || '');
                                const opLabel = typeof op === 'string' ? op.replace(/_/g, ' ') : (op.label || opId.replace(/_/g, ' '));
                                const opDescription = typeof op === 'string' ? null : op.description;
                                
                                return (
                                <div 
                                  key={opId}
                                  className="group flex flex-col p-2.5 rounded-lg border border-gray-800/50 bg-gray-900/50 hover:bg-gray-800 hover:border-blue-500/30 hover:shadow-md hover:shadow-blue-900/20 transition-all cursor-grab active:cursor-grabbing relative"
                                  draggable
                                  onDragStart={(e) =>{ onDragStart(e, serviceBlock, opId)}}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                     <span className="text-xs font-bold text-gray-300 capitalize group-hover:text-blue-400 transition-colors">
                                       {opLabel}
                                     </span>
                                     <button
                                       onClick={() => {
                                        console.log("serviceBlock: "+JSON.stringify(serviceBlock));
                                        console.log("opId: "+opId);
                                        handleAddNodeClick(serviceBlock, opId)}} 
                                       className="opacity-0 group-hover:opacity-100 p-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white rounded transition-all"
                                       title="Click to add"
                                     >
                                       <Plus className="w-3 h-3" />
                                     </button>
                                  </div>
                                  
                                  {opDescription && (
                                    <span className="text-[10px] text-gray-500 leading-tight">
                                      {opDescription}
                                    </span>
                                  )}
                                </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                    );
                 })}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500 text-xs">No integrations available</div>
        )}
      </div>
    </aside>
  );
}
