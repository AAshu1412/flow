import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2, AlertTriangle, Lock } from 'lucide-react';

interface SaveWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
  onSave: (data: { workflowId: string; name: string; description: string }) => Promise<void>;
}

export default function SaveWorkflowModal({ isOpen, onClose, workflowId, onSave }: SaveWorkflowModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        workflowId,
        name: name.trim() || 'Untitled Workflow',
        description: description.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save workflow');
    }
    setIsSaving(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Save className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-100">Save Workflow</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-5">
          {/* Workflow ID — READ ONLY with explanation */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              Workflow ID (Permanent)
            </label>
            <div className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-gray-400 font-mono flex items-center gap-2">
              <span className="truncate">{workflowId}</span>
            </div>
            <div className="mt-2 flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-300/80 leading-relaxed">
                This ID is <strong>permanent and unique</strong>. It was auto-generated when you started this workflow. 
                Once saved, it cannot be changed. The ID near "Flow" in the topbar is for display only during this session — 
                it does <strong>not</strong> change the saved workflow ID. If you need a different ID, create a new workflow.
              </p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">
              Workflow Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Daily Report Generator"
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-colors placeholder-gray-600"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">
              Description <span className="text-gray-600">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this workflow do?"
              rows={3}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-colors resize-none placeholder-gray-600"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-xs text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Workflow</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
