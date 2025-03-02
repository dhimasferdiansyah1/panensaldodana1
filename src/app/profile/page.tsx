"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FcLeft } from "react-icons/fc";

// Fungsi untuk memformat tanggal
const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString();
};

export default function Profile() {
  const [userId, setUserId] = useState<string | null>(null);
  const [telegramName, setTelegramName] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [danaNumber, setDanaNumber] = useState("");
  const [danaName, setDanaName] = useState("");
  const [balance, setBalance] = useState(0);
  const [todayAdViews, setTodayAdViews] = useState(0);
  const [totalAdViews, setTotalAdViews] = useState(0);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedId = localStorage.getItem("userId");
    if (!storedId) {
      router.push("/"); // Redirect ke halaman utama jika tidak ada userId
      return;
    }
    setUserId(storedId);
    fetchUserData(storedId);
  }, [router]);

  const fetchUserData = async (id: string) => {
    try {
      const response = await fetch(`/api/user?userId=${id}`);
      const data = await response.json();
      if (data.user) {
        const {
          id,
          telegramName,
          telegramUsername,
          danaNumber,
          danaName,
          balance,
          todayAdViews,
          totalAdViews,
          createdAt,
          updatedAt,
          photoUrl,
        } = data.user;

        setUserId(id);
        setTelegramName(telegramName);
        setTelegramUsername(telegramUsername);
        setDanaNumber(danaNumber);
        setDanaName(danaName);
        setBalance(balance);
        setTodayAdViews(todayAdViews);
        setTotalAdViews(totalAdViews);
        setCreatedAt(createdAt);
        setUpdatedAt(updatedAt);
        setPhotoUrl(photoUrl);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white text-gray-900 font-sans py-8 items-center justify-center">
        {/* Anda bisa mengganti ini dengan spinner yang lebih baik */}
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="container mx-auto px-4 py-6 gap-y-4">
        {/* Header dan Tombol Kembali */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="flex items-center text-blue-500 hover:text-blue-700"
            aria-label="Kembali ke Beranda"
          >
            <FcLeft className="mr-2 text-2xl" />
            <span className="text-lg">Kembali</span>
          </Link>
          <h1 className="text-2xl font-bold text-blue-600">Profil Anda</h1>
          <div></div> {/* Empty div for spacing with flex justify-between */}
        </div>

        <main className="flex-grow">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col items-center mb-6">
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt="Foto Profil"
                  width={120}
                  height={120}
                  className="rounded-full border-4 border-blue-200"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-200 rounded-full border-2 border-gray-300 flex items-center justify-center">
                  <span className="text-gray-500">No Photo</span>
                </div>
              )}
              <h2 className="text-xl font-semibold mt-4">{telegramName}</h2>
              <p className="text-gray-600">@{telegramUsername}</p>
            </div>

            <div className="mt-2">
              <h3 className="text-lg font-semibold mb-4">Detail Profil</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">ID Pengguna</p>
                  <p className="text-gray-900">{userId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nama Telegram</p>
                  <p className="text-gray-900">{telegramName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Username Telegram</p>
                  <p className="text-gray-900">@{telegramUsername}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nomor DANA</p>
                  <p className="text-gray-900">
                    {danaNumber ?? "Belum diatur"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nama DANA</p>
                  <p className="text-gray-900">{danaName ?? "Belum diatur"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Saldo</p>
                  <p className="text-blue-500">Rp {balance.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    Iklan Ditonton Hari Ini
                  </p>
                  <p className="text-gray-900">{todayAdViews}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Iklan Ditonton</p>
                  <p className="text-gray-900">{totalAdViews}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dibuat Pada</p>
                  <p className="text-gray-900">{formatDate(createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Terakhir Diperbarui</p>
                  <p className="text-gray-900">{formatDate(updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer className="p-4 text-center text-gray-500 mt-auto">
        <div className="container mx-auto">
          <p>© 2025 Panen Saldo Dana</p>
        </div>
      </footer>
    </div>
  );
}
