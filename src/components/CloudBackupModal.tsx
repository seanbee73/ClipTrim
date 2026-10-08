import React, { useState, useRef } from 'react';
import {
  X,
  Cloud,
  CloudUpload,
  Download,
  Trash2,
  RotateCcw,
  CheckCircle,
  HardDrive,
  FileJson,
  Upload,
} from 'lucide-react';
import { VideoProject } from '../types';
import {
  CloudBackupItem,
  getStoredBackups,
  saveProjectToCloud,
  deleteCloudBackup,
  exportBackupToFile,
  parseBackupFile,
} from '../utils/cloudStorage';
import { formatTimecode } from '../utils/timeFormat';

interface CloudBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: VideoProject;
  onRestoreProject: (restored: VideoProject) => void;
  captureThumbnail: () => string | undefined;
}

export const CloudBackupModal: React.FC<CloudBackupModalProps> = ({
  isOpen,
  onClose,
  project,
  onRestoreProject,
  captureThumbnail,
}) => {
  const [backups, setBackups] = useState<CloudBackupItem[]>(getStoredBackups());
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleBackupNow = () => {
    const thumb = captureThumbnail();
    const newBackup = saveProjectToCloud(project, thumb);
    setBackups(getStoredBackups());
    setStatusMessage(`Saved backup for "${project.name}"`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDelete = (id: string) => {
    deleteCloudBackup(id);
    setBackups(getStoredBackups());
  };

  const handleRestore = (item: CloudBackupItem) => {
    onRestoreProject(item.projectData);
    setStatusMessage(`Restored project state from ${new Date(item.timestamp).toLocaleTimeString()}`);
    setTimeout(() => {
      setStatusMessage(null);
      onClose();
    }, 1000);
  };

  const handleExportFile = (item: CloudBackupItem) => {
    exportBackupToFile(item);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const imported = parseBackupFile(content);
          saveProjectToCloud(imported.projectData, imported.thumbnailUrl);
          setBackups(getStoredBackups());
          onRestoreProject(imported.projectData);
          setStatusMessage(`Imported and restored "${imported.projectName}"`);
        } catch (err) {
          console.error(err);
          setStatusMessage('Failed to import backup file. Invalid format.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Cloud className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Cloud Backup Vault</h3>
              <p className="text-xs text-slate-400">
                Sync trim states, crops, text layers, and scene points safely
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status Alert */}
          {statusMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-300">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Sync & Backup Actions Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5 text-blue-400" />
                  Cloud Sync Status
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  15 GB Free Cloud Storage Vault · Auto-versioning active
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300">
                  {cloudSyncEnabled ? 'Cloud Sync On' : 'Sync Paused'}
                </span>
                <button
                  type="button"
                  onClick={() => setCloudSyncEnabled(!cloudSyncEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    cloudSyncEnabled ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      cloudSyncEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={handleBackupNow}
                className="flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-500 active:scale-95"
              >
                <CloudUpload className="h-4 w-4" />
                <span>Save Backup Now</span>
              </button>

              <button
                onClick={() => importFileRef.current?.click()}
                className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Import JSON</span>
              </button>

              <input
                ref={importFileRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>
          </div>

          {/* Stored Backups List */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Stored Cloud Snapshots ({backups.length})
            </h4>

            {backups.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
                No cloud backups yet. Click &quot;Save Backup Now&quot; to preserve your current trim & edits.
              </div>
            ) : (
              <div className="space-y-2.5">
                {backups.map((item) => {
                  const bDate = new Date(item.timestamp);
                  const formattedDate = `${bDate.toLocaleDateString()} at ${bDate.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`;

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3 transition-colors hover:border-slate-700 hover:bg-slate-800/40"
                    >
                      <div className="flex items-center gap-3">
                        {/* Thumbnail */}
                        <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-black border border-slate-800">
                          {item.thumbnailUrl ? (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.projectName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-600">
                              Snapshot
                            </div>
                          )}
                          <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[9px] font-mono text-white">
                            {formatTimecode(item.projectData.trimEnd - item.projectData.trimStart)}
                          </span>
                        </div>

                        {/* Details */}
                        <div>
                          <div className="text-xs font-semibold text-white truncate max-w-[200px]">
                            {item.projectName}
                          </div>
                          <div className="text-[11px] text-slate-400">{formattedDate}</div>
                          <div className="text-[10px] font-mono text-slate-500">
                            Trim: {formatTimecode(item.projectData.trimStart)} -{' '}
                            {formatTimecode(item.projectData.trimEnd)} · {item.sizeKb} KB
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          onClick={() => handleRestore(item)}
                          className="flex min-h-[36px] items-center gap-1 rounded-lg bg-blue-600/90 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500 shadow"
                          title="Restore this backup"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Restore</span>
                        </button>

                        <button
                          onClick={() => handleExportFile(item)}
                          className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-slate-800 bg-slate-800 p-1.5 text-slate-400 hover:text-white"
                          title="Download backup archive (.json)"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-slate-800 bg-slate-800 p-1.5 text-slate-400 hover:text-red-400"
                          title="Delete snapshot"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 px-5 py-4">
          <button
            onClick={onClose}
            className="min-h-[44px] rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
