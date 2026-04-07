import { ReactFlowProvider } from '@xyflow/react';
import FlowCanvas from '../components/FlowCanvas';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { DnDProvider } from '../components/DnDContext';
import NodeDetailPanel from '../components/NodeDetailPanel';

export default function Dashboard() {
    return (
        <div className="flex h-screen w-full bg-gray-950 text-white overflow-hidden">
            <ReactFlowProvider>
                <DnDProvider>
                    {/* Left Sidebar Menu */}
                    <Sidebar />

                    {/* Main Content Area */}
                    <div className="flex flex-col flex-1 relative min-w-0">
                        <Topbar />
                        <div className="flex-1 relative">
                            <FlowCanvas />
                        </div>
                    </div>

                    {/* Right Detail Panel */}
                    <NodeDetailPanel />
                </DnDProvider>
            </ReactFlowProvider>
        </div>
    );
}
