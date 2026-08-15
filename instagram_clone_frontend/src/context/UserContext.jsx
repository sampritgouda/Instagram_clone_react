import React, { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [profileImage, setProfileImage] = useState(localStorage.getItem("profileImage") || null);
  const [savedAccounts, setSavedAccounts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("savedAccounts")) || [];
    } catch (e) {
      return [];
    }
  });
  const [userId, setUserId] = useState(localStorage.getItem("userId") || null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  // PWA Install / Widget States
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  );

  // Capture PWA beforeinstallprompt event globally
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Auto-show download/install popup on login if NOT already running as standalone app widget
  useEffect(() => {
    if (token && !isStandalone && !sessionStorage.getItem('pwaPromptShown')) {
      const timer = setTimeout(() => {
        setIsInstallModalOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [token, isStandalone]);

  const openInstallModal = () => {
    setIsInstallModalOpen(true);
  };

  const closeInstallModal = () => {
    sessionStorage.setItem('pwaPromptShown', 'true');
    setIsInstallModalOpen(false);
  };

  useEffect(() => {
    const storedImage = localStorage.getItem("profileImage");
    if (storedImage) {
      setProfileImage(storedImage);
    }
  }, []);

  useEffect(() => {
    if (profileImage) {
      localStorage.setItem("profileImage", profileImage);
    }
  }, [profileImage]);

  const saveAccount = (accountData) => {
    if (!accountData || !accountData.id) return;
    const current = JSON.parse(localStorage.getItem("savedAccounts") || "[]");
    const existingIndex = current.findIndex((a) => String(a.id) === String(accountData.id));

    const newAcc = {
      id: accountData.id,
      username: accountData.username || (accountData.email ? accountData.email.split("@")[0] : `user_${accountData.id}`),
      email: accountData.email || "",
      profilePicUrl: accountData.profilePicUrl || accountData.profileImage || profileImage || "https://res.cloudinary.com/dr0yboilf/image/upload/v1754637397/i721vyva5s2broewwwss.jpg",
      token: accountData.token || localStorage.getItem("token"),
    };

    let updated;
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...updated[existingIndex], ...newAcc };
    } else {
      updated = [newAcc, ...current];
    }

    localStorage.setItem("savedAccounts", JSON.stringify(updated));
    setSavedAccounts(updated);
  };

  const loginUser = (data, userEmail = "", customUsername = "") => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.id);
    if (data.profileImage) {
      localStorage.setItem("profileImage", data.profileImage);
      setProfileImage(data.profileImage);
    }
    setToken(data.token);
    setUserId(data.id);

    saveAccount({
      id: data.id,
      email: userEmail,
      username: customUsername || data.username,
      profilePicUrl: data.profileImage,
      token: data.token,
    });
  };

  const switchAccount = (account) => {
    localStorage.setItem("token", account.token);
    localStorage.setItem("userId", account.id);
    if (account.profilePicUrl) {
      localStorage.setItem("profileImage", account.profilePicUrl);
      setProfileImage(account.profilePicUrl);
    }
    setToken(account.token);
    setUserId(account.id);
    setIsSwitcherOpen(false);
    window.location.href = "/home";
  };

  const removeSavedAccount = (accId) => {
    const current = JSON.parse(localStorage.getItem("savedAccounts") || "[]");
    const updated = current.filter((a) => String(a.id) !== String(accId));
    localStorage.setItem("savedAccounts", JSON.stringify(updated));
    setSavedAccounts(updated);
  };

  const logout = (removeSaved = false) => {
    const activeId = localStorage.getItem("userId");
    if (removeSaved && activeId) {
      removeSavedAccount(activeId);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("profileImage");
    sessionStorage.removeItem("pwaPromptShown");
    setToken(null);
    setUserId(null);
    setProfileImage(null);
    window.location.href = "/login";
  };

  return (
    <UserContext.Provider
      value={{
        profileImage,
        setProfileImage,
        savedAccounts,
        setSavedAccounts,
        userId,
        token,
        saveAccount,
        loginUser,
        switchAccount,
        removeSavedAccount,
        logout,
        isSwitcherOpen,
        setIsSwitcherOpen,
        deferredPrompt,
        isInstallModalOpen,
        setIsInstallModalOpen,
        openInstallModal,
        closeInstallModal,
        isStandalone,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
