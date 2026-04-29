"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addDoc, collection, doc, getDoc, getDocs } from "firebase/firestore";
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
} from "lucide-react";

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

type FileMap = Record<string, File | undefined>;
type PreviewMap = Record<string, string | undefined>;

function ImageUploadBox({
  label,
  fileName,
  previewUrl,
  onChange,
}: {
  label: string;
  fileName?: string;
  previewUrl?: string;
  onChange: (file: File) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <label className="flex cursor-pointer items-center gap-4 rounded-[20px] border border-dashed border-blue-200 bg-blue-50/50 px-4 py-4 transition hover:border-blue-400 hover:bg-blue-50">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-white text-blue-600 shadow-sm">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Upload size={20} />
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            if (!file.type.startsWith("image/")) {
              alert("이미지 파일만 업로드할 수 있어요.");
              e.target.value = "";
              return;
            }

            onChange(file);
            e.target.value = "";
          }}
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-black text-slate-800">
            {fileName || "컴퓨터에서 이미지 선택"}
          </p>
          <p className="mt-1 text-[12px] font-semibold text-slate-500">
            PNG, JPG, WEBP 업로드 가능
          </p>
        </div>
      </label>
    </div>
  );
}

function ManagerManualNewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [products, setProducts] = useState<ProductModel[]>([]);
  const [selectedProductId, setSelectedProductId] = useState(
    searchParams.get("productId") ?? ""
  );
  const [isActive, setIsActive] = useState(true);

  const [smartCareMessages, setSmartCareMessages] = useState<string[]>([""]);

  const [whiteImageFile, setWhiteImageFile] = useState<File | null>(null);
  const [blackImageFile, setBlackImageFile] = useState<File | null>(null);
  const [whitePreview, setWhitePreview] = useState("");
  const [blackPreview, setBlackPreview] = useState("");

  const [videos, setVideos] = useState<VideoGuideItemModel[]>([
    new VideoGuideItemModel(createId("video"), "", "", "", 0),
  ]);

  const [usageGuides, setUsageGuides] = useState<UsageGuideItemModel[]>([
    new UsageGuideItemModel(createId("usage"), "", "", "", 0),
  ]);
  const [usageFiles, setUsageFiles] = useState<FileMap>({});
  const [usagePreviews, setUsagePreviews] = useState<PreviewMap>({});

  const [consumables, setConsumables] = useState<ConsumableItemModel[]>([
    new ConsumableItemModel(createId("consumable"), "", "", "", 0),
  ]);
  const [consumableFiles, setConsumableFiles] = useState<FileMap>({});
  const [consumablePreviews, setConsumablePreviews] = useState<PreviewMap>({});

  const [componentImageFile, setComponentImageFile] = useState<File | null>(null);
  const [componentPreview, setComponentPreview] = useState("");
  const [componentNotice, setComponentNotice] = useState("");

  const [accessories, setAccessories] = useState<AccessoryItemModel[]>([
    new AccessoryItemModel(createId("accessory"), "", "", "", false, 0),
  ]);
  const [accessoryFiles, setAccessoryFiles] = useState<FileMap>({});
  const [accessoryPreviews, setAccessoryPreviews] = useState<PreviewMap>({});

  const [faqs, setFaqs] = useState<ManualFaqItemModel[]>([
    new ManualFaqItemModel(createId("faq"), "", "", 0),
  ]);

  const [specs, setSpecs] = useState<SpecSectionModel[]>([
    new SpecSectionModel(
      createId("spec"),
      "",
      [new SpecDataItemModel("", "")],
      0
    ),
  ]);

  const [warrantyTitle, setWarrantyTitle] = useState("제품 보증 안내");
  const [warrantyContent, setWarrantyContent] = useState("");
  const [warrantyIsActive, setWarrantyIsActive] = useState(true);

  const cardClass =
    "rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]";
  const inputClass =
    "h-12 w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-[14px] text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white";
  const textareaClass =
    "w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white";
  const labelClass = "mb-2 block text-sm font-bold text-slate-700";

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
        await loadProducts();
      } catch (error) {
        await signOut(auth);
        router.replace("/manager/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);

      const snapshot = await getDocs(collection(db, "products"));
      const items = snapshot.docs
        .map((docSnap) => ProductModel.fromMap(docSnap.data(), docSnap.id))
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

  const setFileWithPreview = (
    file: File,
    id: string,
    setFiles: React.Dispatch<React.SetStateAction<FileMap>>,
    setPreviews: React.Dispatch<React.SetStateAction<PreviewMap>>
  ) => {
    setFiles((prev) => ({ ...prev, [id]: file }));
    setPreviews((prev) => ({ ...prev, [id]: URL.createObjectURL(file) }));
  };

  const uploadIfExists = async (
    file: File | null | undefined,
    folder: string
  ) => {
    if (!file) return "";
    return await uploadImage(file, folder);
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
              key === "separatePurchase" ? Boolean(value) : item.separatePurchase,
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

  const removeSmartCareMessage = (index: number) => {
    setSmartCareMessages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [""];
    });
  };

  const handleSave = async () => {
    if (!selectedProduct) {
      alert("연결할 제품을 선택해주세요.");
      return;
    }

    try {
      setSaving(true);

      const existsSnapshot = await getDocs(collection(db, "manuals"));
      const exists = existsSnapshot.docs.some((docSnap) => {
        const item = ManualEntryModel.fromMap(docSnap.data(), docSnap.id);
        return item.productId === selectedProduct.id;
      });

      if (exists) {
        alert("이 제품은 이미 매뉴얼이 있어요. 목록에서 수정으로 들어가주세요.");
        return;
      }

      const baseFolder = `manuals/${selectedProduct.id}`;

      const whiteImageUrl = await uploadIfExists(
        whiteImageFile,
        `${baseFolder}/hero`
      );

      const blackImageUrl = await uploadIfExists(
        blackImageFile,
        `${baseFolder}/hero`
      );

      const componentImageUrl = await uploadIfExists(
        componentImageFile,
        `${baseFolder}/components`
      );

      const uploadedUsageGuides = await Promise.all(
        usageGuides
          .filter(
            (item) =>
              item.title.trim() ||
              usageFiles[item.id] ||
              item.description.trim()
          )
          .map(async (item, index) => {
            const imageUrl = await uploadIfExists(
              usageFiles[item.id],
              `${baseFolder}/usage-guides`
            );

            return new UsageGuideItemModel(
              item.id || createId("usage"),
              item.title.trim(),
              imageUrl,
              item.description.trim(),
              Number.isFinite(item.order) ? item.order : index
            );
          })
      );

      const uploadedConsumables = await Promise.all(
        consumables
          .filter(
            (item) =>
              item.name.trim() || consumableFiles[item.id] || item.url.trim()
          )
          .map(async (item, index) => {
            const imageUrl = await uploadIfExists(
              consumableFiles[item.id],
              `${baseFolder}/consumables`
            );

            return new ConsumableItemModel(
              item.id || createId("consumable"),
              item.name.trim(),
              imageUrl,
              item.url.trim(),
              Number.isFinite(item.order) ? item.order : index
            );
          })
      );

      const uploadedAccessories = await Promise.all(
        accessories
          .filter(
            (item) =>
              item.title.trim() ||
              accessoryFiles[item.id] ||
              item.description.trim()
          )
          .map(async (item, index) => {
            const imageUrl = await uploadIfExists(
              accessoryFiles[item.id],
              `${baseFolder}/accessories`
            );

            return new AccessoryItemModel(
              item.id || createId("accessory"),
              item.title.trim(),
              imageUrl,
              item.description.trim(),
              !!item.separatePurchase,
              Number.isFinite(item.order) ? item.order : index
            );
          })
      );

      const payload = new ManualEntryModel(
        "",
        selectedProduct.id,
        selectedProduct.name,
        {
          smartCareMessages: smartCareMessages
            .map((item) => item.trim())
            .filter(Boolean),
          colorImages: {
            white: whiteImageUrl,
            black: blackImageUrl,
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
        uploadedUsageGuides,
        uploadedConsumables,
        componentImageUrl,
        componentNotice.trim(),
        uploadedAccessories,
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

      await addDoc(collection(db, "manuals"), payload.toMap());

      alert("매뉴얼이 저장되었어요.");
      router.push("/manager/manuals");
    } catch (error) {
      alert("매뉴얼 저장 중 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#eef6ff_0%,#f8fbff_42%,#f4f7fb_100%)] px-5 py-8 text-slate-900">
        <div className="mx-auto flex min-h-[70vh] items-center justify-center">
          <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-600 shadow-sm">
            관리자 인증 확인 중...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden px-5 pb-10 pt-5 sm:px-6"
      style={{
        background:
          "linear-gradient(180deg, #eef6ff 0%, #f8fbff 42%, #f4f7fb 100%)",
        color: "#0f172a",
      }}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push("/manager/manuals")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm"
          >
            <ArrowLeft size={16} />
            매뉴얼 목록
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </div>

        <section className="mt-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-700">
            <ShieldCheck size={14} />
            Manual Create
          </div>

          <h1 className="mt-5 text-[34px] font-black leading-[1.05] tracking-[-0.04em] sm:text-[42px]">
            매뉴얼 추가
          </h1>

          <p className="mt-3 text-[15px] leading-7 text-slate-600">
            제품을 선택하고 매뉴얼 상세 정보를 입력해주세요.
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

            <div className="mt-5 space-y-3">
              <label className={labelClass}>스마트케어 문구</label>

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
                    placeholder="예: 강력한 흡입력으로 뭐든 다 빨아들여요"
                    className={inputClass}
                  />

                  <button
                    type="button"
                    onClick={() => removeSmartCareMessage(index)}
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-red-200 bg-red-50 text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setSmartCareMessages((prev) => [...prev, ""])}
                className="inline-flex items-center gap-2 rounded-[16px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
              >
                <Plus size={16} />
                문구 추가
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <ImageUploadBox
                label="화이트 이미지"
                fileName={whiteImageFile?.name}
                previewUrl={whitePreview}
                onChange={(file) => {
                  setWhiteImageFile(file);
                  setWhitePreview(URL.createObjectURL(file));
                }}
              />

              <ImageUploadBox
                label="블랙 이미지"
                fileName={blackImageFile?.name}
                previewUrl={blackPreview}
                onChange={(file) => {
                  setBlackImageFile(file);
                  setBlackPreview(URL.createObjectURL(file));
                }}
              />
            </div>
          </section>

          <section className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[20px] font-black text-slate-900">영상 가이드</h2>

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
                          const next = prev.filter((item) => item.id !== video.id);
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
                    <input
                      value={video.title}
                      onChange={(e) => updateVideo(index, "title", e.target.value)}
                      placeholder="제목"
                      className={inputClass}
                    />

                    <input
                      value={video.subtitle}
                      onChange={(e) =>
                        updateVideo(index, "subtitle", e.target.value)
                      }
                      placeholder="부제목"
                      className={inputClass}
                    />

                    <input
                      value={video.url}
                      onChange={(e) => updateVideo(index, "url", e.target.value)}
                      placeholder="영상 URL"
                      className={inputClass}
                    />

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
              ))}
            </div>
          </section>

          <section className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[20px] font-black text-slate-900">사용 가이드</h2>

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
                    <p className="font-bold text-slate-800">가이드 {index + 1}</p>

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
                    <input
                      value={item.title}
                      onChange={(e) =>
                        updateUsageGuide(index, "title", e.target.value)
                      }
                      placeholder="제목"
                      className={inputClass}
                    />

                    <ImageUploadBox
                      label="가이드 이미지"
                      fileName={usageFiles[item.id]?.name}
                      previewUrl={usagePreviews[item.id]}
                      onChange={(file) =>
                        setFileWithPreview(
                          file,
                          item.id,
                          setUsageFiles,
                          setUsagePreviews
                        )
                      }
                    />

                    <textarea
                      rows={4}
                      value={item.description}
                      onChange={(e) =>
                        updateUsageGuide(index, "description", e.target.value)
                      }
                      placeholder="설명"
                      className={textareaClass}
                    />

                    <input
                      type="number"
                      value={item.order}
                      onChange={(e) =>
                        updateUsageGuide(index, "order", Number(e.target.value))
                      }
                      className={inputClass}
                    />
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
                    <p className="font-bold text-slate-800">소모품 {index + 1}</p>

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
                    <input
                      value={item.name}
                      onChange={(e) =>
                        updateConsumable(index, "name", e.target.value)
                      }
                      placeholder="이름"
                      className={inputClass}
                    />

                    <input
                      type="number"
                      value={item.order}
                      onChange={(e) =>
                        updateConsumable(index, "order", Number(e.target.value))
                      }
                      className={inputClass}
                    />

                    <div className="md:col-span-2">
                      <ImageUploadBox
                        label="소모품 이미지"
                        fileName={consumableFiles[item.id]?.name}
                        previewUrl={consumablePreviews[item.id]}
                        onChange={(file) =>
                          setFileWithPreview(
                            file,
                            item.id,
                            setConsumableFiles,
                            setConsumablePreviews
                          )
                        }
                      />
                    </div>

                    <input
                      value={item.url}
                      onChange={(e) =>
                        updateConsumable(index, "url", e.target.value)
                      }
                      placeholder="링크 URL"
                      className={`${inputClass} md:col-span-2`}
                    />
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
                fileName={componentImageFile?.name}
                previewUrl={componentPreview}
                onChange={(file) => {
                  setComponentImageFile(file);
                  setComponentPreview(URL.createObjectURL(file));
                }}
              />

              <textarea
                rows={4}
                value={componentNotice}
                onChange={(e) => setComponentNotice(e.target.value)}
                placeholder="구성품 안내 문구"
                className={textareaClass}
              />
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
                    <input
                      value={item.title}
                      onChange={(e) =>
                        updateAccessory(index, "title", e.target.value)
                      }
                      placeholder="제목"
                      className={inputClass}
                    />

                    <ImageUploadBox
                      label="액세서리 이미지"
                      fileName={accessoryFiles[item.id]?.name}
                      previewUrl={accessoryPreviews[item.id]}
                      onChange={(file) =>
                        setFileWithPreview(
                          file,
                          item.id,
                          setAccessoryFiles,
                          setAccessoryPreviews
                        )
                      }
                    />

                    <textarea
                      rows={4}
                      value={item.description}
                      onChange={(e) =>
                        updateAccessory(index, "description", e.target.value)
                      }
                      placeholder="설명"
                      className={textareaClass}
                    />

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

                    <input
                      type="number"
                      value={item.order}
                      onChange={(e) =>
                        updateAccessory(index, "order", Number(e.target.value))
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={cardClass}>
            <h2 className="text-[20px] font-black text-slate-900">제품 보증</h2>

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
                  placeholder="예: 제품 보증 안내"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>보증 내용</label>
                <textarea
                  rows={8}
                  value={warrantyContent}
                  onChange={(e) => setWarrantyContent(e.target.value)}
                  placeholder={`예:
구입일로부터 1년간 무상 보증이 제공됩니다.
소모품 및 고객 과실로 인한 고장은 보증 대상에서 제외됩니다.
A/S 접수 시 구매 영수증 또는 구매 내역이 필요할 수 있습니다.`}
                  className={textareaClass}
                />
                <p className="mt-2 text-[13px] font-medium text-slate-500">
                  한 줄씩 입력하면 사용자 화면에서 항목처럼 나눠서 표시돼요.
                </p>
              </div>
            </div>
          </section>

          <section className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[20px] font-black text-slate-900">매뉴얼 FAQ</h2>

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
                  <input
                    value={item.question}
                    onChange={(e) => updateFaq(index, "question", e.target.value)}
                    placeholder="질문"
                    className={inputClass}
                  />

                  <textarea
                    rows={4}
                    value={item.answer}
                    onChange={(e) => updateFaq(index, "answer", e.target.value)}
                    placeholder="답변"
                    className={`${textareaClass} mt-3`}
                  />

                  <div className="mt-3 flex gap-2">
                    <input
                      type="number"
                      value={item.order}
                      onChange={(e) =>
                        updateFaq(index, "order", Number(e.target.value))
                      }
                      className={inputClass}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setFaqs((prev) => {
                          const next = prev.filter((x) => x.id !== item.id);
                          return next.length
                            ? next
                            : [new ManualFaqItemModel(createId("faq"), "", "", 0)];
                        })
                      }
                      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-red-200 bg-red-50 text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[20px] font-black text-slate-900">제품 사양</h2>

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
                    <input
                      value={section.title}
                      onChange={(e) =>
                        updateSpecTitle(sectionIndex, e.target.value)
                      }
                      placeholder="섹션 제목"
                      className={inputClass}
                    />

                    <input
                      type="number"
                      value={section.order}
                      onChange={(e) =>
                        updateSpecOrder(sectionIndex, Number(e.target.value))
                      }
                      className={inputClass}
                    />
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
              {saving ? "이미지 업로드 및 저장 중..." : "매뉴얼 저장"}
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function ManagerManualNewPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[linear-gradient(180deg,#eef6ff_0%,#f8fbff_42%,#f4f7fb_100%)] px-5 py-8 text-slate-900">
          <div className="mx-auto flex min-h-[70vh] items-center justify-center">
            <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-600 shadow-sm">
              페이지 불러오는 중...
            </div>
          </div>
        </main>
      }
    >
      <ManagerManualNewPageContent />
    </Suspense>
  );
}