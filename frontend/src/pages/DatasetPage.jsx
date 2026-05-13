import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { datasetsAPI } from "../services/api";
import toast from "react-hot-toast";
import {
  MdUpload,
  MdStorage,
  MdDelete,
  MdPreview,
  MdCheckCircle,
  MdError,
  MdHourglassTop,
  MdClose,
} from "react-icons/md";

function StatusIcon({ status }) {
  if (status === "processed") return <MdCheckCircle className="text-primary-500" />;
  if (status === "error") return <MdError className="text-red-400" />;
  return <MdHourglassTop className="text-yellow-400" />;
}

export default function DatasetPage() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchDatasets = () =>
    datasetsAPI
      .list()
      .then((r) => setDatasets(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { fetchDatasets(); }, []);

  const onDrop = useCallback((accepted) => {
    const f = accepted[0];
    if (f) {
      setFile(f);
      if (!name) setName(f.name.replace(/\.[^/.]+$/, ""));
    }
  }, [name]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file || !name.trim()) {
      toast.error("Please select a file and provide a name");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", name.trim());
    setUploading(true);
    try {
      await datasetsAPI.upload(fd);
      toast.success("Dataset uploaded and processed!");
      setFile(null);
      setName("");
      fetchDatasets();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this dataset?")) return;
    try {
      await datasetsAPI.delete(id);
      toast.success("Dataset deleted");
      setDatasets((prev) => prev.filter((d) => d.id !== id));
      if (preview?.id === id) setPreview(null);
    } catch {
      toast.error("Delete failed");
    }
  };

  const handlePreview = async (id) => {
    setPreviewLoading(true);
    try {
      const r = await datasetsAPI.preview(id);
      setPreview({ id, ...r.data });
    } catch {
      toast.error("Could not load preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Datasets</h1>
        <p className="text-primary-500 text-sm mt-1">Upload and manage your sales datasets</p>
      </div>

      {/* Upload Card */}
      <div className="glass-card p-6">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <MdUpload className="text-primary-500" />
          Upload Dataset
        </h2>
        <div className="space-y-4">
          <div>
            <label className="label">Dataset Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Q3 Sales 2024"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
              ${isDragActive
                ? "border-primary-400 bg-primary-50"
                : "border-primary-200 hover:border-primary-400 hover:bg-primary-50/50"
              }
              ${file ? "border-primary-400 bg-primary-50" : ""}`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <MdCheckCircle className="text-primary-500 text-2xl" />
                <div className="text-left">
                  <p className="font-medium text-primary-900 text-sm">{file.name}</p>
                  <p className="text-xs text-primary-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="ml-2 text-primary-400 hover:text-red-400"
                >
                  <MdClose />
                </button>
              </div>
            ) : (
              <div>
                <MdUpload className="text-primary-300 text-4xl mx-auto mb-2" />
                <p className="text-primary-600 font-medium text-sm">
                  {isDragActive ? "Drop your file here" : "Drag & drop or click to select"}
                </p>
                <p className="text-primary-400 text-xs mt-1">CSV, XLSX, or XLS • Max 50MB</p>
              </div>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="btn-primary flex items-center gap-2"
          >
            {uploading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {uploading ? "Uploading…" : "Upload & Process"}
          </button>
        </div>
      </div>

      {/* Datasets list */}
      <div className="glass-card p-5">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <MdStorage className="text-primary-500" />
          Your Datasets
          <span className="ml-auto text-xs font-normal text-primary-400">{datasets.length} total</span>
        </h2>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-primary-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : datasets.length === 0 ? (
          <p className="text-center text-primary-400 text-sm py-10">No datasets yet. Upload your first one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-100">
                  <th className="table-th">Name</th>
                  <th className="table-th">File</th>
                  <th className="table-th">Rows</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Uploaded</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((ds) => (
                  <tr key={ds.id} className="border-b border-primary-50 hover:bg-primary-50/50 transition-colors">
                    <td className="table-td font-medium">{ds.name}</td>
                    <td className="table-td text-xs text-primary-400 font-mono">{ds.filename}</td>
                    <td className="table-td">{ds.rows_count.toLocaleString()}</td>
                    <td className="table-td">
                      <span className="flex items-center gap-1.5">
                        <StatusIcon status={ds.status} />
                        <span className="text-xs capitalize">{ds.status}</span>
                      </span>
                    </td>
                    <td className="table-td text-primary-400">{ds.created_at?.slice(0, 10)}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePreview(ds.id)}
                          className="text-primary-500 hover:text-primary-700 transition-colors"
                          title="Preview"
                        >
                          <MdPreview className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleDelete(ds.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <MdDelete className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview panel */}
      {(preview || previewLoading) && (
        <div className="glass-card p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Dataset Preview</h2>
            <button onClick={() => setPreview(null)} className="text-primary-400 hover:text-primary-600">
              <MdClose className="text-xl" />
            </button>
          </div>
          {previewLoading ? (
            <div className="h-32 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div>
              <div className="flex gap-4 mb-3 text-xs text-primary-500">
                <span>
                  Shape: <strong className="text-primary-800">{preview.shape?.rows} × {preview.shape?.cols}</strong>
                </span>
                <span>
                  Columns: <strong className="text-primary-800">{preview.columns?.join(", ")}</strong>
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-primary-100">
                <table className="w-full text-xs">
                  <thead className="bg-primary-50">
                    <tr>
                      {preview.columns?.map((col) => (
                        <th key={col} className="px-3 py-2 text-left font-semibold text-primary-600 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.preview?.map((row, i) => (
                      <tr key={i} className="border-t border-primary-50 hover:bg-primary-50/50">
                        {preview.columns?.map((col) => (
                          <td key={col} className="px-3 py-2 text-primary-700 whitespace-nowrap">
                            {String(row[col] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
