/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import Image from "next/image"; // Import Image
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

const HAS_SEEN_MODAL_KEY = "hasSeenModal";

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string; // Tambahkan last_name
            username?: string;
            photo_url?: string;
          };
        };
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
  const maxAdViews = 63;
  const adReward = 8;
  const [isWatchAdButtonDisabled, setIsWatchAdButtonDisabled] = useState(false);
  const [watchAdButtonCountdown, setWatchAdButtonCountdown] = useState(0);
  const router = useRouter();

  // Tambahkan state untuk data profil
  const [telegramName, setTelegramName] = useState<string>("Pengguna"); // Default value
  const [telegramUsername, setTelegramUsername] = useState<string>(""); // Default value
  const [photoUrl, setPhotoUrl] = useState<string | null>(null); // Default value

  useEffect(() => {
    let storedId = localStorage.getItem("userId");

    if (!storedId) {
      if (typeof window.Telegram?.WebApp !== "undefined") {
        const telegramId =
          window.Telegram.WebApp.initDataUnsafe?.user?.id.toString();
        if (telegramId) {
          localStorage.setItem("userId", telegramId);
          storedId = telegramId;
        }
      }
    }
    setUserId(storedId);

    const hasSeenModal = sessionStorage.getItem(HAS_SEEN_MODAL_KEY);
    if (!hasSeenModal) {
      setShowWelcomeModal(true);
    }

    const script = document.createElement("script");
    script.src = "//whephiwums.com/sdk.js";
    script.setAttribute("data-zone", "9004505");
    script.setAttribute("data-sdk", "show_9004505");
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => console.log("Monetag SDK loaded");
    script.onerror = () => console.error("Failed to load Monetag SDK");

    if (storedId) {
      fetchUserData(storedId);
    }

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const fetchUserData = async (id: string | null) => {
    if (!id) return false;
    setLoading(true);
    try {
      const response = await fetch(`/api/user?userId=${id}`);
      const data = await response.json();
      console.log("fetchUserData - Raw data from server:", data);

      if (data.user) {
        const today = dayjs().utc().format("YYYY-MM-DD");
        let newTodayAdViews = data.user.todayAdViews;

        if (data.user.lastAdViewDate !== today) {
          console.log("fetchUserData - Resetting todayAdViews...");
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
        localStorage.setItem("userId", data.user.id);

        // Update data profil
        setTelegramName(data.user.telegramName);
        setTelegramUsername(data.user.telegramUsername);
        setPhotoUrl(data.user.photoUrl);

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const saveNewUser = async () => {
    const telegramData = window.Telegram?.WebApp?.initDataUnsafe?.user;
    try {
      const today = dayjs().utc().format("YYYY-MM-DD");
      const response = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramName: telegramData?.first_name || "Tidak memiliki nama", //dari telegram
          telegramUsername: telegramData?.username || "Tidak memiliki username", // dari telegram
          photoUrl: telegramData?.photo_url || null, //dari telegram
          lastAdViewDate: today,
        }),
      });
      const data = await response.json();
      console.log("saveNewUser - data from server:", data);
      setUserId(data.user.id);
      localStorage.setItem("userId", data.user.id);

      // Inisialisasi state, termasuk data profil
      setTodayAdViews(0);
      setRemainingQuota(maxAdViews);
      setProgress(0);
      setTelegramName(telegramData?.first_name ?? "Tidak memiliki nama");
      setTelegramUsername(telegramData?.username ?? "Tidak memiliki username");
      setPhotoUrl(telegramData?.photo_url ?? null);

      return true;
    } catch (error) {
      console.error("Error saving new user:", error);
      return false;
    }
  };

  const handleAgree = async () => {
    setLoading(true);
    if (!userId) {
      await saveNewUser();
    } else {
      const userExists = await fetchUserData(userId);
      if (!userExists) {
        await saveNewUser();
      }
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
    if (remainingQuota <= 0 || isWatchAdButtonDisabled || loading) return;

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

        await fetch("/api/user", {
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
      } catch (error) {
        console.error("Error updating user data:", error);
      }
    }

    setLoading(false);
  };
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 font-sans py-8">
      <header className="p-4 text-center flex gap-2 items-center justify-center">
        <h1 className="text-2xl font-bold text-blue-600">Panen Saldo Dana 1</h1>
        <Image src="/danalogo.png" alt="Logo" width={48} height={48} />
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
          {isWatchAdButtonDisabled ? (
            `Tunggu (${watchAdButtonCountdown} detik)`
          ) : loading ? (
            <svg
              className="w-5 h-5 mx-auto text-gray-200 animate-spin fill-blue-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
          ) : remainingQuota <= 0 ? (
            "Batas Harian Tercapai"
          ) : (
            "Tonton Iklan +Rp 7"
          )}
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
                  {loading ? (
                    <svg
                      className="w-5 h-5 mx-auto text-gray-200 animate-spin fill-blue-600"
                      viewBox="0 0 100 101"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"
                      />
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"
                      />
                    </svg>
                  ) : (
                    "Setuju dan Lanjutkan"
                  )}
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
                  {isModalButtonDisabled ? (
                    `Tunggu (${modalButtonCooldown} detik)`
                  ) : loading ? (
                    <svg
                      className="w-5 h-5 mx-auto text-gray-200 animate-spin fill-blue-600"
                      viewBox="0 0 100 101"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"
                      />
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"
                      />
                    </svg>
                  ) : (
                    "Tonton Iklan"
                  )}
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
