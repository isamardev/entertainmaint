import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export function AdminSettingsForm() {
  const { user, updateEmail, updatePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState(user?.email ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);

  useEffect(() => {
    setNewEmail(user?.email ?? "");
  }, [user?.email]);

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setEmailErr(null);
    if (!currentPassword) {
      setEmailErr("Current password is required.");
      return;
    }
    if (!newEmail.trim()) {
      setEmailErr("New email is required.");
      return;
    }
    if (newEmail === user?.email) {
      setEmailErr("New email must be different from the current one.");
      return;
    }
    setEmailBusy(true);
    const result = await updateEmail(newEmail.trim(), currentPassword);
    setEmailBusy(false);
    if (result.error) {
      setEmailErr(result.error);
      toast.error("Failed to update username.");
    } else {
      toast.success("Username updated successfully.");
      setCurrentPassword("");
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordErr(null);
    if (!currentPassword) {
      setPasswordErr("Current password is required.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordErr("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErr("New passwords do not match.");
      return;
    }
    setPasswordBusy(true);
    const result = await updatePassword(newPassword, currentPassword);
    setPasswordBusy(false);
    if (result.error) {
      setPasswordErr(result.error);
      toast.error("Failed to update password.");
    } else {
      toast.success("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  return (
    <div>
      <div className="mb-5">
        <div className="eyebrow">Account Settings</div>
        <h2 className="display text-2xl font-black uppercase text-black">Account Security</h2>
        <p className="mt-1 text-sm text-gray-600">
          Update your admin username (email) or password. Your current password is required for
          both actions as a security measure.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={handleEmailChange} className="space-y-3 border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs font-black uppercase tracking-widest text-black">Change Username</div>
          <p className="text-xs text-gray-600">Current: {user?.email}</p>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            className="w-full border border-gray-300 bg-white px-3 py-2 outline-none focus:border-black"
          />
          <input
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="New email / username"
            className="w-full border border-gray-300 bg-white px-3 py-2 outline-none focus:border-black"
          />
          {emailErr && <div className="text-xs text-red-600">{emailErr}</div>}
          <button
            type="submit"
            disabled={emailBusy}
            className="w-full py-2 font-black uppercase tracking-widest bg-black text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {emailBusy ? "Updating…" : "Update Username"}
          </button>
        </form>

        <form onSubmit={handlePasswordChange} className="space-y-3 border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs font-black uppercase tracking-widest text-black">Change Password</div>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            className="w-full border border-gray-300 bg-white px-3 py-2 outline-none focus:border-black"
          />
          <input
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full border border-gray-300 bg-white px-3 py-2 outline-none focus:border-black"
          />
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full border border-gray-300 bg-white px-3 py-2 outline-none focus:border-black"
          />
          {passwordErr && <div className="text-xs text-red-600">{passwordErr}</div>}
          <button
            type="submit"
            disabled={passwordBusy}
            className="w-full py-2 font-black uppercase tracking-widest bg-black text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {passwordBusy ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
