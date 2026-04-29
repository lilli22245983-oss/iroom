"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ManualEntryModel } from "@/model/firebase/manual_entry_model";

type Props = {
  itemName: string;
};

export default function ManualHeroSection({ itemName }: Props) {
  const [policyOpen, setPolicyOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<"white" | "black">(
    "white"
  );
  const [messageIndex, setMessageIndex] = useState(0);
  const [imageVisible, setImageVisible] = useState(true);

  const [manual, setManual] = useState<ManualEntryModel | null>(null);

  useEffect(() => {
    const fetchManual = async () => {
      try {
        const q = query(
          collection(db, "manuals"),
          where("isActive", "==", true)
        );

        const snapshot = await getDocs(q);

        const found = snapshot.docs
          .map((docSnap) =>
            ManualEntryModel.fromMap(docSnap.data(), docSnap.id)
          )
          .find(
            (item) =>
              item.productName === itemName ||
              item.productId === itemName ||
              item.id === itemName
          );

        setManual(found ?? null);
      } catch (error) {
        setManual(null);
      }
    };

    if (itemName) {
      fetchManual();
    }
  }, [itemName]);

  const smartCareMessages = useMemo(() => {
    return (
      manual?.hero?.smartCareMessages?.filter(
        (message) => message.trim() !== ""
      ) ?? []
    );
  }, [manual]);

  const colorImages = manual?.hero?.colorImages ?? {};

  const whiteImage =
    colorImages.white && colorImages.white.trim() !== ""
      ? colorImages.white
      : null;

  const blackImage =
    colorImages.black && colorImages.black.trim() !== ""
      ? colorImages.black
      : null;

  const displayImage = selectedColor === "white" ? whiteImage : blackImage;
  const hasBothImages = !!(whiteImage && blackImage);

  const warranty = manual?.warranty;
  const warrantyTitle = warranty?.title || "제품 보증 안내";
  const warrantyContent =
    warranty?.content ||
    "등록된 제품 보증 정보가 없습니다.";

  const warrantyAvailable = !!warranty?.isActive;

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;

    if (policyOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = originalOverflow;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [policyOpen]);

  useEffect(() => {
    if (smartCareMessages.length === 0) return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % smartCareMessages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [smartCareMessages.length]);

  useEffect(() => {
    setMessageIndex(0);
  }, [manual?.id]);

  useEffect(() => {
    setImageVisible(false);

    const timer = setTimeout(() => {
      setImageVisible(true);
    }, 180);

    return () => clearTimeout(timer);
  }, [selectedColor, displayImage]);

  const handleToggleColor = () => {
    setSelectedColor((prev) => (prev === "white" ? "black" : "white"));
  };

  return (
    <>
      <section className="relative overflow-hidden rounded-b-[34px] bg-gradient-to-b from-[#5f89eb] via-[#2f63df] to-[#224bbb] text-white shadow-[0_14px_34px_rgba(20,55,140,0.22)]">
        <div className="flex min-h-[250px] gap-4 px-6 pb-2 pt-4">
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-[14px] font-bold tracking-[-0.02em] text-white/75">
              CORDLESS VACUUM CLEANER
            </p>

            <h1 className="mt-3 text-[22px] font-extrabold leading-[1.25] tracking-[-0.02em] text-white">
              {manual?.productName || itemName}
            </h1>

            <button
              type="button"
              onClick={() => setPolicyOpen(true)}
              disabled={!warrantyAvailable}
              className={`mt-5 inline-flex h-[38px] w-fit items-center rounded-full border border-white/30 px-3.5 text-[12px] font-bold text-white backdrop-blur-md shadow-[0_6px_20px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.25)] transition active:scale-95 ${
                warrantyAvailable
                  ? "cursor-pointer bg-white/20 hover:bg-white/30"
                  : "cursor-not-allowed bg-white/10 opacity-50"
              }`}
            >
              제품 보증 안내
            </button>

            <div className="mt-4">
              <button
                type="button"
                onClick={hasBothImages ? handleToggleColor : undefined}
                disabled={!hasBothImages}
                className={`inline-flex h-[42px] items-center gap-2.5 rounded-full border border-white/15 px-3.5 backdrop-blur-sm transition active:scale-95 ${
                  hasBothImages
                    ? "cursor-pointer bg-white/10 hover:bg-white/15"
                    : "cursor-not-allowed bg-white/5 opacity-50"
                }`}
              >
                <span className="text-[14px] font-semibold text-white">
                  Color
                </span>

                <span
                  className={`h-7 w-7 rounded-full border-2 border-white ${
                    selectedColor === "white" ? "bg-white" : "bg-black"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="absolute right-4 top-1/2 flex w-[34%] min-w-[110px] -translate-y-1/2 justify-center">
            <div className="flex h-[220px] w-full items-center justify-center rounded-[20px] p-2">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={`${manual?.productName || itemName} ${selectedColor}`}
                  className={`float-vacuum h-full w-full object-contain transition-all duration-300 ${
                    imageVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
                  }`}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white/70">
                  이미지 없음
                </div>
              )}
            </div>
          </div>
        </div>

        {smartCareMessages.length > 0 && (
          <div className="px-5 pb-5">
            <div className="w-[70%] rounded-[22px] border border-white/25 bg-white/20 px-5 py-3 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.25),inset_0_1px_2px_rgba(255,255,255,0.25)]">
              <p className="text-[13px] font-bold text-white/70">
                SMART CARE
              </p>

              <p
                key={messageIndex}
                className="mt-2 animate-[fadeMessage_0.45s_ease] text-[14px] leading-6 text-white"
              >
                {smartCareMessages[messageIndex]}
              </p>
            </div>
          </div>
        )}
      </section>

      <div
        onClick={() => setPolicyOpen(false)}
        className={`fixed inset-0 z-[120] bg-black/45 backdrop-blur-[3px] transition duration-300 ${
          policyOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        className={`fixed left-1/2 top-1/2 z-[121] w-[calc(100%-32px)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[28px] bg-white p-6 text-black shadow-2xl transition duration-300 ${
          policyOpen
            ? "scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-bold text-[#2f63df]">IROOM</p>
            <h3 className="mt-1 text-[22px] font-extrabold tracking-[-0.02em]">
              {warrantyTitle}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setPolicyOpen(false)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-xl text-gray-500 transition hover:bg-gray-100 active:scale-95"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 rounded-[22px] bg-[#f6f8ff] p-4">
          <p className="whitespace-pre-line text-[14px] leading-7 text-gray-700">
            {warrantyContent}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setPolicyOpen(false)}
          className="mt-5 flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[18px] bg-[#2f63df] text-[15px] font-bold text-white transition hover:brightness-105 active:scale-[0.98]"
        >
          확인
        </button>
      </div>
    </>
  );
}