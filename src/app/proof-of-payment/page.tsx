/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link"; // Import Link
import { FcLeft } from "react-icons/fc"; // Import FcLeft

interface WithdrawalData {
  telegramUsername: string;
  danaNumber: string;
  amount: number;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
  updatedAt: string;
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const censorDanaNumber = (danaNumber: string): string => {
  if (!danaNumber) return "N/A";
  const visibleDigits = 4;
  return `${"*".repeat(
    Math.max(0, danaNumber.length - visibleDigits)
  )}${danaNumber.slice(-visibleDigits)}`;
};

export default function ProofOfPayment() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWithdrawalData();
  }, []);

  const fetchWithdrawalData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/proof-of-payment", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, body: ${text}`
        );
      }

      const data = await response.json();

      if (!data.withdrawals) {
        throw new Error("Invalid data format: missing withdrawals");
      }

      const transformedData = data.withdrawals.map((item: any) => ({
        telegramUsername: item.user?.telegramUsername ?? "Unknown",
        danaNumber: censorDanaNumber(item.user?.danaNumber),
        amount: item.amount ?? 0,
        status: item.status ?? "PENDING",
        updatedAt: item.updatedAt ?? new Date().toISOString(),
      }));

      setWithdrawals(transformedData);
    } catch (error) {
      console.error("Detailed error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memuat data"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-2">
          <svg
            className="animate-spin h-8 w-8 text-blue-600"
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
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button
            onClick={fetchWithdrawalData}
            className="mt-3 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button and Title */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="flex items-center text-blue-500 hover:text-blue-700"
            aria-label="Kembali ke Beranda"
          >
            <FcLeft className="mr-2 text-2xl" />
            <span className="text-lg">Kembali</span>
          </Link>
          <h1 className="text-2xl font-bold text-blue-600">Bukti Pembayaran</h1>
          <div></div> {/* Empty div for spacing with flex justify-between */}
        </div>
        <h2 className="text-xl text-gray-600 text-center mb-8">
          Panen Saldo Dana 1
        </h2>

        {withdrawals.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            Belum ada data pembayaran yang tersedia.
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Username Telegram
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Nomor DANA (Disensor)
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Jumlah
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Tanggal
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {withdrawals.map((withdrawal, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {withdrawal.telegramUsername}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {withdrawal.danaNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(withdrawal.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          withdrawal.status === "SUCCESS"
                            ? "bg-green-100 text-green-800"
                            : withdrawal.status === "FAILED"
                            ? "bg-red-100 text-red-800"
                            : withdrawal.status === "PROCESSING"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(withdrawal.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
