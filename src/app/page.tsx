/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { createId } from "@paralleldrive/cuid2"; // Pastikan sudah diinstall
dayjs.extend(utc);

const HAS_SEEN_MODAL_KEY = "hasSeenModal";
const APP_VERSION_KEY = "appVersion";
const CURRENT_APP_VERSION = "1.2.0";

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
        ready?: () => void; // Tambahan untuk memastikan WebApp siap
      };
    };
    show_9004505?: (config?: {
      type?: string;
      inAppSettings?: {
        frequency: number;
        capping: number;
        interval: number;
        timeout: number;
        everyPage: boolean;
      };
    }) => Promise<unknown>;
  }
}

const FALLBACK_TELEGRAM_DATA = {
  id: 12345678,
  first_name: "TestUser",
  username: "testuser_local",
  photo_url: "/LOGO.jpg",
};

export default function Home() {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [modalStage, setModalStage] = useState<
    "welcome" | "watchAd" | "complete"
  >("welcome");
  const [adWatchCount, setAdWatchCount] = useState(0);
  const [isModalButtonDisabled, setIsModalButtonDisabled] = useState(false);
  const [modalButtonCooldown, setModalButtonCooldown] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [todayAdViews, setTodayAdViews] = useState(0);
  const [totalAdViews, setTotalAdViews] = useState(0);
  const [loading, setLoading] = useState(false);
  const [remainingQuota, setRemainingQuota] = useState(63);
  const [progress, setProgress] = useState(0);
  const [telegramName, setTelegramName] = useState<string>("Pengguna");
  const [telegramUsername, setTelegramUsername] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const maxAdViews = 63;
  const adReward = 8;
  const [isWatchAdButtonDisabled, setIsWatchAdButtonDisabled] = useState(false);
  const [watchAdButtonCountdown, setWatchAdButtonCountdown] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const initializeUser = async () => {
      const storedVersion = localStorage.getItem(APP_VERSION_KEY);
      let storedId = localStorage.getItem("userId");

      // Tambahkan script Telegram WebApp secara dinamis
      const telegramScript = document.createElement("script");
      telegramScript.src = "https://telegram.org/js/telegram-web-app.js";
      telegramScript.async = true;
      document.body.appendChild(telegramScript);

      telegramScript.onload = async () => {
        console.log("Telegram WebApp script loaded");
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.ready?.(); // Pastikan WebApp siap
        }

        let telegramData = window.Telegram?.WebApp?.initDataUnsafe?.user;
        const isLocalhost =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";

        // Gunakan fallback jika tidak ada data Telegram
        if (!telegramData) {
          console.log("No Telegram data available, using fallback");
          telegramData = FALLBACK_TELEGRAM_DATA;
        }

        // Reset local storage jika versi berubah
        if (storedVersion !== CURRENT_APP_VERSION || !storedId) {
          localStorage.clear();
          sessionStorage.clear();
          localStorage.setItem(APP_VERSION_KEY, CURRENT_APP_VERSION);
          console.log(
            "App version changed or no user ID. Resetting local data..."
          );
          storedId = createId(); // Generate ID baru dengan cuid
          localStorage.setItem("userId", storedId);
        }

        setTelegramName(telegramData.first_name ?? "Pengguna");
        setTelegramUsername(telegramData.username ?? "");
        setPhotoUrl(telegramData.photo_url ?? null);
        setUserId(storedId);

        await checkAndSaveUser(storedId, telegramData);
        await fetchUserData(storedId);
      };

      telegramScript.onerror = () => {
        console.error("Failed to load Telegram WebApp script");
        setError("Gagal memuat script Telegram");
        // Gunakan fallback langsung jika script gagal
        const telegramData = FALLBACK_TELEGRAM_DATA;
        setTelegramName(telegramData.first_name ?? "Pengguna");
        setTelegramUsername(telegramData.username ?? "");
        setPhotoUrl(telegramData.photo_url ?? null);

        if (!storedId || storedVersion !== CURRENT_APP_VERSION) {
          storedId = createId();
          localStorage.setItem("userId", storedId);
        }
        setUserId(storedId);
        checkAndSaveUser(storedId, telegramData).then(() =>
          fetchUserData(storedId as string)
        );
      };

      const hasSeenModal = sessionStorage.getItem(HAS_SEEN_MODAL_KEY);
      if (!hasSeenModal) {
        setShowWelcomeModal(true);
      }

      const monetagScript = document.createElement("script");
      monetagScript.src = "//whephiwums.com/sdk.js";
      monetagScript.setAttribute("data-zone", "9004505");
      monetagScript.setAttribute("data-sdk", "show_9004505");
      monetagScript.async = true;
      document.body.appendChild(monetagScript);

      monetagScript.onload = () => console.log("Monetag SDK loaded");
      monetagScript.onerror = () => console.error("Failed to load Monetag SDK");

      return () => {
        if (document.body.contains(telegramScript)) {
          document.body.removeChild(telegramScript);
        }
        if (document.body.contains(monetagScript)) {
          document.body.removeChild(monetagScript);
        }
      };
    };

    initializeUser();
  }, []);

  const fetchUserData = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/user?userId=${id}`);
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 404) {
          console.log(`User not found for ID: ${id}. Creating new user...`);
          const telegramData =
            window.Telegram?.WebApp?.initDataUnsafe?.user ||
            FALLBACK_TELEGRAM_DATA;
          await checkAndSaveUser(id, telegramData);
          await fetchUserData(id); // Coba lagi setelah simpan
          return;
        }
        throw new Error(
          `Failed to fetch user data: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("fetchUserData - Raw data:", data);

      if (data.user) {
        const today = dayjs().utc().format("YYYY-MM-DD");
        let newTodayAdViews = data.user.todayAdViews;

        if (data.user.lastAdViewDate !== today) {
          newTodayAdViews = 0;
          await fetch("/api/user", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: data.user.id,
              lastAdViewDate: today,
              todayAdViews: 0,
            }),
          });
        }

        setUserId(data.user.id);
        setBalance(data.user.balance);
        setTodayAdViews(newTodayAdViews);
        setTotalAdViews(data.user.totalAdViews);
        setRemainingQuota(maxAdViews - newTodayAdViews);
        setProgress((newTodayAdViews / maxAdViews) * 100);
        setTelegramName(data.user.telegramName);
        setTelegramUsername(data.user.telegramUsername);
        setPhotoUrl(data.user.photoUrl);
      } else {
        throw new Error("No user data returned from API");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError(
        error instanceof Error ? error.message : "Gagal memuat data pengguna"
      );
    } finally {
      setLoading(false);
    }
  };

  type TelegramUserData = {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
  };

  const checkAndSaveUser = async (
    id: string,
    telegramData: TelegramUserData
  ) => {
    try {
      const today = dayjs().utc().format("YYYY-MM-DD");

      const response = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          telegramName: telegramData.first_name ?? "Pengguna",
          telegramUsername: telegramData.username ?? "",
          photoUrl: telegramData.photo_url ?? null,
          lastAdViewDate: today,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to save new user: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("checkAndSaveUser - New user saved:", data);
    } catch (error) {
      console.error("Error checking/saving user:", error);
      setError(
        error instanceof Error ? error.message : "Gagal menyimpan pengguna"
      );
    }
  };

  const handleAgree = async () => {
    setLoading(true);
    setError(null);
    if (!userId) {
      let telegramData = window.Telegram?.WebApp?.initDataUnsafe?.user;
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      if (!telegramData && isLocalhost) {
        telegramData = FALLBACK_TELEGRAM_DATA;
      }
      if (telegramData) {
        const newId = createId();
        localStorage.setItem("userId", newId);
        setUserId(newId);
        await checkAndSaveUser(newId, telegramData);
        await fetchUserData(newId);
      } else {
        setError("Tidak ada data Telegram tersedia");
      }
    } else {
      await fetchUserData(userId);
    }
    setModalStage("watchAd");
    setLoading(false);
  };

  const handleWatchModalAd = async () => {
    if (loading || adWatchCount >= 2 || isModalButtonDisabled) return;
    setLoading(true);
    setIsModalButtonDisabled(true);
    setModalButtonCooldown(10);

    const playAd = async () => {
      if (typeof window.show_9004505 === "function") {
        try {
          await window.show_9004505();
          return true;
        } catch (error) {
          console.error("Error showing ad:", error);
          return false;
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return true;
      }
    };

    const firstAdSuccess = await playAd();
    if (!firstAdSuccess) {
      setLoading(false);
      setIsModalButtonDisabled(false);
      setModalButtonCooldown(0);
      return;
    }
    setAdWatchCount(1);

    const secondAdSuccess = await playAd();
    if (!secondAdSuccess) {
      setLoading(false);
      setIsModalButtonDisabled(false);
      setModalButtonCooldown(0);
      return;
    }
    setAdWatchCount(2);

    let timerId: NodeJS.Timeout | null = null;
    timerId = setInterval(() => {
      setModalButtonCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerId!);
          setIsModalButtonDisabled(false);
          setModalStage("complete");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setLoading(false);
  };

  const handleCompleteOnboarding = () => {
    setShowWelcomeModal(false);
    sessionStorage.setItem(HAS_SEEN_MODAL_KEY, "true");
  };

  const handleWatchMainAd = async () => {
    if (remainingQuota <= 0 || isWatchAdButtonDisabled || loading || !userId)
      return;

    setLoading(true);
    setIsWatchAdButtonDisabled(true);
    setWatchAdButtonCountdown(16);

    let timerId: NodeJS.Timeout | null = null;
    timerId = setInterval(() => {
      setWatchAdButtonCountdown((prevCount) => {
        if (prevCount <= 1) {
          clearInterval(timerId!);
          setIsWatchAdButtonDisabled(false);
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);

    const playAd = async () => {
      if (typeof window.show_9004505 === "function") {
        try {
          await window.show_9004505();
          return true;
        } catch (error) {
          console.error("Error showing ad:", error);
          return false;
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return true;
      }
    };

    const adSuccess = await playAd();
    if (adSuccess) {
      try {
        const newBalance = balance + adReward;
        const newTodayAdViews = todayAdViews + 1;
        const today = dayjs().utc().format("YYYY-MM-DD");

        setBalance(newBalance);
        setTodayAdViews(newTodayAdViews);
        setTotalAdViews(totalAdViews + 1);
        setRemainingQuota(maxAdViews - newTodayAdViews);
        setProgress((newTodayAdViews / maxAdViews) * 100);

        const response = await fetch("/api/user", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            balance: newBalance,
            todayAdViews: newTodayAdViews,
            totalAdViews: totalAdViews + 1,
            lastAdViewDate: today,
          }),
        });

        if (!response.ok) throw new Error("Failed to update user data");
      } catch (error) {
        console.error("Error updating user data:", error);
        setError("Gagal memperbarui data pengguna");
      }
    }

    setLoading(false);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg max-w-md">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 font-sans py-8">
      <header className="p-4 text-center flex gap-2 items-center justify-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">
            Panen Saldo Dana 1
          </h1>
        </div>
      </header>

      <main className="flex-grow p-4">
        <div className="bg-gray-100 rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Saldo Anda</p>
              <p className="text-xl font-semibold text-blue-500">
                Rp {balance.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Iklan Ditonton (Hari Ini)</p>
              <p className="text-xl font-semibold text-gray-900">
                {todayAdViews}
              </p>
            </div>
          </div>
        </div>

        <div className="relative w-full bg-gray-200 rounded-full h-4 mb-10">
          <div
            className="bg-blue-500 h-full rounded-full text-xs text-white flex items-center justify-center"
            style={{ width: `${progress}%` }}
          >
            {progress > 10 && (
              <span>
                {remainingQuota} / {maxAdViews}
              </span>
            )}
          </div>
          {progress <= 10 && (
            <span className="absolute left-1/2 -translate-x-1/2 text-xs text-gray-600">
              {remainingQuota} / {maxAdViews}
            </span>
          )}
        </div>

        <button
          onClick={handleWatchMainAd}
          disabled={
            remainingQuota <= 0 ||
            isWatchAdButtonDisabled ||
            loading ||
            showWelcomeModal
          }
          className={`w-full py-3 px-6 rounded-lg text-lg font-semibold transition-colors duration-200 ${
            remainingQuota <= 0 ||
            isWatchAdButtonDisabled ||
            loading ||
            showWelcomeModal
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
          }`}
        >
          {isWatchAdButtonDisabled
            ? `Tunggu (${watchAdButtonCountdown} detik)`
            : loading
            ? "Memuat..."
            : remainingQuota <= 0
            ? "Batas Harian Tercapai"
            : "Tonton Iklan +Rp 8"}
        </button>

        <div className="flex flex-col gap-4 mt-6">
          <button
            onClick={() => router.push("/profile")}
            className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
          >
            Profil
          </button>
          <button
            onClick={() => router.push("/withdraw")}
            className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
          >
            Tarik Saldo
          </button>
          <button
            onClick={() => router.push("/withdrawal-history")}
            className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
          >
            Riwayat Penarikan
          </button>
          <button
            onClick={() => router.push("/proof-of-payment")}
            className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
          >
            Bukti Pembayaran
          </button>
          <a
            href="#"
            className="py-2 px-4 text-center bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
          >
            Mainkan Bot Lainnya
          </a>
        </div>
      </main>

      <footer className="p-4 text-center text-gray-500">
        <p>© 2025 Panen Saldo Dana</p>
      </footer>

      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            {modalStage === "welcome" && (
              <>
                <h2 className="text-lg font-semibold mb-4">Selamat Datang!</h2>
                <p className="text-gray-600 mb-6">
                  Untuk mendukung aplikasi ini berjalan lama, Anda perlu
                  menonton iklan saat memulai. Tekan Setuju dan Lanjutkan untuk
                  melanjutkan.
                </p>
                <button
                  onClick={handleAgree}
                  disabled={loading}
                  className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500"
                >
                  {loading ? "Memuat..." : "Setuju dan Lanjutkan"}
                </button>
              </>
            )}

            {modalStage === "watchAd" && (
              <>
                <h2 className="text-lg font-semibold mb-4">Tonton Iklan</h2>
                <p className="text-gray-600 mb-6">
                  Silahkan tonton 2 iklan untuk melanjutkan. Iklan{" "}
                  {adWatchCount + 1 > 2 ? 2 : adWatchCount + 1} dari 2.
                </p>
                <button
                  onClick={handleWatchModalAd}
                  disabled={
                    loading || adWatchCount >= 2 || isModalButtonDisabled
                  }
                  className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500"
                >
                  {isModalButtonDisabled
                    ? `Tunggu (${modalButtonCooldown} detik)`
                    : loading
                    ? "Memutar..."
                    : "Tonton Iklan"}
                </button>
              </>
            )}

            {modalStage === "complete" && (
              <>
                <h2 className="text-lg font-semibold mb-4">Terima Kasih!</h2>
                <p className="text-gray-600 mb-6">
                  Anda telah menonton 2 iklan. Sekarang Anda bisa melanjutkan
                  menggunakan aplikasi.
                </p>
                <button
                  onClick={handleCompleteOnboarding}
                  className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Tutup
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
