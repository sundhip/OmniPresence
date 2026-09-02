import 'package:equatable/equatable.dart';

class WardrobeItemModel extends Equatable {
  final String id;
  final String category;
  final String subcategory;
  final String name;
  final List<String> colors;
  final String? material;
  final List<String> seasons;
  final String formality;
  final String fit;
  final String? brand;
  final String? imageUrl;
  final double purchasePrice;
  final int wearCount;
  final DateTime? lastWornDate;
  final String status;
  final int syncVersion;

  const WardrobeItemModel({
    required this.id,
    required this.category,
    required this.subcategory,
    required this.name,
    this.colors = const [],
    this.material,
    this.seasons = const ['Spring', 'Summer', 'Fall', 'Winter'],
    this.formality = 'Casual',
    this.fit = 'Regular',
    this.brand,
    this.imageUrl,
    this.purchasePrice = 0.0,
    this.wearCount = 0,
    this.lastWornDate,
    this.status = 'available',
    this.syncVersion = 1,
  });

  WardrobeItemModel copyWith({
    String? name,
    String? category,
    String? subcategory,
    List<String>? colors,
    String? formality,
    int? wearCount,
    DateTime? lastWornDate,
    String? status,
    int? syncVersion,
  }) {
    return WardrobeItemModel(
      id: id,
      category: category ?? this.category,
      subcategory: subcategory ?? this.subcategory,
      name: name ?? this.name,
      colors: colors ?? this.colors,
      material: material,
      seasons: seasons,
      formality: formality ?? this.formality,
      fit: fit,
      brand: brand,
      imageUrl: imageUrl,
      purchasePrice: purchasePrice,
      wearCount: wearCount ?? this.wearCount,
      lastWornDate: lastWornDate ?? this.lastWornDate,
      status: status ?? this.status,
      syncVersion: syncVersion ?? this.syncVersion,
    );
  }

  factory WardrobeItemModel.fromJson(Map<String, dynamic> json) {
    return WardrobeItemModel(
      id: json['id'] ?? '',
      category: json['category'] ?? 'Tops',
      subcategory: json['subcategory'] ?? 'Shirts',
      name: json['name'] ?? '',
      colors: List<String>.from(json['colors'] ?? []),
      material: json['material'],
      seasons: List<String>.from(json['seasons'] ?? []),
      formality: json['formality'] ?? 'Casual',
      fit: json['fit'] ?? 'Regular',
      brand: json['brand'],
      imageUrl: json['image_url'],
      purchasePrice: (json['purchase_price'] as num?)?.toDouble() ?? 0.0,
      wearCount: json['wear_count'] ?? 0,
      lastWornDate: json['last_worn_date'] != null ? DateTime.tryParse(json['last_worn_date']) : null,
      status: json['status'] ?? 'available',
      syncVersion: json['sync_version'] ?? 1,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'category': category,
      'subcategory': subcategory,
      'name': name,
      'colors': colors,
      'material': material,
      'seasons': seasons,
      'formality': formality,
      'fit': fit,
      'brand': brand,
      'image_url': imageUrl,
      'purchase_price': purchasePrice,
      'wear_count': wearCount,
      'last_worn_date': lastWornDate?.toIso8601String(),
      'status': status,
      'sync_version': syncVersion,
    };
  }

  @override
  List<Object?> get props => [id, category, subcategory, name, colors, formality, wearCount, lastWornDate, status];
}

class WearEventModel extends Equatable {
  final String id;
  final String wardrobeItemId;
  final String? outfitId;
  final DateTime timestamp;
  final String eventContext;
  final String source;

  const WearEventModel({
    required this.id,
    required this.wardrobeItemId,
    this.outfitId,
    required this.timestamp,
    this.eventContext = 'Daily',
    this.source = 'manual',
  });

  factory WearEventModel.fromJson(Map<String, dynamic> json) {
    return WearEventModel(
      id: json['id'] ?? '',
      wardrobeItemId: json['wardrobe_item_id'] ?? '',
      outfitId: json['outfit_id'],
      timestamp: DateTime.tryParse(json['timestamp'] ?? '') ?? DateTime.now(),
      eventContext: json['event_context'] ?? 'Daily',
      source: json['source'] ?? 'manual',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'wardrobe_item_id': wardrobeItemId,
      'outfit_id': outfitId,
      'timestamp': timestamp.toIso8601String(),
      'event_context': eventContext,
      'source': source,
    };
  }

  @override
  List<Object?> get props => [id, wardrobeItemId, timestamp, eventContext];
}

class PlannedOutfitModel extends Equatable {
  final String id;
  final String name;
  final List<String> itemIds;
  final String plannedDate;
  final String occasion;
  final double score;
  final String status;

  const PlannedOutfitModel({
    required this.id,
    required this.name,
    required this.itemIds,
    required this.plannedDate,
    required this.occasion,
    this.score = 0.0,
    this.status = 'planned',
  });

  factory PlannedOutfitModel.fromJson(Map<String, dynamic> json) {
    return PlannedOutfitModel(
      id: json['id'] ?? '',
      name: json['name'] ?? 'Planned Outfit',
      itemIds: List<String>.from(json['item_ids'] ?? []),
      plannedDate: json['planned_date'] ?? '',
      occasion: json['occasion'] ?? 'Casual',
      score: (json['score'] as num?)?.toDouble() ?? 0.0,
      status: json['status'] ?? 'planned',
    );
  }

  @override
  List<Object?> get props => [id, name, itemIds, plannedDate, occasion, score];
}
