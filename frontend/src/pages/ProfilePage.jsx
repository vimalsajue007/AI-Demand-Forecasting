import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import toast from "react-hot-toast";
import { MdPerson, MdLock, MdSave, MdBadge, MdEmail, MdCalendarToday } from "react-icons/md";

export default function ProfilePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("info");
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const [infoForm, setInfoForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
  });

  const [pwdForm, setPwdForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      await api.patch("/api/auth/me", infoForm);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Update failed");
    } finally {
      setSavingInfo(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.new_password !== pwdForm.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }
    if (pwdForm.new_password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSavingPwd(true);
    try {
      await api.post("/api/auth/change-password", {
        current_password: pwdForm.current_password,
        new_password: pwdForm.new_password,
      });
      toast.success("Password changed!");
      setPwdForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Password change failed");
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="page-title">Profile & Settings</h1>
        <p className="text-primary-500 text-sm mt-1">Manage your account details</p>
      </div>

      {/* User card */}
      <div className="glass-card p-5 flex items-center gap-4">
        <div className="w-14 h-14 bg-primary-200 rounded-2xl flex items-center justify-center flex-shrink-0">
          <MdPerson className="text-primary-700 text-3xl" />
        </div>
        <div>
          <p className="font-display font-bold text-primary-900 text-lg">
            {user?.full_name || user?.username}
          </p>
          <div className="flex items-center gap-4 mt-1 text-xs text-primary-500">
            <span className="flex items-center gap-1">
              <MdBadge /> {user?.username}
            </span>
            <span className="flex items-center gap-1">
              <MdEmail /> {user?.email}
            </span>
            <span className="flex items-center gap-1">
              <MdCalendarToday /> Joined {user?.created_at?.slice(0, 10)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-primary-100 p-1 rounded-xl w-fit">
        {[
          { key: "info", label: "Account Info", icon: MdPerson },
          { key: "security", label: "Security", icon: MdLock },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
              ${tab === key
                ? "bg-white text-primary-900 shadow-sm"
                : "text-primary-600 hover:text-primary-800"
              }`}
          >
            <Icon className="text-base" /> {label}
          </button>
        ))}
      </div>

      {/* Account Info */}
      {tab === "info" && (
        <div className="glass-card p-6 animate-fade-in">
          <h2 className="section-title mb-5">Account Information</h2>
          <form onSubmit={handleSaveInfo} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                className="input-field"
                value={infoForm.full_name}
                onChange={(e) => setInfoForm({ ...infoForm, full_name: e.target.value })}
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                value={infoForm.email}
                onChange={(e) => setInfoForm({ ...infoForm, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label">Username</label>
              <input
                className="input-field bg-primary-50 cursor-not-allowed"
                value={user?.username || ""}
                disabled
              />
              <p className="text-xs text-primary-400 mt-1">Username cannot be changed</p>
            </div>
            <button
              type="submit"
              disabled={savingInfo}
              className="btn-primary flex items-center gap-2"
            >
              {savingInfo ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <MdSave />
              )}
              {savingInfo ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>
      )}

      {/* Security */}
      {tab === "security" && (
        <div className="glass-card p-6 animate-fade-in">
          <h2 className="section-title mb-5">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input
                type="password"
                className="input-field"
                value={pwdForm.current_password}
                onChange={(e) => setPwdForm({ ...pwdForm, current_password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                className="input-field"
                value={pwdForm.new_password}
                onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                placeholder="Min. 6 characters"
              />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                className="input-field"
                value={pwdForm.confirm_password}
                onChange={(e) => setPwdForm({ ...pwdForm, confirm_password: e.target.value })}
                placeholder="Repeat new password"
              />
            </div>
            <button
              type="submit"
              disabled={savingPwd}
              className="btn-primary flex items-center gap-2"
            >
              {savingPwd ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <MdLock />
              )}
              {savingPwd ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
