"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ManualEntryModel } from "@/model/firebase/manual_entry_model";
import { useParams, useRouter } from "next/navigation";
import AIPage from "@/components/AIPage";
import ManualHeroSection from "@/components/manual/ManualHeroSection";
import VideoGuideSection from "@/components/manual/VideoGuideSection";
import ManualFAQSection from "@/components/manual/ManualFAQSection";
import ManualQuickMenuSection from "@/components/manual/ManualQuickMenuSection";
import UsageGuidePage from "@/components/manual/UsageGuidePage";
import ManualFaqPage from "@/components/manual/ManualFaqPage";
import ConsumableShopPage from "@/components/manual/ConsumableShopPage";
import CautionPage from "@/components/manual/CautionPage";
import ManualInfoListSection from "@/components/manual/ManualInfoListSection";
import ComponentsGuidePage from "@/components/manual/ComponentsGuidePage";
import AccessoriesPage from "@/components/manual/AccessoriesPage";
import SpecsPage from "@/components/manual/SpecsPage";
import WarrantyPage from "@/components/manual/WarrantyPage";
import ManualDownloadPage from "@/components/manual/ManualDownloadPage";
import ManualSideMenu from "@/components/manual/ManualSideMenu";
import { PolicyModel } from "@/model/firebase/policy_model";

