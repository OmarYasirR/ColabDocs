import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiUser, FiMail, FiAlertCircle, FiX } from "react-icons/fi";
import {
  HiOutlineBell,
  HiOutlineComputerDesktop,
  HiOutlineCloudArrowUp,
} from "react-icons/hi2";

import Input from "../components/common/Input";
import Button from "../components/common/Button";

import {
  selectCurrentUser,
  updateCurrentUser,
} from "../redux/slices/authSlice";
import {
  updateProfile,
  selectProfileUpdateStatus,
  selectProfileUpdateError,
  selectPreferences,
  setPreference,
  clearProfileError,
} from "../redux/slices/profileSlice";
import { getInitials } from "../utils/helpers";
import useUI from "../hooks/useUI";
import { validateMaxLength, validateRequired } from "../utils/validators";

const PreferenceToggle = ({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}) => (
  <div className="flex items-center justify-between border-b border-slate-100 py-4 last:border-b-0">
    <div className="flex items-start gap-3 pr-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
        checked ? "bg-indigo-600" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

const ProfilePage = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const updateStatus = useSelector(selectProfileUpdateStatus);
  const updateError = useSelector(selectProfileUpdateError);
  const preferences = useSelector(selectPreferences);
  const { notify } = useUI();

  const [name, setName] = useState(user?.name || "");
  const [nameError, setNameError] = useState(null);

  const isLoading = updateStatus === "loading";
  const initials = useMemo(() => getInitials(user?.name), [user?.name]);

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!validateRequired(name)) {
      setNameError("Name is required");
      return;
    }
    if (!validateMaxLength(name, 80)) {
      setNameError("Name must be 80 characters or fewer");
      return;
    }
    setNameError(null);

    const result = await dispatch(updateProfile({ name: name.trim() }));
    if (updateProfile.fulfilled.match(result)) {
      const updatedUser = result.payload?.user || result.payload;
      if (updatedUser) dispatch(updateCurrentUser(updatedUser));
      notify("Profile updated", "success");
    } else {
      notify(result.payload || "Could not update profile", "error");
    }
  };

  const handleTogglePreference = (key, value) => {
    dispatch(setPreference({ key, value }));
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
        Profile &amp; settings
      </h1>

      {/* ── Profile card ─────────────────────────────────────────── */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-lg font-semibold text-indigo-700 sm:h-16 sm:w-16 sm:text-xl">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900">
              {user?.name || "Account"}
            </p>
            <p className="truncate text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>

        <form
          onSubmit={handleSaveProfile}
          className="mt-6 space-y-4"
          noValidate
        >
          {updateError && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex animate-slide-up items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
            >
              <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">{updateError}</span>
              <button
                type="button"
                onClick={() => dispatch(clearProfileError())}
                className="-m-0.5 rounded-md p-0.5 text-rose-400 transition-colors hover:bg-rose-100 hover:text-rose-600"
                aria-label="Dismiss error"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          )}

          <Input
            label="Full name"
            name="name"
            icon={FiUser}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(null);
              if (updateError) dispatch(clearProfileError());
            }}
            error={nameError}
            maxLength={80}
            autoComplete="name"
          />

          <Input
            label="Email"
            name="email"
            type="email"
            icon={FiMail}
            value={user?.email || ""}
            disabled
            hint="Contact support to change your email address"
            autoComplete="email"
          />

          <div className="flex justify-end">
            <Button type="submit" isLoading={isLoading} disabled={isLoading}>
              Save changes
            </Button>
          </div>
        </form>
      </div>

      {/* ── Preferences card ─────────────────────────────────────── */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">Preferences</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          These settings apply to this browser.
        </p>
        <div className="mt-2">
          <PreferenceToggle
            icon={HiOutlineBell}
            label="Email notifications"
            description="Get notified when someone comments or shares a document"
            checked={preferences.emailNotifications}
            onChange={(v) => handleTogglePreference("emailNotifications", v)}
          />
          <PreferenceToggle
            icon={HiOutlineComputerDesktop}
            label="Desktop notifications"
            description="Show a system notification for real-time activity"
            checked={preferences.desktopNotifications}
            onChange={(v) => handleTogglePreference("desktopNotifications", v)}
          />
          <PreferenceToggle
            icon={HiOutlineCloudArrowUp}
            label="Autosave"
            description="Automatically save changes as you type"
            checked={preferences.autoSaveEnabled}
            onChange={(v) => handleTogglePreference("autoSaveEnabled", v)}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
