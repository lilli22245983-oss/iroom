//제품 메뉴얼 전체 구조 (핵심 중 핵심)

export type ManualHeroMap = {
  smartCareMessages: string[];
  colorImages: {
    white?: string;
    black?: string;
  };
};

export type VideoGuideItemMap = {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  order: number;
};

export type UsageGuideItemMap = {
  id: string;
  title: string;
  image: string;
  description: string;
  order: number;
};

export type ConsumableItemMap = {
  id: string;
  name: string;
  image: string;
  url: string;
  order: number;
};

export type AccessoryItemMap = {
  id: string;
  title: string;
  image: string;
  description: string;
  separatePurchase: boolean;
  order: number;
};

export type SpecDataItemMap = {
  label: string;
  value: string;
};

export type SpecSectionMap = {
  id: string;
  title: string;
  data: SpecDataItemMap[];
  order: number;
};

export type ManualWarrantyMap = {
  title: string;
  content: string;
  isActive: boolean;
};

export type ManualEntryMap = {
  id: string;
  productId: string;
  productName: string;
  hero: ManualHeroMap;
  videos: VideoGuideItemMap[];
  usageGuides: UsageGuideItemMap[];
  consumables: ConsumableItemMap[];
  componentImageUrl: string;
  componentNotice: string;
  accessories: AccessoryItemMap[];
  faqs: {
    id: string;
    question: string;
    answer: string;
    order: number;
  }[];
  specs: SpecSectionMap[];
  warranty: ManualWarrantyMap;
  isActive: boolean;
};

export class VideoGuideItemModel {
  constructor(
    public id: string,
    public title: string,
    public subtitle: string,
    public url: string,
    public order: number = 0
  ) {}

  static fromMap(map: Partial<VideoGuideItemMap>, id?: string): VideoGuideItemModel {
    return new VideoGuideItemModel(
      id ?? map.id ?? "",
      map.title ?? "",
      map.subtitle ?? "",
      map.url ?? "",
      map.order ?? 0
    );
  }

  toMap(): VideoGuideItemMap {
    return {
      id: this.id,
      title: this.title,
      subtitle: this.subtitle,
      url: this.url,
      order: this.order,
    };
  }
}

export class UsageGuideItemModel {
  constructor(
    public id: string,
    public title: string,
    public image: string,
    public description: string,
    public order: number = 0
  ) {}

  static fromMap(map: Partial<UsageGuideItemMap>, id?: string): UsageGuideItemModel {
    return new UsageGuideItemModel(
      id ?? map.id ?? "",
      map.title ?? "",
      map.image ?? "",
      map.description ?? "",
      map.order ?? 0
    );
  }

  toMap(): UsageGuideItemMap {
    return {
      id: this.id,
      title: this.title,
      image: this.image,
      description: this.description,
      order: this.order,
    };
  }
}

export class ConsumableItemModel {
  constructor(
    public id: string,
    public name: string,
    public image: string,
    public url: string,
    public order: number = 0
  ) {}

  static fromMap(map: Partial<ConsumableItemMap>, id?: string): ConsumableItemModel {
    return new ConsumableItemModel(
      id ?? map.id ?? "",
      map.name ?? "",
      map.image ?? "",
      map.url ?? "",
      map.order ?? 0
    );
  }

  toMap(): ConsumableItemMap {
    return {
      id: this.id,
      name: this.name,
      image: this.image,
      url: this.url,
      order: this.order,
    };
  }
}

export class AccessoryItemModel {
  constructor(
    public id: string,
    public title: string,
    public image: string,
    public description: string,
    public separatePurchase: boolean = false,
    public order: number = 0
  ) {}

  static fromMap(map: Partial<AccessoryItemMap>, id?: string): AccessoryItemModel {
    return new AccessoryItemModel(
      id ?? map.id ?? "",
      map.title ?? "",
      map.image ?? "",
      map.description ?? "",
      map.separatePurchase ?? false,
      map.order ?? 0
    );
  }

  toMap(): AccessoryItemMap {
    return {
      id: this.id,
      title: this.title,
      image: this.image,
      description: this.description,
      separatePurchase: this.separatePurchase,
      order: this.order,
    };
  }
}

export class ManualFaqItemModel {
  constructor(
    public id: string,
    public question: string,
    public answer: string,
    public order: number = 0
  ) {}

