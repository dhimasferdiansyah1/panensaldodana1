"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FcLeft } from "react-icons/fc"; // Import FcLeft
import Link from "next/link";

interface Withdrawal {
  id: number;
  createdAt: string;
  amount: number;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
}
// Fungsi untuk memformat tanggal
const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString();
};

export default function WithdrawalHistory() {
  const [, setUserId] = useState<string | null>(null); // setUserId tidak digunakan
  const [danaNumber, setDanaNumber] = useState("");
  const [danaName, setDanaName] = useState("");
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedId = localStorage.getItem("userId");
    if (!storedId) {
      router.push("/");
      return;
    }
    setUserId(storedId); // Tetap setUserId, meskipun tidak digunakan, untuk konsistensi
    fetchWithdrawalHistory(storedId);
  }, [router]);

  const fetchWithdrawalHistory = async (id: string) => {
    try {
      const response = await fetch(`/api/withdrawal-history?userId=${id}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal mengambil riwayat penarikan.");
      }
      setDanaNumber(data.danaNumber ?? "Belum diatur"); // Gunakan ??
      setDanaName(data.danaName ?? "Belum diatur"); // Gunakan ??
      setWithdrawals(data.withdrawals);
    } catch (error) {
      console.error("Error fetching withdrawal history:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans py-8 items-center justify-center">
        {/* Gunakan spinner yang lebih baik */}
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
        {/* Header and Back Button */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="flex items-center text-blue-500 hover:text-blue-700"
            aria-label="Kembali ke Beranda"
          >
            <FcLeft className="mr-2 text-2xl" />
            <span className="text-lg">Kembali</span>
          </Link>
          <h1 className="text-2xl font-bold text-blue-600">
            Riwayat Penarikan
          </h1>
          <div></div> {/* Empty div for spacing */}
        </div>

        <main className="flex-grow">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <p className="text-sm text-gray-500">Nomor DANA</p>
              <p className="text-gray-900 font-medium">{danaNumber}</p>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-500">Nama DANA</p>
              <p className="text-gray-900 font-medium">{danaName}</p>
            </div>

            <h2 className="text-lg font-semibold mb-4">Daftar Penarikan</h2>
            {withdrawals.length === 0 ? (
              <p className="text-gray-600">Belum ada riwayat penarikan.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {withdrawals.map((withdrawal, index) => (
                  <div
                    key={withdrawal.id}
                    className="p-4 bg-white rounded-lg shadow-sm border border-gray-200"
                  >
                    <p className="text-sm text-gray-500">
                      No:{" "}
                      <span className="text-gray-900 font-medium">
                        {index + 1}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Waktu:{" "}
                      <span className="text-gray-900 font-medium">
                        {formatDate(withdrawal.createdAt)}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Jumlah:{" "}
                      <span className="text-gray-900 font-medium">
                        Rp {withdrawal.amount.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">Status:</p>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        withdrawal.status === "SUCCESS"
                          ? "bg-green-100 text-green-800"
                          : withdrawal.status === "FAILED"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {withdrawal.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