export default function ManualDetailPage() {
  const router = useRouter();
  const params = useParams();

  const [menuOpen, setMenuOpen] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [consumableShopOpen, setConsumableShopOpen] = useState(false);
  const [cautionOpen, setCautionOpen] = useState(false);
  const [componentsOpen, setComponentsOpen] = useState(false);
  const [accessoriesOpen, setAccessoriesOpen] = useState(false);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [warrantyOpen, setWarrantyOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [cautionPolicy, setCautionPolicy] = useState<PolicyModel | null>(null);
  const [manualExists, setManualExists] = useState<boolean | null>(null);
  const [manualLoading, setManualLoading] = useState(true);
  const [manual, setManual] = useState<ManualEntryModel | null>(null);

  const itemName = useMemo(() => {
    const raw = params.itemName;
    if (Array.isArray(raw)) return decodeURIComponent(raw[0]);
    return decodeURIComponent(raw ?? "");
  }, [params.itemName]);

  useEffect(() => {
    const checkManual = async () => {
      try {
        setManualLoading(true);

        const q = query(
          collection(db, "manuals"),
          where("isActive", "==", true)
        );

        const snapshot = await getDocs(q);

        const foundManual =
          snapshot.docs
            .map((docSnap) => ManualEntryModel.fromMap(docSnap.data(), docSnap.id))
            .find(
              (manual) =>
                manual.productName === itemName ||
                manual.productId === itemName ||
                manual.id === itemName
            ) ?? null;

        setManual(foundManual);
        setManualExists(!!foundManual);
      } catch (error) {
        setManualExists(false);
      } finally {
        setManualLoading(false);
      }
    };

    if (itemName) {
      checkManual();
    } else {
      setManualExists(false);
      setManualLoading(false);
    }
  }, [itemName]);

  if (manualLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-200">
        <div className="text-sm font-bold text-gray-500">
          메뉴얼을 확인하는 중입니다.
        </div>
      </div>
    );
  }

  if (!manualExists) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-200 px-6 text-center">
        <div className="w-full max-w-[450px] rounded-[28px] bg-white px-6 py-10 shadow-sm">
          <div className="text-[20px] font-extrabold text-gray-800">
            메뉴얼이 없습니다
          </div>

          <div className="mt-2 text-[14px] leading-6 text-gray-500">
            해당 제품의 메뉴얼이 아직 등록되지 않았습니다.
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="mt-6 h-12 w-full rounded-[18px] bg-[#2f63df] text-[15px] font-bold text-white"
          >
            이전으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center bg-gray-200">
      <div className="w-full max-w-[450px] min-h-screen bg-white">
        <div className="sticky top-0 z-30 bg-gradient-to-b from-[#5f89eb] via-[#2f63df] to-[#224bbb] text-white">
          <header className="relative flex items-center justify-between px-4 py-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="z-10 flex h-11 w-11 items-center justify-center rounded-full text-xl text-white"
            >
              ←
            </button>

            <h2 className="absolute left-1/2 -translate-x-1/2 text-lg font-extrabold">
              IROOM
            </h2>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="z-10 flex h-11 w-11 items-center justify-center rounded-full text-2xl text-white"
            >
              ☰
            </button>
          </header>
        </div>

        {/*맨 위의 부분 */}
        <ManualHeroSection itemName={itemName} />

        {/*비디오 부분 */}
        <VideoGuideSection videos={manual?.videos ?? []} />

        {/*자주 묻는 질문 섹션 */}
        <ManualFAQSection faqs={manual?.faqs ?? []} />


        {/*4개의 버튼 사용방법,  자주 묻는 질문, 소모품 구매, 주의사항*/}
        <ManualQuickMenuSection
          manual={manual}
          onOpenUsage={() => setUsageOpen(true)}
          onOpenFaq={() => setFaqOpen(true)}
          onOpenConsumableShop={() => setConsumableShopOpen(true)}
          onOpenCaution={() => setCautionOpen(true)}
        />


        {/*구성품 안내, 액세서리 등 리스트 섹션 */}
        <ManualInfoListSection
          manual={manual}
          onOpenComponents={() => setComponentsOpen(true)}
          onOpenAccessories={() => setAccessoriesOpen(true)}
          onOpenSpecs={() => setSpecsOpen(true)}
          onOpenWarranty={() => setWarrantyOpen(true)}
          onOpenDownload={() => setDownloadOpen(true)}
        />
      </div>

      <ManualSideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        itemName={itemName}
        onOpenUsage={() => setUsageOpen(true)}
        onOpenConsumableShop={() => setConsumableShopOpen(true)}
        onOpenComponents={() => setComponentsOpen(true)}
        onOpenAccessories={() => setAccessoriesOpen(true)}
        onOpenCaution={() => setCautionOpen(true)}
        onOpenFaq={() => setFaqOpen(true)}
        onOpenSpecs={() => setSpecsOpen(true)}
        onOpenWarranty={() => setWarrantyOpen(true)}
        onOpenDownload={() => setDownloadOpen(true)}
        onOpenVideoGuide={() => {
          window.open(
            "https://www.youtube.com/playlist?list=PLrmK0QyZVAXo0GY5KuYho46zuTPYcdKbd",
            "_blank"
          );
        }}
      />

      {/*사용방법 페이지 */}
      <UsageGuidePage
        open={usageOpen}
        onClose={() => setUsageOpen(false)}
        manual={manual}
      />

      {/*자주 묻는 질문버튼 누르면 나오는 페이지 */}
      <ManualFaqPage
        open={faqOpen}
        onClose={() => setFaqOpen(false)}
        onOpenAI={() => setAiOpen(true)}
        manual={manual}
      />

      {/*소모품 버튼 누르면 나오는 페이지 */}
      <ConsumableShopPage
        open={consumableShopOpen}
        onClose={() => setConsumableShopOpen(false)}
        manual={manual}
      />

      {/*주의사항 버튼 누르면 나오는 페이지 */}
      <CautionPage
        open={cautionOpen}
        onClose={() => setCautionOpen(false)}
      />

      {/*리스트에서 구성품 안내 */}
      <ComponentsGuidePage
        open={componentsOpen}
        onClose={() => setComponentsOpen(false)}
        itemName={itemName}
        manual={manual}
      />

      {/*리스트에서 엑세서리 */}
      <AccessoriesPage
        open={accessoriesOpen}
        onClose={() => setAccessoriesOpen(false)}
        itemName={itemName}
        manual={manual}
      />

      {/*제품 사양 페이지 */}
      <SpecsPage
        open={specsOpen}
        onClose={() => setSpecsOpen(false)}
        manual={manual}
      />

      {/*제품보증 A/S관련 페이지 */}
      <WarrantyPage
        open={warrantyOpen}
        onClose={() => setWarrantyOpen(false)}
        manualId={manual?.id ?? ""}
      />

      {/*메뉴얼 다운로드 페이지 */}
      <ManualDownloadPage
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        itemName={itemName}
        manual={manual}
        onOpenAI={() => setAiOpen(true)}
      />

      <AIPage open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}