  static fromMap(
    map: Partial<{ id: string; question: string; answer: string; order: number }>,
    id?: string
  ): ManualFaqItemModel {
    return new ManualFaqItemModel(
      id ?? map.id ?? "",
      map.question ?? "",
      map.answer ?? "",
      map.order ?? 0
    );
  }

  toMap() {
    return {
      id: this.id,
      question: this.question,
      answer: this.answer,
      order: this.order,
    };
  }
}

export class SpecDataItemModel {
  constructor(
    public label: string,
    public value: string
  ) {}

  static fromMap(map: Partial<SpecDataItemMap>): SpecDataItemModel {
    return new SpecDataItemModel(
      map.label ?? "",
      map.value ?? ""
    );
  }

  toMap(): SpecDataItemMap {
    return {
      label: this.label,
      value: this.value,
    };
  }
}

export class SpecSectionModel {
  constructor(
    public id: string,
    public title: string,
    public data: SpecDataItemModel[] = [],
    public order: number = 0
  ) {}

  static fromMap(map: Partial<SpecSectionMap>, id?: string): SpecSectionModel {
    return new SpecSectionModel(
      id ?? map.id ?? "",
      map.title ?? "",
      (map.data ?? []).map((item) => SpecDataItemModel.fromMap(item)),
      map.order ?? 0
    );
  }

  toMap(): SpecSectionMap {
    return {
      id: this.id,
      title: this.title,
      data: this.data.map((item) => item.toMap()),
      order: this.order,
    };
  }
}

export class ManualWarrantyModel {
  constructor(
    public title: string = "제품 보증 안내",
    public content: string = "",
    public isActive: boolean = true
  ) {}

  static fromMap(map?: Partial<ManualWarrantyMap>): ManualWarrantyModel {
    return new ManualWarrantyModel(
      map?.title ?? "제품 보증 안내",
      map?.content ?? "",
      map?.isActive ?? true
    );
  }

  toMap(): ManualWarrantyMap {
    return {
      title: this.title,
      content: this.content,
      isActive: this.isActive,
    };
  }
}

export class ManualEntryModel {
  constructor(
    public id: string,
    public productId: string,
    public productName: string,
    public hero: ManualHeroMap = {
      smartCareMessages: [],
      colorImages: {},
    },
    public videos: VideoGuideItemModel[] = [],
    public usageGuides: UsageGuideItemModel[] = [],
    public consumables: ConsumableItemModel[] = [],
    public componentImageUrl: string = "",
    public componentNotice: string = "",
    public accessories: AccessoryItemModel[] = [],
    public faqs: ManualFaqItemModel[] = [],
    public specs: SpecSectionModel[] = [],
    public warranty: ManualWarrantyModel = new ManualWarrantyModel(),
    public isActive: boolean = true
  ) {}

  static fromMap(map: Partial<ManualEntryMap>, id?: string): ManualEntryModel {
    return new ManualEntryModel(
      id ?? map.id ?? "",
      map.productId ?? "",
      map.productName ?? "",
      map.hero ?? {
        smartCareMessages: [],
        colorImages: {},
      },
      (map.videos ?? []).map((item) => VideoGuideItemModel.fromMap(item)),
      (map.usageGuides ?? []).map((item) => UsageGuideItemModel.fromMap(item)),
      (map.consumables ?? []).map((item) => ConsumableItemModel.fromMap(item)),
      map.componentImageUrl ?? "",
      map.componentNotice ?? "",
      (map.accessories ?? []).map((item) => AccessoryItemModel.fromMap(item)),
      (map.faqs ?? []).map((item) => ManualFaqItemModel.fromMap(item)),
      (map.specs ?? []).map((item) => SpecSectionModel.fromMap(item)),
      ManualWarrantyModel.fromMap(map.warranty),
      map.isActive ?? true
    );
  }

  toMap(): ManualEntryMap {
    return {
      id: this.id,
      productId: this.productId,
      productName: this.productName,
      hero: this.hero,
      videos: this.videos.map((item) => item.toMap()),
      usageGuides: this.usageGuides.map((item) => item.toMap()),
      consumables: this.consumables.map((item) => item.toMap()),
      componentImageUrl: this.componentImageUrl,
      componentNotice: this.componentNotice,
      accessories: this.accessories.map((item) => item.toMap()),
      faqs: this.faqs.map((item) => item.toMap()),
      specs: this.specs.map((item) => item.toMap()),
      warranty: this.warranty.toMap(),
      isActive: this.isActive,
    };
  }
}