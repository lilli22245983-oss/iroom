"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ManualEntryModel,
  ManualWarrantyModel,
} from "@/model/firebase/manual_entry_model";

type Props = {
  open: boolean;
  onClose: () => void;
  manualId: string;
};

export default function WarrantyPage({ open, onClose, manualId }: Props) {
  const [warranty, setWarranty] = useState<ManualWarrantyModel | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;

    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = originalOverflow;

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    const fetchWarranty = async () => {
      if (!open) return;
      if (!manualId) {
        setWarranty(null);
        return;
      }

      try {
        setLoading(true);

        const snap = await getDoc(doc(db, "manuals", manualId));

        if (snap.exists()) {
          const manual = ManualEntryModel.fromMap(snap.data(), snap.id);

          if (manual.warranty.isActive) {
            setWarranty(manual.warranty);
          } else {
            setWarranty(null);
          }
        } else {
          setWarranty(null);
        }
      } catch (error) {
        console.error("제품 보증 정보 불러오기 실패:", error);
        setWarranty(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWarranty();
  }, [open, manualId]);

  const lines = warranty?.content
    ? warranty.content
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[120] transition duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        className={`fixed inset-y-0 left-1/2 z-[121] w-full max-w-[450px] -translate-x-1/2 bg-[#f5f7fb] transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur">
            <header className="relative flex items-center justify-between border-b border-gray-100 px-4 py-4">
              <button
                type="button"
                onClick={onClose}
                className="z-10 flex h-11 w-11 items-center justify-center rounded-full text-xl text-gray-700 hover:bg-gray-100"
              >
                ←
              </button>

              <h2 className="absolute left-1/2 -translate-x-1/2 text-lg font-extrabold text-black">
                제품 보증
              </h2>

              <div className="h-11 w-11" />
            </header>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
            {loading ? (
              <div className="rounded-[24px] bg-white p-6 text-center shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                <p className="text-[14px] font-bold text-gray-500">
                  제품 보증 정보를 불러오는 중입니다.
                </p>
              </div>
            ) : !warranty ? (
              <div className="rounded-[24px] bg-white p-6 text-center shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                <p className="text-[15px] font-bold text-gray-700">
                  등록된 제품 보증 정보가 없습니다.
                </p>
                <p className="mt-2 text-[13px] text-gray-400">
                  관리자 메뉴얼 관리에서 제품 보증 내용을 등록해주세요.
                </p>
              </div>
            ) : (
              <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                <h3 className="flex items-center gap-3 text-[18px] font-extrabold text-blue-600">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    🛡️
                  </span>
                  {warranty.title || "제품 보증 안내"}
                </h3>

                {lines.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {lines.map((line, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-[14px] leading-6 text-gray-600"
                      >
                        <span className="mt-[9px] h-[6px] w-[6px] shrink-0 rounded-full bg-gray-400" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-[14px] leading-6 text-gray-500">
                    등록된 보증 내용이 없습니다.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}