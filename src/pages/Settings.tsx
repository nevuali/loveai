import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
  const userName = localStorage.getItem('userName') || 'Jane Doe';
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [marketing, setMarketing] = useState(true);
  const [twoFA, setTwoFA] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('userMockAuthenticated');
    navigate('/');
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-cappalove-peach/30 via-white to-cappalove-blue/20 px-2 py-4 sm:py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-3 left-3 z-50 p-3 bg-white/90 rounded-full shadow-lg hover:bg-cappalove-peach/40 transition-colors border border-cappalove-peach/40 sm:absolute sm:top-6 sm:left-6"
        aria-label="Back to Home"
      >
        <ChevronLeft className="h-7 w-7 text-cappalove-darkblue" />
      </button>
      {/* Profile Card */}
      <div className="w-full max-w-xl mb-7 px-1 sm:px-0">
        <div className="bg-white/95 rounded-3xl shadow-2xl p-6 flex flex-col items-center gap-4 border border-cappalove-peach/40">
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}`} alt="Profile" className="w-24 h-24 rounded-full border-2 border-cappalove-peach/60 shadow-lg" />
          <div className="w-full text-center">
            <div className="font-bold text-2xl text-cappalove-darkblue mb-1">{userName}</div>
            <div className="text-base text-gray-600 mb-1">{userEmail}</div>
            <div className="text-xs text-gray-400">@janedoe</div>
          </div>
          <button className="w-full mt-2 text-base px-4 py-3 rounded-full bg-cappalove-peach/60 text-cappalove-darkblue font-semibold hover:bg-cappalove-peach/80 transition shadow">Edit Profile</button>
        </div>
      </div>

      {/* Settings Cards Grid */}
      <div className="w-full max-w-xl flex flex-col gap-5 md:grid md:grid-cols-2 md:gap-6">
        {/* Account */}
        <div className="bg-gradient-to-br from-cappalove-peach/30 to-cappalove-blue/20 rounded-2xl shadow-xl p-5 flex flex-col gap-3 border border-cappalove-peach/30 mb-2 md:mb-0">
          <h2 className="font-semibold text-lg text-cappalove-darkblue mb-2">Account</h2>
          <button className="love-gradient-button w-full py-3 rounded-full font-semibold text-base shadow hover:scale-105 transition-all">Change Password</button>
          <button className="love-gradient-button w-full py-3 rounded-full font-semibold text-base shadow hover:scale-105 transition-all">Change Email</button>
          <button className="w-full py-3 rounded-full font-semibold text-base bg-red-100 text-red-600 hover:bg-red-200 transition-all">Delete Account</button>
        </div>
        {/* Notifications */}
        <div className="bg-gradient-to-br from-cappalove-blue/20 to-cappalove-peach/20 rounded-2xl shadow-xl p-5 flex flex-col gap-3 border border-cappalove-blue/30 mb-2 md:mb-0">
          <h2 className="font-semibold text-lg text-cappalove-darkblue mb-2">Notifications</h2>
          <label className="flex items-center gap-3 cursor-pointer text-base">
            <input type="checkbox" checked={emailNotif} onChange={() => setEmailNotif(v => !v)} className="accent-cappalove-peach w-5 h-5" />
            <span>Email Notifications</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer text-base">
            <input type="checkbox" checked={smsNotif} onChange={() => setSmsNotif(v => !v)} className="accent-cappalove-peach w-5 h-5" />
            <span>SMS Notifications</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer text-base">
            <input type="checkbox" checked={marketing} onChange={() => setMarketing(v => !v)} className="accent-cappalove-peach w-5 h-5" />
            <span>Marketing Preferences</span>
          </label>
        </div>
        {/* Theme & Security */}
        <div className="bg-gradient-to-br from-cappalove-peach/20 to-cappalove-blue/20 rounded-2xl shadow-xl p-5 flex flex-col gap-3 border border-cappalove-peach/30 mb-2 md:mb-0">
          <h2 className="font-semibold text-lg text-cappalove-darkblue mb-2">Theme & Security</h2>
          <label className="flex items-center gap-3 cursor-pointer text-base">
            <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(v => !v)} className="accent-cappalove-blue w-5 h-5" />
            <span>Dark Mode</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer text-base">
            <input type="checkbox" checked={twoFA} onChange={() => setTwoFA(v => !v)} className="accent-cappalove-blue w-5 h-5" />
            <span>Two-Factor Authentication (2FA)</span>
          </label>
          <button className="love-gradient-button w-full py-3 rounded-full font-semibold text-base shadow hover:scale-105 transition-all">Manage Sessions</button>
        </div>
        {/* Support & About */}
        <div className="bg-gradient-to-br from-cappalove-blue/20 to-cappalove-peach/20 rounded-2xl shadow-xl p-5 flex flex-col gap-3 border border-cappalove-blue/30 mb-2 md:mb-0">
          <h2 className="font-semibold text-lg text-cappalove-darkblue mb-2">Support & About</h2>
          <a href="#" className="love-gradient-button w-full py-3 rounded-full font-semibold text-base shadow text-center">FAQ</a>
          <a href="#" className="love-gradient-button w-full py-3 rounded-full font-semibold text-base shadow text-center">Contact Support</a>
          <div className="text-xs text-gray-400 text-center mt-2">Version: 1.0.0</div>
        </div>
      </div>

      {/* Logout */}
      <div className="w-full max-w-xl mt-8 px-1 sm:px-0">
        <button className="w-full py-4 rounded-full font-semibold text-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all shadow-xl" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Settings; 