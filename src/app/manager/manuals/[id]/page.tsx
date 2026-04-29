"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { uploadImage } from "@/lib/uploadImage";
import { ProductModel } from "@/model/firebase/product_model";
import {
  ManualEntryModel,
  VideoGuideItemModel,
  UsageGuideItemModel,
  ConsumableItemModel,
  AccessoryItemModel,
  ManualFaqItemModel,
  SpecSectionModel,
  SpecDataItemModel,
  ManualWarrantyModel,
} from "@/model/firebase/manual_entry_model";
import {
  ArrowLeft,
  LogOut,
  ShieldCheck,
  Plus,
  Trash2,
  Upload,
  ImageIcon,
} from "lucide-react";

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

type ImageUploadBoxProps = {
  label: string;
  value: string;
  folder: string;
  onChange: (url: string) => void;
};

function ImageUploadBox({
  label,
  value,
  folder,
  onChange,
}: ImageUploadBoxProps) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleSelectImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있어요.");
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);
      setFileName(file.name);

      const uploadedUrl = await uploadImage(file, folder);
      onChange(uploadedUrl);
    } catch (error) {
      alert("이미지 업로드 중 오류가 발생했어요.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-slate-200 bg-white">
            {value ? (
              <img
                src={value}
                alt={label}
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon size={28} className="text-slate-300" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-[16px] border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition active:scale-[0.98]">
              <Upload size={16} />
              {uploading ? "업로드 중..." : "컴퓨터에서 이미지 선택"}

              <input
                type="file"
                accept="image/*"
                onChange={handleSelectImage}
                disabled={uploading}
                className="hidden"
              />
            </label>

            <p className="mt-2 truncate text-[13px] font-medium text-slate-500">
              {fileName || "PNG, JPG, WEBP 이미지를 선택할 수 있어요."}
            </p>

            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setFileName("");
                }}
                className="mt-2 text-[13px] font-bold text-red-500"
              >
                이미지 제거
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManagerManualEditPage() {
  const router = useRouter();
  const params = useParams();

  const manualId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [products, setProducts] = useState<ProductModel[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [smartCareMessages, setSmartCareMessages] = useState<string[]>([""]);
  const [whiteImage, setWhiteImage] = useState("");
  const [blackImage, setBlackImage] = useState("");

  const [videos, setVideos] = useState<VideoGuideItemModel[]>([]);
  const [usageGuides, setUsageGuides] = useState<UsageGuideItemModel[]>([]);
  const [consumables, setConsumables] = useState<ConsumableItemModel[]>([]);

  const [componentImageUrl, setComponentImageUrl] = useState("");
  const [componentNotice, setComponentNotice] = useState("");

  const [accessories, setAccessories] = useState<AccessoryItemModel[]>([]);
  const [faqs, setFaqs] = useState<ManualFaqItemModel[]>([]);
  const [specs, setSpecs] = useState<SpecSectionModel[]>([]);

  const [warrantyTitle, setWarrantyTitle] = useState("제품 보증 안내");
  const [warrantyContent, setWarrantyContent] = useState("");
  const [warrantyIsActive, setWarrantyIsActive] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/manager/login");
        return;
      }

      try {
        const adminRef = doc(db, "admin_users", user.uid);
        const adminSnap = await getDoc(adminRef);

        if (!adminSnap.exists() || adminSnap.data().role !== "manager") {
          await signOut(auth);
          router.replace("/manager/login");
          return;
        }

        setChecking(false);
        await Promise.all([loadProducts(), loadManual()]);
      } catch (error) {
        await signOut(auth);
        router.replace("/manager/login");
      }
    });

    return () => unsubscribe();
  }, [router, manualId]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);

      const snapshot = await getDocs(collection(db, "products"));
      const items = snapshot.docs
        .map((doc) => ProductModel.fromMap(doc.data(), doc.id))
        .sort((a, b) => {
          const brandCompare = (a.brandName ?? "").localeCompare(
            b.brandName ?? "",
            "ko"
          );
          if (brandCompare !== 0) return brandCompare;
          return (a.name ?? "").localeCompare(b.name ?? "", "ko");
        });

      setProducts(items);
    } catch (error) {
      alert("제품 목록을 불러오지 못했어요.");
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadManual = async () => {
    try {
      setLoading(true);

      if (!manualId || typeof manualId !== "string") {
        alert("잘못된 매뉴얼 경로예요.");
        router.replace("/manager/manuals");
        return;
      }

      const snapshot = await getDoc(doc(db, "manuals", manualId));

      if (!snapshot.exists()) {
        alert("매뉴얼을 찾을 수 없어요.");
        router.replace("/manager/manuals");
        return;
      }

      const manual = ManualEntryModel.fromMap(snapshot.data(), snapshot.id);

      setSelectedProductId(manual.productId);
      setIsActive(manual.isActive);

      setSmartCareMessages(
        manual.hero?.smartCareMessages?.length
          ? manual.hero.smartCareMessages
          : [""]
      );

      setWhiteImage(manual.hero?.colorImages?.white ?? "");
      setBlackImage(manual.hero?.colorImages?.black ?? "");

      setVideos(
        manual.videos?.length
          ? manual.videos
          : [new VideoGuideItemModel(createId("video"), "", "", "", 0)]
      );

      setUsageGuides(
        manual.usageGuides?.length
          ? manual.usageGuides
          : [new UsageGuideItemModel(createId("usage"), "", "", "", 0)]
      );

      setConsumables(
        manual.consumables?.length
          ? manual.consumables
          : [new ConsumableItemModel(createId("consumable"), "", "", "", 0)]
      );

      setComponentImageUrl(manual.componentImageUrl ?? "");
      setComponentNotice(manual.componentNotice ?? "");

      setAccessories(
        manual.accessories?.length
          ? manual.accessories
          : [
              new AccessoryItemModel(
                createId("accessory"),
                "",
                "",
                "",
                false,
                0
              ),
            ]
      );

      setFaqs(
        manual.faqs?.length
          ? manual.faqs
          : [new ManualFaqItemModel(createId("faq"), "", "", 0)]
      );

      setSpecs(
        manual.specs?.length
          ? manual.specs
          : [
              new SpecSectionModel(
                createId("spec"),
                "",
                [new SpecDataItemModel("", "")],
                0
              ),
            ]
      );

      setWarrantyTitle(manual.warranty?.title || "제품 보증 안내");
      setWarrantyContent(manual.warranty?.content || "");
      setWarrantyIsActive(manual.warranty?.isActive ?? true);
    } catch (error) {
      alert("매뉴얼을 불러오지 못했어요.");
      router.replace("/manager/manuals");
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = useMemo(() => {
    return products.find((item) => item.id === selectedProductId) ?? null;
  }, [products, selectedProductId]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/manager/login");
    } catch (error) {
      alert("로그아웃 중 오류가 발생했어요.");
    }
  };

  const updateVideo = (
    index: number,
    key: keyof VideoGuideItemModel,
    value: string | number
  ) => {
    setVideos((prev) =>
      prev.map((item, i) =>
        i === index
          ? new VideoGuideItemModel(
              item.id,
              key === "title" ? String(value) : item.title,
              key === "subtitle" ? String(value) : item.subtitle,
              key === "url" ? String(value) : item.url,
              key === "order" ? Number(value) : item.order
            )
          : item
      )
    );
  };

  const updateUsageGuide = (
    index: number,
    key: keyof UsageGuideItemModel,
    value: string | number
  ) => {
    setUsageGuides((prev) =>
      prev.map((item, i) =>
        i === index
          ? new UsageGuideItemModel(
              item.id,
              key === "title" ? String(value) : item.title,
              key === "image" ? String(value) : item.image,
              key === "description" ? String(value) : item.description,
              key === "order" ? Number(value) : item.order
            )
          : item
      )
    );
  };

  const updateConsumable = (
    index: number,
    key: keyof ConsumableItemModel,
    value: string | number
  ) => {
    setConsumables((prev) =>
      prev.map((item, i) =>
        i === index
          ? new ConsumableItemModel(
              item.id,
              key === "name" ? String(value) : item.name,
              key === "image" ? String(value) : item.image,
              key === "url" ? String(value) : item.url,
              key === "order" ? Number(value) : item.order
            )
          : item
      )
    );
  };

  const updateAccessory = (
    index: number,
    key: keyof AccessoryItemModel,
    value: string | number | boolean
  ) => {
    setAccessories((prev) =>
      prev.map((item, i) =>
        i === index
          ? new AccessoryItemModel(
              item.id,
              key === "title" ? String(value) : item.title,
              key === "image" ? String(value) : item.image,
              key === "description" ? String(value) : item.description,
              key === "separatePurchase"
                ? Boolean(value)
                : item.separatePurchase,
              key === "order" ? Number(value) : item.order
            )
          : item
      )
    );
  };

  const updateFaq = (
    index: number,
    key: keyof ManualFaqItemModel,
    value: string | number
  ) => {
    setFaqs((prev) =>
      prev.map((item, i) =>
        i === index
          ? new ManualFaqItemModel(
              item.id,
              key === "question" ? String(value) : item.question,
              key === "answer" ? String(value) : item.answer,
              key === "order" ? Number(value) : item.order
            )
          : item
      )
    );
  };

  const updateSpecTitle = (sectionIndex: number, value: string) => {
    setSpecs((prev) =>
      prev.map((section, i) =>
        i === sectionIndex
          ? new SpecSectionModel(section.id, value, section.data, section.order)
          : section
      )
    );
  };

  const updateSpecOrder = (sectionIndex: number, value: number) => {
    setSpecs((prev) =>
      prev.map((section, i) =>
        i === sectionIndex
          ? new SpecSectionModel(section.id, section.title, section.data, value)
          : section
      )
    );
  };

  const updateSpecData = (
    sectionIndex: number,
    dataIndex: number,
    key: keyof SpecDataItemModel,
    value: string
  ) => {
    setSpecs((prev) =>
      prev.map((section, i) => {
        if (i !== sectionIndex) return section;

        const nextData = section.data.map((data, j) =>
          j === dataIndex
            ? new SpecDataItemModel(
                key === "label" ? value : data.label,
                key === "value" ? value : data.value
              )
            : data
        );

        return new SpecSectionModel(
          section.id,
          section.title,
          nextData,
          section.order
        );
      })
    );
  };

  const addSpecDataRow = (sectionIndex: number) => {
    setSpecs((prev) =>
      prev.map((section, i) =>
        i === sectionIndex
          ? new SpecSectionModel(
              section.id,
              section.title,
              [...section.data, new SpecDataItemModel("", "")],
              section.order
            )
          : section
      )
    );
  };

  const removeSpecDataRow = (sectionIndex: number, dataIndex: number) => {
    setSpecs((prev) =>
      prev.map((section, i) => {
        if (i !== sectionIndex) return section;

        const nextData = section.data.filter((_, j) => j !== dataIndex);
        return new SpecSectionModel(
          section.id,
          section.title,
          nextData.length ? nextData : [new SpecDataItemModel("", "")],
          section.order
        );
      })
    );
  };

  const handleSave = async () => {
    if (!manualId || typeof manualId !== "string") {
      alert("잘못된 매뉴얼 경로예요.");
      return;
    }

    if (!selectedProduct) {
      alert("연결할 제품을 선택해주세요.");
      return;
    }

    try {
      setSaving(true);

      const snapshot = await getDocs(collection(db, "manuals"));
      const duplicated = snapshot.docs.some((docSnap) => {
        if (docSnap.id === manualId) return false;
        const item = ManualEntryModel.fromMap(docSnap.data(), docSnap.id);
        return item.productId === selectedProduct.id;
      });

      if (duplicated) {
        alert("선택한 제품에는 이미 다른 매뉴얼이 연결되어 있어요.");
        return;
      }

      const payload = new ManualEntryModel(
        manualId,
        selectedProduct.id,
        selectedProduct.name,
        {
          smartCareMessages: smartCareMessages
            .map((item) => item.trim())
            .filter(Boolean),
          colorImages: {
            white: whiteImage.trim(),
            black: blackImage.trim(),
          },
        },
        videos
          .filter(
            (item) =>
              item.title.trim() || item.subtitle.trim() || item.url.trim()
          )
          .map(
            (item, index) =>
              new VideoGuideItemModel(
                item.id || createId("video"),
                item.title.trim(),
                item.subtitle.trim(),
                item.url.trim(),
                Number.isFinite(item.order) ? item.order : index
              )
          ),
        usageGuides
          .filter(
            (item) =>
              item.title.trim() || item.image.trim() || item.description.trim()
          )
          .map(
            (item, index) =>
              new UsageGuideItemModel(
                item.id || createId("usage"),
                item.title.trim(),
                item.image.trim(),
                item.description.trim(),
                Number.isFinite(item.order) ? item.order : index
              )
          ),
        consumables
          .filter(
            (item) => item.name.trim() || item.image.trim() || item.url.trim()
          )
          .map(
            (item, index) =>
              new ConsumableItemModel(
                item.id || createId("consumable"),
                item.name.trim(),
                item.image.trim(),
                item.url.trim(),
                Number.isFinite(item.order) ? item.order : index
              )
          ),
        componentImageUrl.trim(),
        componentNotice.trim(),
        accessories
          .filter(
            (item) =>
              item.title.trim() || item.image.trim() || item.description.trim()
          )
          .map(
            (item, index) =>
              new AccessoryItemModel(
                item.id || createId("accessory"),
                item.title.trim(),
                item.image.trim(),
                item.description.trim(),
                !!item.separatePurchase,
                Number.isFinite(item.order) ? item.order : index
              )
          ),
        faqs
          .filter((item) => item.question.trim() || item.answer.trim())
          .map(
            (item, index) =>
              new ManualFaqItemModel(
                item.id || createId("faq"),
                item.question.trim(),
                item.answer.trim(),
                Number.isFinite(item.order) ? item.order : index
              )
          ),
        specs
          .filter(
            (section) =>
              section.title.trim() ||
              section.data.some((row) => row.label.trim() || row.value.trim())
          )
          .map(
            (section, index) =>
              new SpecSectionModel(
                section.id || createId("spec"),
                section.title.trim(),
                section.data
                  .filter((row) => row.label.trim() || row.value.trim())
                  .map(
                    (row) =>
                      new SpecDataItemModel(row.label.trim(), row.value.trim())
                  ),
                Number.isFinite(section.order) ? section.order : index
              )
          ),
        new ManualWarrantyModel(
          warrantyTitle.trim() || "제품 보증 안내",
          warrantyContent.trim(),
          warrantyIsActive
        ),
        isActive
      );

      await updateDoc(doc(db, "manuals", manualId), payload.toMap());

      alert("매뉴얼이 수정되었어요.");
      router.push("/manager/manuals");
    } catch (error) {
      alert("매뉴얼 수정 중 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  };

  if (checking || loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#eef6ff_0%,#f8fbff_42%,#f4f7fb_100%)] px-5 py-8 text-slate-900">
        <div className="mx-auto flex min-h-[70vh] items-center justify-center">
          <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-600 shadow-sm">
            매뉴얼 정보를 불러오는 중...
          </div>
        </div>
      </main>
    );
  }

  const cardClass =
    "rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]";
  const inputClass =
    "h-12 w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-[14px] text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white";
  const textareaClass =
    "w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white";
  const labelClass = "mb-2 block text-sm font-bold text-slate-700";

  return (
    <main
      className="relative min-h-screen overflow-hidden px-5 pb-10 pt-5 sm:px-6"
      style={{
        background:
          "linear-gradient(180deg, #eef6ff 0%, #f8fbff 42%, #f4f7fb 100%)",
        color: "#0f172a",
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-16 top-[-10px] h-52 w-52 rounded-full blur-3xl"
          style={{ background: "rgba(96, 165, 250, 0.18)" }}
        />
        <div
          className="absolute right-[-30px] top-[120px] h-56 w-56 rounded-full blur-3xl"
          style={{ background: "rgba(125, 211, 252, 0.16)" }}
        />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push("/manager/manuals")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:scale-[1.01] active:scale-[0.99]"
          >
            <ArrowLeft size={16} />
            매뉴얼 목록
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:scale-[1.01] active:scale-[0.99]"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </div>

        <section className="mt-7">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em]"
            style={{
              backgroundColor: "#ecfdf5",
              color: "#15803d",
              border: "1px solid #bbf7d0",
            }}
          >
            <ShieldCheck size={14} />
            Manual Edit
          </div>

          <h1 className="mt-5 text-[34px] font-black leading-[1.05] tracking-[-0.04em] sm:text-[42px]">
            매뉴얼 수정
          </h1>

          <p className="mt-3 text-[15px] leading-7 text-slate-600">
            저장된 매뉴얼 정보를 수정할 수 있어요.
          </p>
        </section>

        <div className="mt-6 space-y-5">
          <section className={cardClass}>
            <h2 className="text-[20px] font-black text-slate-900">기본 정보</h2>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>연결 제품</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className={inputClass}
                  disabled={loadingProducts}
                >
                  <option value="">
                    {loadingProducts ? "제품 불러오는 중..." : "제품을 선택하세요"}
                  </option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      [{product.brandName || "브랜드 없음"}] {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>사용 여부</label>
                <select
                  value={isActive ? "true" : "false"}
                  onChange={(e) => setIsActive(e.target.value === "true")}
                  className={inputClass}
                >
                  <option value="true">사용</option>
                  <option value="false">숨김</option>
                </select>
              </div>
            </div>

            {selectedProduct && (
              <div className="mt-4 rounded-[20px] bg-slate-50 px-4 py-4 text-sm text-slate-600">
                선택된 제품:{" "}
                <span className="font-bold text-slate-900">
                  [{selectedProduct.brandName || "브랜드 없음"}]{" "}
                  {selectedProduct.name}
                </span>
              </div>
            )}
          </section>

          <section className={cardClass}>
            <h2 className="text-[20px] font-black text-slate-900">히어로 영역</h2>

            <div className="mt-5">
              <label className={labelClass}>스마트케어 문구</label>

              <div className="space-y-3">
                {smartCareMessages.map((message, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      value={message}
                      onChange={(e) =>
                        setSmartCareMessages((prev) =>
                          prev.map((item, i) =>
                            i === index ? e.target.value : item
                          )
                        )
                      }
                      placeholder="예: 흡입력이 약해졌어요"
                      className={inputClass}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setSmartCareMessages((prev) => {
                          const next = prev.filter((_, i) => i !== index);
                          return next.length ? next : [""];
                        })
                      }
                      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-red-200 bg-red-50 text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setSmartCareMessages((prev) => [...prev, ""])}
                className="mt-3 inline-flex items-center gap-2 rounded-[16px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
              >
                <Plus size={16} />
                문구 추가
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <ImageUploadBox
                label="화이트 이미지"
                value={whiteImage}
                folder="manuals/hero"
                onChange={setWhiteImage}
              />

              <ImageUploadBox
                label="블랙 이미지"
                value={blackImage}
                folder="manuals/hero"
                onChange={setBlackImage}
              />
            </div>
          </section>

          <section className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[20px] font-black text-slate-900">
                영상 가이드
              </h2>

              <button
                type="button"
                onClick={() =>
                  setVideos((prev) => [
                    ...prev,
                    new VideoGuideItemModel(
                      createId("video"),
                      "",
                      "",
                      "",
                      prev.length
                    ),
                  ])
                }
                className="inline-flex items-center gap-2 rounded-[16px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
              >
                <Plus size={16} />
                영상 추가
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {videos.map((video, index) => (
                <div
                  key={video.id}
                  className="rounded-[22px] border border-slate-200 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-bold text-slate-800">영상 {index + 1}</p>

                    <button
                      type="button"
                      onClick={() =>
                        setVideos((prev) => {
                          const next = prev.filter(
                            (item) => item.id !== video.id
                          );
                          return next.length
                            ? next
                            : [
                                new VideoGuideItemModel(
                                  createId("video"),
                                  "",
                                  "",
                                  "",
                                  0
                                ),
                              ];
                        })
                      }
                      className="inline-flex items-center gap-2 rounded-[14px] border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600"
                    >
                      <Trash2 size={15} />
                      삭제
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>제목</label>
                      <input
                        value={video.title}
                        onChange={(e) =>
                          updateVideo(index, "title", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>부제목</label>
                      <input
                        value={video.subtitle}
                        onChange={(e) =>
                          updateVideo(index, "subtitle", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>영상 URL</label>
                      <input
                        value={video.url}
                        onChange={(e) =>
                          updateVideo(index, "url", e.target.value)
                        }
                        className={inputClass}
                        placeholder="유튜브 영상 링크"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>정렬 순서</label>
                      <input
                        type="number"
                        value={video.order}
                        onChange={(e) =>
                          updateVideo(index, "order", Number(e.target.value))
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[20px] font-black text-slate-900">
                사용 가이드
              </h2>

              <button
                type="button"
                onClick={() =>
                  setUsageGuides((prev) => [
                    ...prev,
                    new UsageGuideItemModel(
                      createId("usage"),
                      "",
                      "",
                      "",
                      prev.length
                    ),
                  ])
                }
                className="inline-flex items-center gap-2 rounded-[16px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
              >
                <Plus size={16} />
                가이드 추가
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {usageGuides.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-[22px] border border-slate-200 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-bold text-slate-800">
                      가이드 {index + 1}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setUsageGuides((prev) => {
                          const next = prev.filter((x) => x.id !== item.id);
                          return next.length
                            ? next
                            : [
                                new UsageGuideItemModel(
                                  createId("usage"),
                                  "",
                                  "",
                                  "",
                                  0
                                ),
                              ];
                        })
                      }
                      className="inline-flex items-center gap-2 rounded-[14px] border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600"
                    >
                      <Trash2 size={15} />
                      삭제
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className={labelClass}>제목</label>
                      <input
                        value={item.title}
                        onChange={(e) =>
                          updateUsageGuide(index, "title", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>

                    <ImageUploadBox
                      label="이미지"
                      value={item.image}
                      folder="manuals/usage-guides"
                      onChange={(url) =>
                        updateUsageGuide(index, "image", url)
                      }
                    />

                    <div>
                      <label className={labelClass}>설명</label>
                      <textarea
                        rows={4}
                        value={item.description}
                        onChange={(e) =>
                          updateUsageGuide(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        className={textareaClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>정렬 순서</label>
                      <input
                        type="number"
                        value={item.order}
                        onChange={(e) =>
                          updateUsageGuide(
                            index,
                            "order",
                            Number(e.target.value)
                          )
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[20px] font-black text-slate-900">소모품</h2>

              <button
                type="button"
                onClick={() =>
                  setConsumables((prev) => [
                    ...prev,
                    new ConsumableItemModel(
                      createId("consumable"),
                      "",
                      "",
                      "",
                      prev.length
                    ),
                  ])
                }
                className="inline-flex items-center gap-2 rounded-[16px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
              >
                <Plus size={16} />
                소모품 추가
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {consumables.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-[22px] border border-slate-200 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-bold text-slate-800">
                      소모품 {index + 1}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setConsumables((prev) => {
                          const next = prev.filter((x) => x.id !== item.id);
                          return next.length
                            ? next
                            : [
                                new ConsumableItemModel(
                                  createId("consumable"),
                                  "",
                                  "",
                                  "",
                                  0
                                ),
                              ];
                        })
                      }
                      className="inline-flex items-center gap-2 rounded-[14px] border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600"
                    >
                      <Trash2 size={15} />
                      삭제
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>이름</label>
                      <input
                        value={item.name}
                        onChange={(e) =>
                          updateConsumable(index, "name", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>정렬 순서</label>
                      <input
                        type="number"
                        value={item.order}
                        onChange={(e) =>
                          updateConsumable(
                            index,
                            "order",
                            Number(e.target.value)
                          )
                        }
                        className={inputClass}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <ImageUploadBox
                        label="이미지"
                        value={item.image}
                        folder="manuals/consumables"
                        onChange={(url) =>
                          updateConsumable(index, "image", url)
                        }
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className={labelClass}>링크 URL</label>
                      <input
                        value={item.url}
                        onChange={(e) =>
                          updateConsumable(index, "url", e.target.value)
                        }
                        className={inputClass}
                        placeholder="구매 링크"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={cardClass}>
            <h2 className="text-[20px] font-black text-slate-900">구성품 안내</h2>

            <div className="mt-5 grid grid-cols-1 gap-4">
              <ImageUploadBox
                label="구성품 이미지"
                value={componentImageUrl}
                folder="manuals/components"
                onChange={setComponentImageUrl}
              />

              <div>
                <label className={labelClass}>구성품 안내 문구</label>
                <textarea
                  rows={4}
                  value={componentNotice}
                  onChange={(e) => setComponentNotice(e.target.value)}
                  className={textareaClass}
                />
              </div>
            </div>
          </section>

          <section className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[20px] font-black text-slate-900">액세서리</h2>

              <button
                type="button"
                onClick={() =>
                  setAccessories((prev) => [
                    ...prev,
                    new AccessoryItemModel(
                      createId("accessory"),
                      "",
                      "",
                      "",
                      false,
                      prev.length
                    ),
                  ])
                }
                className="inline-flex items-center gap-2 rounded-[16px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
              >
                <Plus size={16} />
                액세서리 추가
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {accessories.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-[22px] border border-slate-200 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-bold text-slate-800">
                      액세서리 {index + 1}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setAccessories((prev) => {
                          const next = prev.filter((x) => x.id !== item.id);
                          return next.length
                            ? next
                            : [
                                new AccessoryItemModel(
                                  createId("accessory"),
                                  "",
                                  "",
                                  "",
                                  false,
                                  0
                                ),
                              ];
                        })
                      }
                      className="inline-flex items-center gap-2 rounded-[14px] border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600"
                    >
                      <Trash2 size={15} />
                      삭제
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className={labelClass}>제목</label>
                        <input
                          value={item.title}
                          onChange={(e) =>
                            updateAccessory(index, "title", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>정렬 순서</label>
                        <input
                          type="number"
                          value={item.order}
                          onChange={(e) =>
                            updateAccessory(
                              index,
                              "order",
                              Number(e.target.value)
                            )
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <ImageUploadBox
                      label="이미지"
                      value={item.image}
                      folder="manuals/accessories"
                      onChange={(url) => updateAccessory(index, "image", url)}
                    />

                    <div>
                      <label className={labelClass}>설명</label>
                      <textarea
                        rows={4}
                        value={item.description}
                        onChange={(e) =>
                          updateAccessory(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        className={textareaClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>별도 구매 여부</label>
                      <select
                        value={item.separatePurchase ? "true" : "false"}
                        onChange={(e) =>
                          updateAccessory(
                            index,
                            "separatePurchase",
                            e.target.value === "true"
                          )
                        }
                        className={inputClass}
                      >
                        <option value="false">기본 포함</option>
                        <option value="true">별도 구매</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[20px] font-black text-slate-900">
                제품 보증
              </h2>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4">
              <div>
                <label className={labelClass}>보증 사용 여부</label>
                <select
                  value={warrantyIsActive ? "true" : "false"}
                  onChange={(e) => setWarrantyIsActive(e.target.value === "true")}
                  className={inputClass}
                >
                  <option value="true">사용</option>
                  <option value="false">숨김</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>보증 제목</label>
                <input
                  value={warrantyTitle}
                  onChange={(e) => setWarrantyTitle(e.target.value)}
                  className={inputClass}
                  placeholder="예: 제품 보증 안내"
                />
              </div>

              <div>
                <label className={labelClass}>보증 내용</label>
                <textarea
                  rows={8}
                  value={warrantyContent}
                  onChange={(e) => setWarrantyContent(e.target.value)}
                  className={textareaClass}
                  placeholder={`예:
구입일로부터 1년간 무상 보증이 제공됩니다.
소모품 및 고객 과실로 인한 고장은 보증 대상에서 제외됩니다.
A/S 접수 시 구매 영수증 또는 구매 내역이 필요할 수 있습니다.`}
                />
                <p className="mt-2 text-[13px] font-medium text-slate-500">
                  한 줄씩 입력하면 사용자 화면에서 항목처럼 나눠서 표시돼요.
                </p>
              </div>
            </div>
          </section>

          <section className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[20px] font-black text-slate-900">
                매뉴얼 FAQ
              </h2>

              <button
                type="button"
                onClick={() =>
                  setFaqs((prev) => [
                    ...prev,
                    new ManualFaqItemModel(createId("faq"), "", "", prev.length),
                  ])
                }
                className="inline-flex items-center gap-2 rounded-[16px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
              >
                <Plus size={16} />
                FAQ 추가
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {faqs.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-[22px] border border-slate-200 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-bold text-slate-800">FAQ {index + 1}</p>

                    <button
                      type="button"
                      onClick={() =>
                        setFaqs((prev) => {
                          const next = prev.filter((x) => x.id !== item.id);
                          return next.length
                            ? next
                            : [
                                new ManualFaqItemModel(
                                  createId("faq"),
                                  "",
                                  "",
                                  0
                                ),
                              ];
                        })
                      }
                      className="inline-flex items-center gap-2 rounded-[14px] border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600"
                    >
                      <Trash2 size={15} />
                      삭제
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className={labelClass}>질문</label>
                      <input
                        value={item.question}
                        onChange={(e) =>
                          updateFaq(index, "question", e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>답변</label>
                      <textarea
                        rows={4}
                        value={item.answer}
                        onChange={(e) =>
                          updateFaq(index, "answer", e.target.value)
                        }
                        className={textareaClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>정렬 순서</label>
                      <input
                        type="number"
                        value={item.order}
                        onChange={(e) =>
                          updateFaq(index, "order", Number(e.target.value))
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[20px] font-black text-slate-900">
                제품 사양
              </h2>

              <button
                type="button"
                onClick={() =>
                  setSpecs((prev) => [
                    ...prev,
                    new SpecSectionModel(
                      createId("spec"),
                      "",
                      [new SpecDataItemModel("", "")],
                      prev.length
                    ),
                  ])
                }
                className="inline-flex items-center gap-2 rounded-[16px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
              >
                <Plus size={16} />
                사양 섹션 추가
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {specs.map((section, sectionIndex) => (
                <div
                  key={section.id}
                  className="rounded-[22px] border border-slate-200 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-bold text-slate-800">
                      사양 섹션 {sectionIndex + 1}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setSpecs((prev) => {
                          const next = prev.filter((x) => x.id !== section.id);
                          return next.length
                            ? next
                            : [
                                new SpecSectionModel(
                                  createId("spec"),
                                  "",
                                  [new SpecDataItemModel("", "")],
                                  0
                                ),
                              ];
                        })
                      }
                      className="inline-flex items-center gap-2 rounded-[14px] border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600"
                    >
                      <Trash2 size={15} />
                      삭제
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>섹션 제목</label>
                      <input
                        value={section.title}
                        onChange={(e) =>
                          updateSpecTitle(sectionIndex, e.target.value)
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>정렬 순서</label>
                      <input
                        type="number"
                        value={section.order}
                        onChange={(e) =>
                          updateSpecOrder(
                            sectionIndex,
                            Number(e.target.value)
                          )
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {section.data.map((row, dataIndex) => (
                      <div
                        key={dataIndex}
                        className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]"
                      >
                        <input
                          value={row.label}
                          onChange={(e) =>
                            updateSpecData(
                              sectionIndex,
                              dataIndex,
                              "label",
                              e.target.value
                            )
                          }
                          placeholder="항목명"
                          className={inputClass}
                        />

                        <input
                          value={row.value}
                          onChange={(e) =>
                            updateSpecData(
                              sectionIndex,
                              dataIndex,
                              "value",
                              e.target.value
                            )
                          }
                          placeholder="값"
                          className={inputClass}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeSpecDataRow(sectionIndex, dataIndex)
                          }
                          className="inline-flex h-12 items-center justify-center rounded-[16px] border border-red-200 bg-red-50 px-4 text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addSpecDataRow(sectionIndex)}
                    className="mt-4 inline-flex items-center gap-2 rounded-[16px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
                  >
                    <Plus size={16} />
                    항목 추가
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push("/manager/manuals")}
              className="rounded-[18px] border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700"
            >
              취소
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-[18px] px-5 py-3 text-sm font-extrabold text-white transition disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                background:
                  "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                boxShadow: "0 14px 28px rgba(37,99,235,0.22)",
              }}
            >
              {saving ? "저장 중..." : "매뉴얼 저장"}
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}