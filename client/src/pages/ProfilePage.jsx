// src/pages/ProfilePage.jsx
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { FiUser, FiMail } from 'react-icons/fi';
import { HiOutlineBell, HiOutlineComputerDesktop, HiOutlineCloudArrowUp } from 'react-icons/hi2';

import Input from '../components/common/Input';
import Button from '../components/common/Button';

import { selectCurrentUser } from '../redux/slices/authSlice';
import { updateProfile, selectProfileUpdateStatus, selectPreferences, setPreference } from '../redux/slices/profileSlice';
import { useDispatch } from 'react-redux';
import { getInitials } from '../utils/helpers';
import useUI from '../hooks/useUI';

const PreferenceToggle = ({ icon: Icon, label, description, checked, onChange }) => (
  <div className="flex items-center justify-between border-b border-slate-100 py-4 last:border-b-0">
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-5 w-5 text-slate-400" />
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-indigo-600' : 'bg-slate-200'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  </div>
);

const ProfilePage = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const updateStatus = useSelector(selectProfileUpdateStatus);
  const preferences = useSelector(selectPreferences);
  const { notify } = useUI();

  const [name, setName] = useState(user?.name || '');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const result = await dispatch(updateProfile({ name }));
    if (updateProfile.fulfilled.match(result)) {
      notify('Profile updated', 'success');
    } else {
      notify(result.payload || 'Could not update profile', 'error');
    }
  };

  const handleTogglePreference = (key, value) => {
    dispatch(setPreference({ key, value }));
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Profile & settings</h1>

      {/* Profile card */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-semibold text-indigo-700">
            {getInitials(user?.name)}
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
          <Input
            label="Full name"
            name="name"
            icon={FiUser}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email"
            name="email"
            icon={FiMail}
            value={user?.email || ''}
            disabled
            hint="Contact support to change your email address"
          />
          <div className="flex justify-end">
            <Button type="submit" isLoading={updateStatus === 'loading'}>
              Save changes
            </Button>
          </div>
        </form>
      </div>

      {/* Preferences card */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <h2 className="text-base font-semibold text-slate-900">Preferences</h2>
        <div className="mt-2">
          <PreferenceToggle
            icon={HiOutlineBell}
            label="Email notifications"
            description="Get notified when someone comments or shares a document"
            checked={preferences.emailNotifications}
            onChange={(v) => handleTogglePreference('emailNotifications', v)}
          />
          <PreferenceToggle
            icon={HiOutlineComputerDesktop}
            label="Desktop notifications"
            description="Show a system notification for real-time activity"
            checked={preferences.desktopNotifications}
            onChange={(v) => handleTogglePreference('desktopNotifications', v)}
          />
          <PreferenceToggle
            icon={HiOutlineCloudArrowUp}
            label="Autosave"
            description="Automatically save changes as you type"
            checked={preferences.autoSaveEnabled}
            onChange={(v) => handleTogglePreference('autoSaveEnabled', v)}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;