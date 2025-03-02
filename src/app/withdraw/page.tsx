"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FcLeft } from "react-icons/fc"; // Import FcLeft
import Link from "next/link";

export default function Withdraw() {
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [danaNumber, setDanaNumber] = useState("");
  const [danaName, setDanaName] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null); // Error khusus untuk amount
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedId = localStorage.getItem("userId");
    if (!storedId) {
      router.push("/");
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
        setBalance(data.user.balance);
        setDanaNumber(data.user.danaNumber ?? "");
        setDanaName(data.user.danaName ?? "");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAmountError(null); // Reset error amount
    setSuccessMessage(null);
    setSubmitLoading(true);

    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount < 3000) {
      setAmountError("Jumlah penarikan minimal Rp3000.");
      setSubmitLoading(false);
      return;
    }

    if (withdrawAmount > balance) {
      setAmountError("Jumlah penarikan melebihi saldo Anda.");
      setSubmitLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          danaNumber,
          danaName,
          amount: withdrawAmount,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal melakukan penarikan.");
      }

      setBalance(data.remainingBalance);
      setSuccessMessage("Permintaan penarikan berhasil diajukan!");
      setTimeout(() => router.push("/"), 3000);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(String(error));
      }
    } finally {
      setSubmitLoading(false);
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
          <h1 className="text-2xl font-bold text-blue-600">Tarik Saldo</h1>
          <div></div> {/* Empty div for spacing */}
        </div>

        <main className="flex-grow">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <p className="text-sm text-gray-500">Saldo Anda</p>
              <p className="text-xl font-semibold text-blue-500">
                Rp {balance.toFixed(2)}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="danaNumber"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nomor DANA
                </label>
                <input
                  type="tel"
                  id="danaNumber"
                  value={danaNumber}
                  onChange={(e) => setDanaNumber(e.target.value)}
                  placeholder="Masukkan nomor DANA"
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  autoComplete="tel"
                />
              </div>
              <div>
                <label
                  htmlFor="danaName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nama DANA
                </label>
                <input
                  type="text"
                  id="danaName"
                  value={danaName}
                  onChange={(e) => setDanaName(e.target.value)}
                  placeholder="Masukkan nama akun DANA"
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  autoComplete="name"
                />
              </div>
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-700"
                >
                  Jumlah Penarikan (Min. Rp3000)
                </label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Masukkan jumlah"
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  min="3000"
                  step="1"
                  required
                />
                {amountError && (
                  <p className="mt-2 text-sm text-red-600">{amountError}</p>
                )}
              </div>

              {error && (
                <p className="mt-2 text-sm text-red-600 bg-red-100 border border-red-400 px-3 py-2 rounded-md">
                  {error}
                </p>
              )}
              {successMessage && (
                <p className="mt-2 text-sm text-green-600 bg-green-100 border border-green-400 px-3 py-2 rounded-md">
                  {successMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {submitLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    <span>Memproses...</span>
                  </>
                ) : (
                  "Tarik Saldo"
                )}
              </button>
            </form>
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
